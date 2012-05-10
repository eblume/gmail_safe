#!/usr/local/bin/node

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

// Hook the process exit patterns to mainloop
process.on('exit', function() {
  mainloop.emit('exit');
});
process.on('uncaughtException', function(err) {
  mainloop.emit('exit',err);
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
  configure_local_env(opts);
  // Connect to the gmail server
  console.log("Connecting to Google Mail...");
  var gm = new gmi();
  gm.connect(opts.username,opts.password,function() {
    console.log("Connected.");
    mainloop.emit('imap_connect',gm);
  });
});


// imap_connect - when the 'gm' interface connects to the server
mainloop.on('imap_connect', function(gm) {
  if (opts.incremental) {
    fs.readFile(lastfile(),"utf8",function(err,data) {
      mainloop.emit('fetch',gm,JSON.parse(data));
    });
  } else {
    mainloop.emit('fetch',gm);
  }
});

// fetch - after finding the previously stored email id (or none), fetch.
mainloop.on('fetch',function(gm,previous_email_id) {
  var fetcher;
  var bar; // No, like, literally a bar. Not a meta-syntactic variable.
  var lastid;

  if (opts.incremental && previous_email_id) {
    // Fetch only the emails since the given mailbox ID
    console.log("Only fetching emails after the mailbox ID:", previous_email_id);
    fetcher = gm.get({'id_gt':previous_email_id});
  } else {
    console.log("Fetching ALL emails (this may take a while)");
    fetcher = gm.get(); // Fetch ALL the mails! (apologies to Ms. Allie)
  }

  fetcher.once('end',function(){
    console.log();
    var lastfile = path.join(opts.directory,'meta','lastid.txt');
    fs.writeFile(lastfile,JSON.stringify(lastid),"utf8",die);
    mainloop.emit('close',gm);
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
    var emlfile = path.join(opts.directory,msg.id + ".eml");
    var metafile = path.join(opts.directory,msg.id + ".meta");
    lastid = msg.boxid > lastid ? msg.boxid : lastid;
    fs.writeFile(emlfile,msg.eml,"utf8",die);
    var storeobj = {
      "id": msg.id,
      "boxid": msg.boxid,
      "thread": msg.thread,
      "date": msg.date,
      "labels": msg.labels
      // Skip msg.eml to avoid storing the entire email (for now anyway)
    };
    fs.writeFile(metafile,JSON.stringify(storeobj),"utf8",die);
  });
});

// A 'gentle' start to stopping the program.
// Success flows through this event.
mainloop.on('close',function(gm) {
  async.parallel([
    // Previously there were some other things we did before logging out.
    // Rather than remove this async.parallel call, I'll leave it in, in
    // case something in the future needs to be done.
    function(done) {
      gm.logout(function(err) {
        done(err);
      })
    }
  ],function(err) {
    mainloop.emit('exit',err);
  });
});



// HELPER FUNCTIONS


// Do some basic setup of the work directory
var configure_local_env = function(opts) {
  var work_path = path.resolve(opts.directory); // Absolute path resolution.
  maybe_create_path(work_path);
  var meta_path = path.join(work_path,"meta/");
  maybe_create_path(meta_path);
}

// Construct the path of the lastid file
var lastfile = function(workdir) {
  return path.join(workdir,'meta','lastfile.txt');
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
