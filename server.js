#!/bin/env node
(function() {
    'use strict';
    var express = require('express');
    var fs = require('fs');
    var bodyparser = require('body-parser');
    var configfile = process.env.configfile || '/var/lib/openshift/5682c2937628e1970e0001d8/app-root/data/config.json';
    var app = express();
    var config = require(configfile);

    app.use(bodyparser.json());
    app.use(bodyparser.urlencoded({extended: false}));
    require('./config/routes.js')(app);


    var Unslackd = function () {
        var self = this;

        /**
         *  Set up server IP address and port # using env variables/defaults.
         */
        self.setupVariables = function () {
            //  Set the environment variables we need.
            self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
            self.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

            if (typeof self.ipaddress === "undefined") {
                //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
                //  allows us to run/test the app locally.
                console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
                self.ipaddress = "127.0.0.1";
            }
            ;
        };

        /**
         *  terminator === the termination handler
         *  Terminate server on receipt of the specified signal.
         *  @param {string} sig  Signal to terminate on.
         */
        self.terminator = function (sig) {
            if (typeof sig === "string") {
                console.log('%s: Received %s - terminating sample app ...',
                    Date(Date.now()), sig);
                process.exit(1);
            }
            console.log('%s: Node server stopped.', Date(Date.now()));
        };

        /**
         *  Setup termination handlers (for exit and a list of signals).
         */
        self.setupTerminationHandlers = function () {
            //  Process on exit and signals.
            process.on('exit', function () {
                self.terminator();
            });

            // Removed 'SIGPIPE' from the list - bugz 852598.
            ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
                'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
            ].forEach(function (element, index, array) {
                process.on(element, function () {
                    self.terminator(element);
                });
            });
        };


        /**
         *  Initializes the sample application.
         */
        self.initialize = function () {
            self.setupVariables();
            self.setupTerminationHandlers();
        };


        /**
         *  Start the server (starts up the sample application).
         */
        self.start = function () {
            //  Start the app on the specific interface (and port).
            app.listen(self.port, self.ipaddress, function () {
                console.log('%s: Node server started on %s:%d ...',
                    Date(Date.now()), self.ipaddress, self.port);
            });
        };

    };


    /**
     *  main():  Main code.
     */
    var zapp = new Unslackd();
    zapp.initialize();
    zapp.start();
})();

