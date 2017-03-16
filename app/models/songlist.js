var config      = require("../../config/config");
var request     = require('request');
var querystring = require('querystring');
var https       = require('https');
var fs          = require('fs');
var ProgressBar = require('progress');


var SongList = function(opt, access_token){
  this.opt = opt;
  this.access_token = access_token;
  this.songs_list = []
  this.downloadCounter = 0;

  // Create the progress bar for this request
  var green = '\u001b[42m \u001b[0m';
  var red = '\u001b[41m \u001b[0m';
  this.bar = new ProgressBar(' Downloading [:bar] :rate/bps :percent :etas', {
    complete: green,
    incomplete: red,
    total: this.opt.maxNumMusic*this.opt.genres.length + 1
  });
};

SongList.prototype.getTracks = function(genre, callback){
  var self = this;
  var offset = 0;
  var search_limit = 50;
  
  // Get N tracks in batchs of 50 per request (Limited by Spotify)
  for (var i = 0; i < (self.opt.maxNumMusic/search_limit); i++) {
    // Header parameters for get tracks request
    var options_searchtrack = {
      url: config.spotify.url.search_item + querystring.stringify({
        q: 'genre:' + genre,
        type: 'track',
        limit: search_limit,
        offset: offset
      }),
      headers: { 
        'Authorization': 'Bearer ' + self.access_token
      },
      json: true
    };

    // Make the request for tracks list
    request.get(options_searchtrack, function(error, response, body){
      // In case of success in the request save the tracks
      if(!error && response.statusCode == 200){
        // Received requests
        var tracks = body.tracks.items;

        // ID List
        var track_id = [];
        
        // Parse the result of the request
        tracks.map(function(value, index){
          // Save the tracks Id
          track_id.push(value.id);
          
          // If the Download Preview is selected
          if(self.opt.audioprev){
            var file_path = "./dataset/" + genre + "/" + value.id + ".mp3"
            self.downloadPreviewTrack(file_path, value.preview_url);
          }
        });

        // If the Audio metadata is selected
        // Request audio-features for a set of ids
        if(self.opt.audiomet){
          console.log(track_id);
        }

        // If backup is selected
        if(self.opt.bkp){
          console.log(self.opt);
        }
      }
    });

    // Increment offset for the next batch
    offset = offset + search_limit;
  }
};


// Thanks to the awesome answer of Vince Yuan on Stackoverflow
SongList.prototype.downloadPreviewTrack = function(file_path, preview_url, callback){
  var self = this;
  
  // Create the file and download from the given URL
  var file = fs.createWriteStream(file_path);
  var request = https.get(preview_url, function(response) {
    response.pipe(file);
    
    file.on('finish', function() {
      // When finish downloading one file, progress the bar
      self.bar.tick();
      // If completed, tell to the user
      if (self.bar.complete) {
        console.log('\nDownload Completed\n');
      }
      // Close file
      file.close(callback);
    });

  }).on('error', function(err) { // Handle errors
    fs.unlink(file_path); // Delete the file async.
    if (callback) callback(err.message);
  });
};

module.exports = SongList; 