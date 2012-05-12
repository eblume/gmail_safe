#!/usr/bin/env node

var gmi = require('gmail').GMailInterface,
  ProgressBar = require('progress2');
  path = require('path'),
  EE = require('events').EventEmitter,
  async = require('async'),
  fs = require('node-fs');

var opts = require('nomnom')
  .option('directory',{
    flag: false,
    help: "Store results in <directory>, which will be created if need be.",
    position: 0,
    required: true,
    type: "string"
  })
  .option('username',{
    flag: false,
    abbr: 'u',
    help: "Username, an email ending in @gmail.com",
    type: "string",
    metavar: "USERNAME"
  })
  .option('password',{
    flag: false,
    abbr: 'p',
    help: "Password, or an application-specific password.",
    type: "string",
    metavar: "PASSWORD"
  })
  .option('incremental', {
    flag: true,
    abbr: 'i',
    help: "Only download emails which have not already been downloaded."
  })
  .option('config', {
    abbr: 'c',
    default: false,
    help: 'JSON configuration file with the fields "username" and "password"',
    type: "string",
    metavar: "FILE"
  })
  .parse();


// Deal with the config file
if(opts.config) {
  var conf = JSON.parse(fs.readFileSync(opts.config,'utf8'));
  opts.username = opts.username || conf.username;
  opts.password = opts.password || conf.password;
} else if (!opts.username || !opts.password) {
  console.log("Error: must specify either --config or both --username and --password");
  process.exit(1);
}


var mainloop = new EE();
// Script globals - breaks re-entrance but this is a standalone script, so ok
var gm;

// Hook the process exit patterns to mainloop
process.on('uncaughtException', function(err) {
  mainloop.emit('exit',err);
});

// Hook SIGINT to do a safer shutdown
var caught_SIGINT = false;
process.on('SIGINT', function() {
  if (caught_SIGINT) {
    process.exit(1);
  }
  caught_SIGINT = true;
  console.log("Caught SIGINT, shutting down safely. Press CTRL+C again to abort immediatly.");
  console.log("(If a download is in-progress, you will need to press CTRL+C again.)");
  mainloop.emit('close');
});

// Create a helper to get to die on errors for callbacks.
var die = function(err) {
  if(err) {
    mainloop.emit('exit',err);
  }
}

// For some reason, possibly an error, close it all down.
// It is safe to call process.exit() here, although note
// that this code can be run by someone else calling process.exit()
// - the magic of Node somehow handles this appropriately.
//
// Do NOT call this event directly for a normal shutdown. Instead,
// call 'close'.
//
// This handler MUST block, and MUST NOT return. IE, it cannot
// be asynchronous. (Obviously, as there won't be a next tick.)
mainloop.once('exit',function(err) {
  // Cleanup
  console.log("Closing connections...");

  // Quit
  if (err) {
    console.log("Fatal Error:");
    console.log(err);
    process.exit(1);
  } else {
    console.log("Finished (OK).");
    process.exit(0);
  }
});

// Main entrant
mainloop.once('main',function() {
  configure_local_env();
  // Connect to the gmail server
  console.log("Connecting to Google Mail...");
  gm = new gmi();
  gm.connect(opts.username,opts.password,function() {
    console.log("Connected.");
    mainloop.emit('imap_connect');
  });
});


// imap_connect - when the 'gm' interface connects to the server
mainloop.on('imap_connect', function() {
  if (opts.incremental && path.existsSync(lastfile())) {
    fs.readFile(lastfile(),"utf8",function(err,data) {
      mainloop.emit('fetch',JSON.parse(data));
    });
  } else {
    mainloop.emit('fetch');
  }
});

// fetch - after finding the previously stored email id (or none), fetch.
mainloop.on('fetch',function(previous_email_id) {
  var fetcher;
  var bar; // No, like, literally a bar. Not a meta-syntactic variable.
  var lastid = 0;
  var writequeue = async.queue(function(task,cb){
    fs.writeFile(task.file,task.data,"utf8",die);
    cb();
  }, 255);

  if (opts.incremental && previous_email_id) {
    console.log("Only fetching emails from the UID:", previous_email_id);
    fetcher = gm.get({'uid_from':previous_email_id});
  } else {
    console.log("Fetching ALL emails (this may take a while)");
    fetcher = gm.get(); // Fetch ALL the mails! (apologies to Ms. Allie)
  }

  fetcher.once('end',function(){
    console.log();
    if (lastid > 0) {
      writequeue.push({file:lastfile(),data:JSON.stringify(lastid)},die);
      writequeue.drain = function() {mainloop.emit('close');};
    } else {
      mainloop.emit('close');
    }
  });
  fetcher.on('fetching',function(ids,cancel) {
    if (ids.length > 0) {
      console.log("Fetching ",ids.length,"emails.");
      bar = new ProgressBar('[:bar] :percent (:elapsed/:finish) :eta', {
        total: ids.length,
        width: 40,
      });
    } else {
      console.log("Nothing to fetch.");
      cancel();
    }
  });
  fetcher.on('fetched',function(msg){
    bar.tick(1);
    var emlfile = path.join(workdir(),msg.id + ".eml");
    var metafile = path.join(metadir(),msg.id + ".meta");
    lastid = msg.uid > lastid ? msg.uid : lastid;
    var storeobj = {
      "id": msg.id,
      "uid": msg.uid,
      "thread": msg.thread,
      "date": msg.date,
      "labels": msg.labels
      // Skip msg.eml to avoid storing the entire email (for now anyway)
    };
    write_tasks = [
      {file:emlfile, data:msg.eml},
      {file:metafile, data:JSON.stringify(storeobj)},
      {file:lastfile(), data:JSON.stringify(lastid)}
    ];
    writequeue.push(write_tasks,die);
  });
});

// A 'gentle' start to stopping the program.
// Success flows through this event.
mainloop.on('close',function() {
  console.log("Shutting down safely...");
  async.parallel([
    // Nothing parallel right now - but I'll leave this in for later
    function(done) { gm.logout(done); },
  ],
  function(err) {
    mainloop.emit('exit',err);
  });
});



// HELPER FUNCTIONS


// Do some basic setup of the work directory
var configure_local_env = function() {
  maybe_create_path(workdir());
  maybe_create_path(metadir());
}

// Construct the path of the work directory
var workdir = function() {
  return path.resolve(opts.directory)
}

// Construct the path of the meta directory
var metadir = function() {
  return path.join(workdir(),'.meta')
}

// Construct the path of the lastid file
var lastfile = function() {
  return path.join(metadir(),'lastid.txt');
}

// Create the path even if it or parts of it exist or don't exist yet,
// Or maybe don't create it if it already exists completely.
// Also, do this recursively and do it with mode 0770 (user-group r/w/e)
var maybe_create_path = function (path) {
  // The majority of the work here uses 'node-fs''s hooks to mkdir*
  try {
    fs.mkdirSync(path,true,0770);
  } catch (e) {
    // Do nothing - the dir already existed.
  }
}



// And finally, cause the main entrant. No code below this, please.
mainloop.emit('main');
