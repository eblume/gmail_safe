gmail-safe
==========

Easy commandline-driven backups of your Google Mail data.

Quick Start
-----------

    $ npm install -g gmail-safe
    $ gmail_safe ./download/directory -u USERNAME -p PASSWORD --incremental

The specified directory will be created with the `0770` permission code if it does not already exist, and the database will be initialized if it does not yet exist.

Legal Boilerplate
-----------------

This project is Copyright (c) 2012 Erich Blume &lt;blume.erich@gmail.com&gt;.

Google and Google Mail are trademarks owned by Google. I am not Google. I do not own these trademarks. Hopefully everyone understands that this modest little app only serves to increase Google Mail's adoption, by whatever small amount.

This project is licensed under the MIT license, which is a permissive open-source license. See the LICENSE file for the full terms of the copyright. If this project didn't come with a LICENSE file, then someone messed up (probably me) and you can get a copy at [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php).

About
-----

`gmail-safe` was inspired by a desire to back up my Google Mail. I surveyed some of the options already available but could find none that were:

 - Decently fast
 - Supported incremental backup
 - Could be run in the background (eg. from a `cron` script)
 - Saved thread information (Google Mail 'conversations')
 - Saved Google Mail labels
 - and Saved attachments & alternate bodies in the standard email format

In that regard, `gmail-safe`:

 - Is pretty darn fast. How fast? On my home internet connection, I get about 16 emails per second - and that's including emails that have attachments.
 - Is not CPU or RAM intensive. It can easily run in the background. It will saturate your network connection a bit (but not too baddly) but it uses less than 10% of my CPU and about 100 MB of RAM, even with huge data sets.
 - Supports incremental backup (with --incremental).
 - Saves meta-data like conversations and labels in a secure, local-only redis database. At this time that data just sort of sits there, but eventually I hope to write tools to let you re-import your mail to Google using this database to preserve labels and threads. For now you can be confident that nothing was lost. Labels and threads do NOT appear in downloaded emails directly as those extensions are not part of the email spec.
 - Is designed from the ground up to be run in the background, eg. as a background (cron) job. (Ok, in this very early release this still needs a tiny bit of work, but it's going to get there very soon. For now, just redirect STDOUT to /dev/null. I'll build better logging soon, let me know if you need it ASAP!)
 - Supports Google Application-Specific Passwords so people with two-factor authentication can still use it. (This comes *gratis* with IMAP, it just replaces your normal password.)

Installation
------------

Currently `gmail-safe` has three external dependencies you will need to install yourself:

 - [Node.js 0.6.x](http://nodejs.org/)
 - [Redis 2.4 or higher](http://redis.io/download)

If there is much demand I will probably make available a more complete guide for installing these dependencies - but really, it isn't very hard.

From there, just follow the quick start guide. :)

Note: be sure to install `gmail-safe` using `npm install -g gmail-safe` - without the -g (which tells npm to install the gmail_safe executable globally) or the environment will break and `gmail-safe` will not function. If you know why, please file an issue to help point me in the right direction.

FAQ / Troubleshooting
---------------------

- Q: **Help! I accidentally deleted a file / broke the database / etc.!**

  A: No problem! First, delete the `meta` folder from within the download
     directory. Then, re-run `gmail_safe`. It should fix itself just fine,
     although you may need to delete the emails too just to be sure. Your
     call.

- Q: **How can I run `gmail_safe` from a cron job?**

  A: `gmail_safe` can be very easily stored as a cron job using the `-i` and
     `-c FILE` options, as well as redirecting the output to /dev/null. (Better
     logging is a planned feature.) Writing the cron job is beyond the scope
     of this README, but it isn't hard to do. Here is an example config file:

         {
            "username": "your_username@gmail.com",
            "password": "your_password_OR_app_specific_passphrase"
         }

Plannead Features
-----------------

 - Better backgrounding support (supress stdout & progress bar)
 - Metadata transfer/import

Most of these features are fairly simple to implement - mostly I just need motivation. So if you want this feature (or any other!) just file an issue on github.