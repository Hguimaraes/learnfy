/**
 *
 */

var config        = require('../../config/config');
var querystring   = require('querystring');
var request       = require('request');

// Load model
var SongList = require('../models/songlist');

// Util function to Generate a random string
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Exposing routes to server.js through a REST API
module.exports = function(app, express) {
  // Usefull variables
  var apiRouter = express.Router();
  var access_token = null;
  var refresh_token = null;
  var first_request = true;

  apiRouter.use(function(req, res, next) {
    console.log('Somebody just came to our app!');
  });

  // Login in the Spotify
  app.get('/login', function(req, res) {
    var state = generateRandomString(16);
    res.cookie(config.spotify.statekey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email';
    res.redirect(config.spotify.url.account + 'authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: config.spotify.client_id,
        scope: scope,
        redirect_uri: config.spotify.redirect_uri,
        state: state
      }));
  });

  // Callback after submit a request to Spotify
  app.get('/callback', function(req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[config.spotify.statekey] : null;

    if (state === null || state !== storedState) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      res.clearCookie(config.spotify.statekey);
      var authOptions = {
        url: config.spotify.url.account + 'api/token',
        form: {
          code: code,
          redirect_uri: config.spotify.redirect_uri,
          grant_type: 'authorization_code'
        },
        headers: {
          'Authorization': 'Basic ' + (new Buffer(config.spotify.client_id 
            + ':' + config.spotify.client_secret).toString('base64'))
        },
        json: true
      };

      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {

          access_token = body.access_token;
          refresh_token = body.refresh_token;

          var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };

          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            console.log(body);
          });

          // Return to the logged view
          res.redirect('/#!/loggedin');
        } else {
          res.redirect('/#!/error');
        }
      });
    }
  });

  // Refresh token if experied
  app.get('/refresh_token', function(req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
      url: config.spotify.url.account + 'api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(config.spotify.client_id + 
        ':' + config.spotify.client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        res.send({
          'access_token': access_token
        });
      }
    });
  });

  // Receive parameters from config page in the front-end
  app.post('/create_dataset', function(req, res){
    if(first_request){
      // Disable first request
      first_request = false;
      
      // Get variables from the post request
      var configOpts = req.body.configOpt;
      
      // Create Song List object to fill
      var songlist = new SongList(configOpts, access_token)

      // Get the song list info based on genres
      songlist.getTracks();
    }
  });

  return apiRouter;
}