﻿const config = require('/var/lib/openshift/5682c2937628e1970e0001d8/app-root/data/config.json');
//const config = require('../config.json');
const UntappdClient = require('node-untappd');
const untappd = new UntappdClient(true);
const request = require('request');

untappd.setClientId(config.clientid);
untappd.setClientSecret(config.clientsecret);

module.exports = {
    postBeer: function (req, res) {
        
        if (req.body.token && req.body.text && req.body.token === config.slacktoken) {
            res.status(200).send({ "response_type": "in_channel" });
            
            var responseUrl = req.body.response_url;
            if (req.body.text) {
                var tokens = req.body.text.split(' ');
                var limit = 1;
                var temp = parseInt(tokens[tokens.length - 1]);
                
                if (!isNaN(temp)) {
                    limit = temp;
                }

                if (limit > 5) {
                    limit = 5;
                }


                if (tokens.length > 0 && tokens[0] === 'fav') {
                    untappd.userDistinctBeers(function (err, obj) {
                        var resp = handleBeerSearch(err, obj, responseUrl);
                    }, { USERNAME: tokens[1], sort: 'checkin', limit: limit });
                }
                else if (tokens.length > 0 && tokens[0] === 'badge') {
                    untappd.userBadges(function (err, obj) {
                        var resp = handleUserBadge(err, obj, responseUrl);
                    }, { USERNAME: tokens[1], limit: limit });
                }
                else {
                    untappd.beerSearch(function (err, obj) {
                        var resp = handleBeerSearch(err, obj,responseUrl);
                    }, { q: tokens.length > 1 ? tokens.slice(0,-1).join(' ') : tokens[0], sort: 'count', limit: limit });
                }
            }
        }
        else {
            res.status(500).send();
        }
	}
}

function sendResponse(resp, url) {
    request.post({
        url: url,
        method: "POST",
        json: true,
        header : {
            "content-type": "application/json"
        },
        body: resp
    }, function (err, resp, body) {

    });
}

function handleBeerSearch(err, obj, url) {
    if (!err) {
        var response = {
            response_type: "in_channel",
            attachments: []
        };

        for (var i = 0; i < Math.min(obj.response.beers.items.length, 5); i++) {
            var beer = obj.response.beers.items[i].beer;
            var brewery = obj.response.beers.items[i].brewery;
            var count = obj.response.beers.items[i].count;
            var rating = obj.response.beers.items[i].rating_score;
            
            var attachment = {
                title: brewery.brewery_name + ' - ' + beer.beer_name + ' - ' + beer.beer_style,
                fields: [
                    {
                        title: 'ABV / IBU',
                        value: (beer.beer_abv + '%   ') + (' ' + beer.beer_ibu === 0 ? 'N/A' : beer.beer_ibu),
                        short: true
                    },
                    {
                        title: 'Checkins / Rating',
                        value: (count ? count : 'N/A') + ('   ' + rating + ' / 5'),
                        short: true
                    },
                ],
                text: beer.beer_description + '\n',
                thumb_url: beer.beer_label,
                color: 'good',
                mrkdwn_in: ['text', 'title']
            }
            
            if (brewery.contact.url) {
                attachment.title_link = brewery.contact.url;
            }
            
            //if (count) {
            //    attachment.text += '\n _*Checkins: ' + count + ' Rating: ' + rating + ' / 5*_';
            //}
            
            //if (beer.beer_description.length > 0) {
            //    attachment.text += '\n' + beer.beer_description + '\n';
            //}
            
            response.attachments.push(attachment);
        }

        sendResponse(response, url);
    }
}

function handleUserBadge(err, obj, url) {
    if (!err) {
        var response = {
            response_type: "in_channel",
            attachments: []
        };

        for (var i = 0; i < Math.min(obj.response.count, 5); i++) {
            var badge = obj.response.items[i];
            var attachment = {
                title: badge.badge_name,
                text: badge.badge_description,
                thumb_url: badge.media.badge_image_sm,
                color: 'good'
            }
            response.attachments.push(attachment);
        }

        sendResponse(response, url);
    }
}