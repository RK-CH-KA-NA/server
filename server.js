'use strict';

/**
 * DEPENDENCIES
 */
const pg = require('pg');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const superagent = require('superagent');

/**
 * APPLICATION
 */
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * API KEY
 */
const API_KEY = process.env.YOUTUBE_KEY; //YOUTUBE_KEY, YOUTUBE_KEY2

/**
 * DATABASE
 */
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

/**
 * MIDDLEWARE
 */
app.use(cors());

/**
 * ENDPOINTS
 */
app.get('/api/v1/channels', (req, res) => {
  let SQL = 'SELECT * FROM channels;';
  client.query(SQL)
    .then(response => res.send(response.rows))
    .catch(console.error);
});

app.get('/api/v1/channels/:id', (req, res) => {
  let SQL = 'SELECT * FROM playlists WHERE channel_id=$1;';
  let values = [req.params.id];
  client.query(SQL, values)
    .then(response => res.send(response.rows))
    .catch(console.error);
});

app.get('/api/v1/playlists/:id', (req, res) => {
  let url = 'https://www.googleapis.com/youtube/v3/playlistItems';
  superagent.get(url)
    .query({'part': 'snippet'})
    .query({'key': API_KEY})
    .query({'maxResults': 50})
    .query({'playlistId': req.params.id})

    .then(response => response.body.items.map(video => {
      let {playlistId, title, description, thumbnails, resourceId} = video.snippet;
      return {
        playlistId: playlistId,
        title: title,
        description: description,
        url: thumbnails.medium.url,
        videoId: resourceId.videoId,
      }
    }))
    .then(bundle => res.send(bundle))
    .catch(console.error)
});

app.post('/api/v1/addNew/:id', (req, res) => {
  let url = 'https://www.googleapis.com/youtube/v3/playlists';
  superagent.get(url)
    .query({'key': API_KEY})
    .query({'part': 'snippet'})
    .query({'id': req.params.id})

    .then(firstResponse => {
      var firstData = firstResponse.body.items[0].snippet;
      var youtubeChannelId = firstData.channelId;
      let url = 'https://www.googleapis.com/youtube/v3/channels';
      superagent.get(url)
        .query({'key': API_KEY})
        .query({'part': 'snippet'})
        .query({'id': youtubeChannelId})

        .then(secondResponse => {
          var secondData = secondResponse.body.items[0].snippet;
          let SQL = `INSERT INTO channels(id, title, url)
                    VALUES($1, $2, $3) ON CONFLICT DO NOTHING;`;
          let values = [youtubeChannelId, secondData.title, secondData.thumbnails.medium.url];
          client.query(SQL, values)
            .then(response => res.sendStatus(201))
            .catch(console.error);
        })
        .then(() => {
          let SQL = `INSERT INTO playlists(id, channel_id, title, description, url, tags)
                    VALUES($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING;`;
          let values = [req.params.id, firstData.channelId, firstData.title, firstData.description, firstData.thumbnails.medium.url, ','];
          client.query(SQL, values)
            .then(response => res.sendStatus(201))
            .catch(console.error)
        })
    })
    .catch(console.error);
});

app.delete('/api/v1/delete/:id', (req, res) => {
  let SQL = `DELETE
            FROM playlists
            WHERE playlists.id=$1`
  let values = [req.params.id];
  client.query(SQL, values)
    .then(() => {
      console.log('Playlist Removed')
      let SQL = `DELETE FROM channels
                WHERE channels.id IN
                (SELECT channels.id
                FROM channels
                LEFT JOIN playlists
                ON channels.id=playlists.channel_id
                WHERE playlists.id IS NULL);`;
      client.query(SQL)
        .then(response = res.sendStatus(200))
        .catch(console.error);
    })
    .catch(console.error);
});


//Catch Request
app.get('*', (req, res) => res.status(403).send('Whoops...'));

/**
 * LISTENER
 */
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

/**
 * Database Loaders
 */
function loadChannels() {
  fs.readFile('./data/channels.json', 'utf8', (err, fd) => {
    JSON.parse(fd).forEach(ele => {
      let SQL = 'INSERT INTO channels VALUES($1, $2, $3) ON CONFLICT DO NOTHING';
      let values = [ele.id, ele.title, ele.url];
      client.query(SQL, values)
        .catch(console.error);
    })
  })
}

function loadPlaylists() {
  let SQL = 'SELECT COUNT(*) FROM playlists;';
  client.query(SQL)
    .then(result => {
      if(!parseInt(result.rows[0].count)) {
        fs.readFile('./data/playlists.json', 'utf8', (err, fd) => {
          JSON.parse(fd).forEach(ele => {
            let SQL = 'INSERT INTO playlists VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING;';
            let values = [ele.id, ele.channelId, ele.title, ele.description, ele.url, ele.tags];
            client.query(SQL, values)
              .catch(console.err);
          })
        })
      }
    })
}

function loadDB() {
  client.query(`
    CREATE TABLE IF NOT EXISTS
    channels (
      id VARCHAR(255) NOT NULL,
      title VARCHAR (255) NOT NULL,
      url VARCHAR(255) NOT NULL,
      PRIMARY KEY (id)
    );`
  )
    .then(loadChannels)
    .catch(console.error);

  client.query(`
    CREATE TABLE IF NOT EXISTS
    playlists (
      id VARCHAR(255) NOT NULL,
      channel_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description VARCHAR(800),
      url VARCHAR(255) NOT NULL,
      tags VARCHAR(255) NOT NULL,
      FOREIGN KEY (channel_id) REFERENCES channels(id)
    );`
  )
    .then(loadPlaylists)
    .catch(console.error);
}

loadDB();