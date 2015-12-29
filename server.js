#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var UntappdClient = require('node-untappd');
var bodyParser = require('body-parser');

/**
 *  Define the sample application.
 */
var Unslackd = function() {

    //  Scope.
    var self = this;
    var untappd = new UntappdClient(true);

    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };
    
    self.setupUntappd = function () {
        untappd.setClientId('68B427F5E64CAB41AE5B87922F1471828EF022D2');
        untappd.setClientSecret('0ED1B53558EEDF51843FC6A6BF0F796BD59CD0D0');
    }

    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/beer'] = function (req, res) {
            if (req.body.token === 'VbbbaMahEA7tKFTIfwNRVjZr') {
                var myResp = {
                    attachments: []
                };
                untappd.beerSearch(function (err, obj) {
                    if (err === null && obj.response.beers.count > 0) {
                        myResp.response_type = "in_channel";
                        var attachment = {};
                        attachment.title = obj.response.beers.items[0].beer.beer_name + ' - ' + obj.response.beers.items[0].beer.beer_style;
                        attachment.text = '_ABV: ' + obj.response.beers.items[0].beer.beer_abv + '% IBU: ' + obj.response.beers.items[0].beer.beer_ibu + '_\n' +
                                obj.response.beers.items[0].beer.beer_description;
                        attachment.thumb_url = obj.response.beers.items[0].beer.beer_label;
                        attachment.color = 'good';
                        attachment.mrkdwn_in = ['text'];
                        myResp.attachments.push(attachment);
                        res.send(myResp);
                    }
                }, { q: req.body.text, sort: "count" });
            }
            else {
                res.status(500).send('Invalid Token');
            }
        }
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        self.app.use(express.json());
        self.app.use(express.urlencoded());

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.post(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.setupTerminationHandlers();
        self.setupUntappd();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};  


/**
 *  main():  Main code.
 */
var zapp = new Unslackd();
zapp.initialize();
zapp.start();

