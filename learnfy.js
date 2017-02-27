/**
 *
 */

// Require .env to parse enviroment variables
require('dotenv').load();

/**
 * --- Node modules and useful variables
 */

var express       = require('express');
var bodyParser    = require('body-parser');
var morgan        = require('morgan');
var path          = require('path');
var cookieParser  = require('cookie-parser');

var config        = require('./config/config');
var app           = express();

var public_folder   = 'public';

/**
 * -- Setting the app
 */

// use body parser so we can grab information from POST requests
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// configure our app to handle CORS requests
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

// log all requests to the console 
app.use(morgan('dev'));

// Setting port and static path to express
app.use(express.static(path.join(__dirname, public_folder)));

/**
 * -- Configuring Routes
 */

var apiRoutes = require('./app/routes/api')(app, express);
app.use('/api', apiRoutes);

// Send users to front-end
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname + '/' + public_folder + '/index.html'));
});

/**
 * Set the application to listen 
 */
 
app.listen(config.port);
console.log("- Express server listening on port " + config.port);