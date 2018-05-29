'use strict'

/**
 * DEPENDENCIES
 */
const express = require('express');
const cors = require('cors');
const pg = require('pg');
//const superagent = require('superagent');

/**
 * APPLICATION
 */
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * API KEY
 */
//const API_KEY = process.env.YOUTUBE_KEY; //YOUTUBE_KEY, YOUTUBE_KEY2

/**
 * DATABASE
 */
const WINDOWSconString = 'postgres://postgres:password@localhost:5432/postgres';
//const MACconString = 'postgres://localhost:5432';
const client = new pg.Client(process.env.DATABASE_URL || WINDOWSconString);
client.connect();
client.on('error', err => console.error(err));

/**
 * MIDDLEWARE
 */
app.use(cors());

/**
 * ENDPOINTS
 */



//testing request
app.get('/test', (req, res) => res.send('hello world'))

























//Catch Request
app.get('*', (req, res) => res.status(403).send('Whoops...'));


/**
 * LISTENER
 */
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));