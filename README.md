gmail-safe
==========

Easy commandline-driven backups of your Google Mail data.

Quick Start
-----------

    $ npm install -g gmail-safe
    $ gmail_safe ./path/to/store -u USERNAME -p PASSWORD

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
 - **WILL** support incremental backup. I have a plan to implement this but it isn't in this release yet. If I can get it working correctly, it should be stupidly fast (to the point where it may become my default MUA (mail user agent).
 - Saves meta-data like conversations and labels in a secure, local-only redis database. At this time that data just sort of sits there, but eventually I hope to write tools to let you re-import your mail to Google using this database to preserve labels and threads. For now you can be confident that nothing was lost. Labels and threads do NOT appear in downloaded emails directly as those extensions are not part of the email spec.
 - Is designed from the ground up to be run in the background, eg. as a background (cron) job. (Ok, in this very early release this still needs a tiny bit of work, but it's going to get there very soon.)
 - Supports Google Application-Specific Passwords so people with two-factor authentication can still use it. (This comes *gratis*, it just replaces your normal password.)

Installation
------------

Currently `gmail-safe` has three external dependencies you will need to install yourself:

 - [Redis 2.4 or higher](http://redis.io/download)
 - [Node.js 0.6.x](http://nodejs.org/)
 - [NPM](http://npmjs.org/)

If there is much demand I will probably make available a more complete guide for installing these dependencies - but really, it isn't very hard.

From there, just follow the quick start guide. :)

Plannead Features
-----------------

 - Better backgrounding support (supress stdout & progress bar)
 - Asynchronous simultaneous email fetching - not sure if IMAP will support this
 - Incremental backup (suppress re-downloading emails)
 - Metadata transfer/import
 - Configuration file so you don't need to have your password on the command line

Most of these features are fairly simple to implement - mostly I just need motivation. So if you want this feature (or any other!) just file an issue on github.