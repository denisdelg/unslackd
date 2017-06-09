'use strict';

const express = require('express');
const bodyparser = require('body-parser');
const configfile = process.env.configfile;
const app = express();
const api = require('./routes/routes');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: false}));
app.use('/api', api);

module.exports = app;

