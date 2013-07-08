BeepBeep Console: A Graphical Front-End for the BeepBeep Monitor
================================================================

(User Manual, version 2013-07-04)

**WARNING:** These instructions are still under construction!

Table of contents                                                    {#toc}
-----------------

- [Installation](#install)
- [Setting up a proxy](#proxy)
- [Starting BeepBeep](#start)

Installation                                                     {#install}
------------

First make sure you have the following installed:

- [BeepBeep](http://beepbeep.sourceforge.net), the runtime monitor whose
  present tool is a GUI front-end for. There is not much point in using
  BeepBeep Console if you don't have BeepBeep. Please refer to its own
  documentation for installation instructions and a tutorial on what is
  runtime monitoring.
- A web server. Any modern web server will do, although the present
  instructions will provide examples using [Apache](http://apache.org).
- A web browser with JavaScript enabled. The BeepBeep console should work
  without any trouble in most modern browsers, but has only been thoroughly
  tested with Mozilla Firefox.

Clone the repository; on the command line, this can be done by typing:

    git clone git@github.com:sylvainhalle/BeepBeepConsole.git

Move the contents of the `Source` folder into the folder of your choice
under the web server's home directory. If Apache is the web server, this
directory may be located at `/var/www`, or into some folder called `htdocs`.
Please refer to the documentation of your web server to know where its home
directory is. In the following, we assume that the files for BeepBeep
Console are located in a folder called `beepbeepconsole` under the server's
home directory.

You can then test that the console has been installed correctly by opening
a web browser and typing the following in the URL bar:

    http://localhost/beepbeepconsole

Replace `localhost` by the IP address (or domain name) of the web server, if
you are not connected to it directly.

Setting up a proxy                                                 {#proxy}
------------------

The previous installation steps correctly placed the console on the web
server, but the console is not yet ready to interact with a running instance
of the BeepBeep monitor. Because of browsers' [Same-Origin
Policy](https://developer.mozilla.org/en/Same_origin_policy_for_JavaScript)
(SOP), a web application typically cannot send Ajax requests to a server
different from the one hosting the page where the script resides --or even
to the same server, but on a different port number. Therefore, even if the
BeepBeep console is hosted on `localhost`, and BeepBeep itself runs on
`localhost` listening to port 7778, the BeepBeep console *can't* communicate
with BeepBeep --the browser forbids it.

A nice workaround to this problem has been described on
[StackOverflow](http://stackoverflow.com/questions/2099728/how-do-i-send-an-ajax-request-on-a-different-port-with-jquery).
It consists of setting up a very simple reverse proxy (using `mod_proxy` if
you are on Apache). This would allow you to use relative paths in your Ajax
request, while the HTTP server would be acting as a proxy to any "remote"
location. To install the proxy functionality, one must enable the modules
`proxy` and `proxy_http` in the Apache configuration, which come with
default Apache installtions. This is relatively straightforward using the
`a2enmod` command:

    a2enmod proxy
    a2enmod proxy_http

The fundamental configuration directive to set up a reverse proxy in
mod_proxy is `ProxyPass`. You would typically use it as follows:

    ProxyPass     /beepbeep/     http://localhost:7778/

Adding this directive in the server's configuration file (such has
`.htaccess`) will make sure that any request of the form
`http://localhost/beepbeep/xyz` will be proxied to
`http://localhost:7778/xyz`, and the result transferred back to the
requestor. (Under Ubuntu, you may also add this directive to the file
`/etc/apache2/sites-enabled/000-default`.) As a matter of fact, the BeepBeep
console's default settings expects BeepBeep's REST interface to be
accessible *exactly* at that location.

[Back to top](#toc)

Starting BeepBeep                                                  {#start}
-----------------

The console is now ready to communicate with an instance of the BeepBeep
runtime monitor. To do so, BeepBeep must be started by enabling the REST
interface, which can be done using the `--rest` command line switch and
providing the TCP port it should listen to.

In the directory where the BeepBeep .jar file is located, this is done by
typing a command that looks like this:

    java -jar BeepBeep.jar -p /tmp/beepbeep.pipe --rest 7778 formula.ltlfo

If the command is successful, BeepBeep should start and display a message
like

    REST interface started on port 7778

indicating it is now listening on that port for HTTP requests. (The reader
is referred to [BeepBeep's documentation](http://beepbeep.sourceforge.net/)
for detailed information about the meaning of command line parameters.)

From now on, many operations on that running instance of BeepBeep (adding
new monitors, resetting monitors, displaying each monitor's statistics) can
be done through the graphical user interface that the BeepBeep Console
provides you.

[Back to top](#toc)

(To be continued.)
