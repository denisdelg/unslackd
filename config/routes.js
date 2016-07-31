(function () {
    'use strict';

	var beercontroller = require('../controllers/beercontroller.js');

	module.exports = function (app) {
		app.post('/beer', beercontroller.postBeer);
	};
})();