'use strict';

const UntappdClient = require('node-untappd');

class BeerController {
  constructor() {
    this.untappdClient = new UntappdClient(true);
    this.untappdClient.setClientId('');
    this.untappdClient.setClientSecret('');
  }

  postBeer(req, res) {
    if (req.body.token === this.config.slacktoken) {
      const tokens = req.body.text.split(' ');
      if (tokens.length > 0 && tokens[0] === 'fav') {
        this.untappdClient.userDistinctBeers((err, obj) => {
          const resp = this.handleBeerSearch(err, obj);
          res.send(resp);
        }, {USERNAME: tokens[1], sort: 'checkin', limit: 1});
      } else if (tokens.length > 0 && tokens[0] === 'badge') {
        this.untappdClient.userBadges((err, obj) => {
          const resp = this.handleUserBadge(err, obj);
          res.send(resp);
        }, {USERNAME: tokens[1], limit: 1});
      } else {
        this.untappdClient.beerSearch((err, obj) => {
          const resp = this.handleBeerSearch(err, obj);
          res.send(resp);
        }, {q: req.body.text, sort: 'count'});
      }
    } else {
      res.status(500).send('Invalid Token');
    }
  }

  handleBeerSearch(err, obj) {
    const response = {attachments: []};
    if (err === null && obj.response.beers.count > 0) {
      const beer = obj.response.beers.items[0].beer;
      const brewery = obj.response.beers.items[0].brewery;
      const count = obj.response.beers.items[0].count;
      const rating = obj.response.beers.items[0].rating_score;

      response.response_type = 'in_channel';
      const attachment = {};
      attachment.title = `${brewery.brewery_name} - ${beer.beer_name} - ${beer.beer_style}`;

      if (brewery.contact.url !== null) {
        attachment.title_link = brewery.contact.url;
      }

      attachment.text = `_*ABV: ${beer.beer_abv}% IBU: ${beer.beer_ibu}*_`;

      if (count) {
        attachment.text += `\n _*Checkins: ${count} Rating: ${rating} / 5*_`;
      }
      if (beer.beer_description.length > 0) {
        attachment.text += `\n${beer.beer_description}`;
      }

      attachment.thumb_url = beer.beer_label;
      attachment.color = 'good';
      attachment.mrkdwn_in = ['text', 'title'];
      response.attachments.push(attachment);
    }

    return response;
  }

  handleUserBadge(err, obj) {
    const response = {attachments: []};
    if (err === null && obj.response.count > 0) {
      const badge = obj.response.items[0];
      response.response_type = 'in_channel';
      const attachment = {
        title: badge.badge_name,
        text: badge.badge_description,
        thumb_url: badge.media.badge_image_sm,
        color: 'good',
      };

      response.attachments.push(attachment);
    }

    return response;
  }
}

module.exports = BeerController;
