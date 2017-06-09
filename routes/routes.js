'use strict';

const express = require('express');
const BeerController = require('../controllers/beercontroller.js');

const router = express.Router();
const beerController = new BeerController();

router.post('/beer', beerController.postBeer);

module.exports = router;
