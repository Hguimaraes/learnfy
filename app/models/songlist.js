var config      = require("../../config/config");
var request     = require('request');
var querystring = require('querystring');
var https       = require('https');
var fs          = require('fs');
var ProgressBar = require('progress');
var json2csv    = require('json2csv');


var SongList = function(opt, access_token){
  // Save received parameters
  this.opt = opt;
  this.access_token = access_token;

  // How many songs will be included in the audio features or preview donwload
  this.total_songs = this.opt.maxNumMusic*this.opt.genres.length;

  // Variables for audio-preview download
  // Create the progress bar if downloading previews for this request
  var green = '\u001b[42m \u001b[0m';
  var red = '\u001b[41m \u001b[0m';
  this.bar = new ProgressBar(' Downloading [:bar] :rate/bps :percent :etas', {
    complete: green,
    incomplete: red,
    total: this.total_songs
  });

  // Variables for audio-features download
  // Dataset will be written in a CSV file if 
  this.downloadCounter = 0;
  this.truth_table = [];
  this.truth_table_headers = ["id", "genre"]
  this.truth_table_filename = config.constants.truth_table_filename;

  this.dataset = [];
  this.dataset_headers = ["id", "danceability", "energy", "key" ,"loudness",
    "mode", "speechiness", "acousticness", "instrumentalness", "liveness",
    "valence", "tempo", "time_signature"];
  this.dataset_filename = config.constants.dataset_filename;
};

//  Main function to get our dataset (features or preview)
// Called by the API (route: /create_dataset)
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
        var truth_table = [];
        
        // Parse the result of the request
        tracks.map(function(value, index){
          // Save the tracks Id
          track_id.push(value.id);
          truth_table.push({'id': value.id, 'genre': genre});

          // If the Download Preview is selected
          if(self.opt.audioprev){
            var file_path = config.constants.audio_preview_folder + 
              genre + "/" + value.id + ".mp3";
            self.downloadPreviewTrack(file_path, value.preview_url);
          }
        });

        // If the Audio metadata is selected
        // Request audio-features for a set of ids
        if(self.opt.audiomet){
          self.downloadAudioFeatures(track_id, genre);
        }

        //@TODO: If backup is selected, save the ids, urls and genre to a file
        // to be restored in the future.
        if(self.opt.bkp){
          console.log(self.opt);
        }
      }
    });

    // Increment offset for the next batch
    offset = offset + search_limit;
  }
};

// Function to downlaod the Preview file from Spotify
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

// Function to request to the API the audio-features a tracks from Spotify
SongList.prototype.downloadAudioFeatures = function(id_list, genre, callback){
  // Request parameters
  var self = this;
  var options_track_features = {
    url: config.spotify.url.audio_features + querystring.stringify({
        ids: id_list.toString()
      }),
      headers: { 
        'Authorization': 'Bearer ' + self.access_token
      },
      json: true
    };
  
  // Set up the truth table and save to a CSV
  id_list.map(function(value, index){
    self.truth_table.push({
      "id" : value,
      "genre": genre
    });
  });

  var truth_table_csv = json2csv({ data: self.truth_table, fields: self.truth_table_headers });
  fs.writeFile(self.truth_table_filename, truth_table_csv, function(err) {
    if (err) console.log(err);
  });

  // Request audio features for this track
  request.get(options_track_features, function(err, resp, data) {
    if(!err && resp.statusCode == 200){
      // Map each entry to the data structure
      data.audio_features.map(function(value, index){
        self.dataset.push(value);
      });

      // Write to the CSV file
      var dataset_csv = json2csv({ data: self.dataset, fields: self.dataset_headers });
      fs.writeFile(self.dataset_filename, dataset_csv, function(err) {
        if (err) throw err;
      });
    } else {
      console.log("ERROR IN AUDIO FEATURE : " + err);
    }
  });
};

module.exports = SongList; 