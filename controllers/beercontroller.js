const config = require('/var/lib/openshift/5682c2937628e1970e0001d8/app-root/data/config.json');
//const config = require('../config.json');
const UntappdClient = require('node-untappd');
const untappd = new UntappdClient(true);
const request = require('request');

untappd.setClientId(config.clientid);
untappd.setClientSecret(config.clientsecret);

module.exports = {
    postBeer: function (req, res) {
        var responseUrl = req.body.response_url;
        //res.sendStatus(200);

		if (req.body.token === config.slacktoken) {
			var tokens = req.body.text.split(' ');
			if (tokens.length > 0 && tokens[0] === 'fav') {
				untappd.userDistinctBeers(function (err, obj) {
					var resp = handleBeerSearch(err, obj);
                    sendResponse(resp, responseUrl);
				}, { USERNAME: tokens[1], sort: 'checkin', limit: 1 });
			}
			else if (tokens.length > 0 && tokens[0] === 'badge') {
				untappd.userBadges(function (err, obj) {
					var resp = handleUserBadge(err, obj);
					res.send(resp);
				}, { USERNAME: tokens[1], limit: 1 });
			}
			else {
				untappd.beerSearch(function (err, obj) {
					var resp = handleBeerSearch(err, obj);
					res.send(resp);
				}, { q: req.body.text, sort: 'count' });
			}
		}
		else {
			res.status(500).send('Invalid Token');
		}
	}
}

function sendResponse(resp, url) {
    //request.post(url, resp, function (err, resp, body) {

    //});
}

function handleBeerSearch(err, obj) {
	var response = { attachments: [] };
	if (err === null && obj.response.beers.count > 0) {
		var beer = obj.response.beers.items[0].beer;
		var brewery = obj.response.beers.items[0].brewery;
		var count = obj.response.beers.items[0].count;
		var rating = obj.response.beers.items[0].rating_score;
		
		response.response_type = "in_channel";
		var attachment = {};
		attachment.title = brewery.brewery_name + ' - ' + beer.beer_name + ' - ' + beer.beer_style;
		
		if (brewery.contact.url !== null) {
			attachment.title_link = brewery.contact.url;
		}
		
		attachment.text = '_*ABV: ' + beer.beer_abv + '% IBU: ' + beer.beer_ibu + '*_';
		
		if (count) {
			attachment.text += '\n _*Checkins: ' + count + ' Rating: ' + rating + ' / 5*_';
		}
		if (beer.beer_description.length > 0) {
			attachment.text += '\n' + beer.beer_description;
		}
		
		attachment.thumb_url = beer.beer_label;
		attachment.color = 'good';
		attachment.mrkdwn_in = ['text', 'title'];
		response.attachments.push(attachment);
	}
	
	return response;
}

function handleUserBadge (err, obj) {
	var response = { attachments: [] };
	if (err === null && obj.response.count > 0) {
		var badge = obj.response.items[0];
		response.response_type = "in_channel";
		var attachment = {
			title: badge.badge_name,
			text: badge.badge_description,
			thumb_url: badge.media.badge_image_sm,
			color: 'good'
		};
		
		response.attachments.push(attachment);
	}
	
	return response;
}