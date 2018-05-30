'use strict'

/**
 * DEPENDENCIES
 */
const pg = require('pg');
const express = require('express');
const cors = require('cors');
const fs = require('fs');


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
// const WINDOWSconString = 'postgres://postgres:password@localhost:5432/postgres';
//const MACconString = 'postgres://localhost:5432/fellow_code';
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

/**
 * MIDDLEWARE
 */
app.use(cors());

//DATABASE LOADERS

function loadChannel() {
  fs.readFile('./channels.json', 'utf8', (err, fd) => {
    console.log('channel: ' + fd);
    JSON.parse(fd).forEach(ele => {
      let SQL = 'INSERT INTO channel(channel_id, title, image_url, description) VALUES($1, $2, $3, $4) ON CONFLICT DO NOTHING';
      let values = [ele.channel_id, ele.title, ele.image_url, ele.description];
      client.query(SQL, values)
        .catch(console.error);
    })
  })
}

function loadPlaylists() {
  let SQL = 'SELECT COUNT(*) FROM playlists';
  client.query(SQL)
    .then(result => {
      if (!parseInt(result.rows[0].count)) {
        fs.readFile('./public/data/playlists.json', 'utf8', (err, fd) => {
          console.log('playlists: ' + fd);
          JSON.parse(fd).forEach(ele => {
            let SQL = `
              INSERT INTO channel (
               channel_table_id SERIAL PRIMARY KEY,
               channel_id VARCHAR(255) NOT NULL,
               title VARCHAR (255) NOT NULL,
               description VARCHAR(255) NOT NULL,
               image_url VARCHAR(255) NOT NULL,

              );`;
            let values = [ele.playlists_Id, ele.channel_Id, ele.topic, ele.category,];
            client.query(SQL, values)
              .catch(console.error);
          })
        })
      }
    })
}


function loadDB() {
  client.query(`
    CREATE TABLE IF NOT EXISTS
    channel (
      channel_table_id SERIAL PRIMARY KEY,
      channel_id VARCHAR(255) NOT NULL,
      title VARCHAR (255) NOT NULL,
      description VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL

    );`
  )
    .then(loadChannel)
    .catch(console.error);

  client.query(`
    CREATE TABLE IF NOT EXISTS
    playlists (
      playlists_id SERIAL PRIMARY KEY,
      channel_id VARCHAR(255) NOT NULL,
      topic VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL
    );`
  )
    .catch(console.error);
}

loadDB();

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
