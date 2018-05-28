'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT;
const TOKEN = process.env.TOKEN;