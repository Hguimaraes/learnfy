var config      = require("../../config/config");
var request     = require('request');
var querystring = require('querystring');

var SongList = function(opt, access_token){
  this.opt = opt;
  this.access_token = access_token;
  this.songs_list = []
};

SongList.prototype.getTracks = function(genre, callback){
  var offset = 0;
  var search_limit = 50;

  // Get N tracks in batchs of 50 per request (Limited by Spotify)
  for (var i = 0; i < (this.opt.maxNumMusic/search_limit); i++) {
    // Header parameters for get tracks request
    var options_searchtrack = {
      url: config.spotify.url.search_item + querystring.stringify({
        q: 'genre:' + genre,
        type: 'track',
        limit: search_limit,
        offset: offset
      }),
      headers: { 
        'Authorization': 'Bearer ' + this.access_token
      },
      json: true
    };

    // Make the request for tracks list
    request.get(options_searchtrack, function(error, response, body){
      // In case of success in the request save the tracks
      if(!error && response.statusCode == 200){
        // Received requests
        var tracks = body.tracks.items;
        
        // Parse the result of the request
        tracks.map(function(value, index){
          console.log(value.id + ", " + value.preview_url + ", " + genre);
        });
      }
    });

    // Increment offset for the next batch
    offset = offset + search_limit;
  }
};

module.exports = SongList; 