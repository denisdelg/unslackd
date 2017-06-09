'use strict';

const express = require('express');
const router = express.Router();
const bc = require('../controllers/beercontroller.js');
const beerController = new bc();

router.post('/beer', beerController.postBeer);

module.exports = router;
