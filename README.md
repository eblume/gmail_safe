Project Abandoned
-----------------

With apologies, this project has long since been abandoned. Please file an issue if you would like to discuss the future of the project.

Quick Start
-----------

First, be sure to install [node](http://nodejs.org/). Once that's done:

    $ npm install -g gmail-safe
    $ gmail_safe ./download/directory -u USERNAME -p PASSWORD --incremental

The specified directory will be created with the `0770` permission code if it does not already exist, and the database will be initialized if it does not yet exist.

About
-----

gmail_safe was inspired by a desire to back up my Google Mail. I surveyed some of the options already available but could find none that met all my criteria:

 - Run decently fast
 - Support incremental backup
 - Can be run in the background (eg. from a `cron` script)
 - Save thread information (Google Mail 'conversations')
 - Save Google Mail labels
 - and Save attachments & alternate bodies in the standard email format

gmail_safe does all that, and it does it fast (**I get about 20 emails per second**) and without using much CPU or RAM. Perfect for a cron job.

Installation
------------

Currently `gmail_safe` has an external dependency you will need to install yourself:

 - [Node.js 0.6.x](http://nodejs.org/)

From there, just follow the quick start guide.

Note: be sure to install `gmail_safe` using `npm install -g gmail-safe` - without the -g (which tells npm to install the gmail_safe executable globally) or the environment will break and `gmail_safe` will not function. If you know why, please file an issue to help point me in the right direction.

FAQ / Troubleshooting
---------------------

- Q: **How can I run `gmail_safe` from a cron job?**

  A: `gmail_safe` can be very easily stored as a cron job using the `-i` and
     `-c FILE` options, as well as redirecting the output to /dev/null. (Better
     logging is a planned feature.) Writing the cron job is beyond the scope
     of this README, but it isn't hard to do. Here is an example config file:

         {
            "username": "your_username@gmail.com",
            "password": "your_password_OR_app_specific_passphrase"
         }

Planned Features
-----------------

 - Better backgrounding support (supress stdout & progress bar)
 - Metadata transfer/import

Most of these features are fairly simple to implement - mostly I just need motivation. So if you want this feature (or any other!) just file an issue on github.

Legal Boilerplate
-----------------

This project is Copyright (c) 2012 Erich Blume &lt;blume.erich@gmail.com&gt;.

Google and Google Mail are trademarks owned by Google. I am not Google. I do not own these trademarks. Hopefully everyone understands that this modest little app only serves to increase Google Mail's adoption, by whatever small amount.

This project is licensed under the MIT license, which is a permissive open-source license. See the LICENSE file for the full terms of the licensing. If this project didn't come with a LICENSE file, then someone messed up (probably me) and you can get a copy at [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php).
