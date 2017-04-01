var config      = require("../../config/config");
var request     = require('request');
var querystring = require('querystring');
var https       = require('https');
var fs          = require('fs');
var ProgressBar = require('ascii-progress');
var json2csv    = require('json2csv');
var jsonfile    = require('jsonfile');

var SongList = function(opt, access_token){
  // Save received parameters
  this.opt = opt;
  this.access_token = access_token;

  // Retry time
  this.retry_ms = 10000;

  // How many songs will be included in the audio features or preview donwload
  this.total_songs = this.opt.maxNumMusic*this.opt.genres.length;

  // Auxiliar variables for getTracks
  this.tracksSet = {"opts" : this.opt , "tracks" : []};
  this.getTracksCounter = 0;
  this.bkp_filepath = config.constants.bkp;

  // Variables for audio-features download
  // Dataset will be written in a CSV file if selected 
  this.truth_table = [];
  this.truth_table_headers = ["id", "genre"]
  this.truth_table_filename = config.constants.truth_table_filename;

  this.dataset = [];
  this.dataset_headers = ["id", "danceability", "energy", "key" ,"loudness",
    "mode", "speechiness", "acousticness", "instrumentalness", "liveness",
    "valence", "tempo", "time_signature"];
  this.dataset_filename = config.constants.dataset_filename;

  // Progress bar for audio-features and audio-preview
  this.tokens = ':current.underline.magenta/:total.italic.green :percent.bold.yellow :elapseds.italic.blue :etas.italic.cyan';
    
  // Audio features progress bar
  this.barAudioFeatures = undefined

  // Audio preview progress bar
  this.barAudioPreview = new ProgressBar({ 
    schema: ' [.white:filled.green:blank.grey] .white' + this.tokens,
    total : this.total_songs 
  });
};

//  Main function to get our dataset (features or preview)
// Called by the API (route: /create_dataset)
SongList.prototype.getTracks = function(){
  // Log what is going on
  console.log(".:. Starting getTracks, please wait...");

  // Auxiliar variables
  var self = this;
  var offset = 0;
  var search_limit = 50;
  
  // For each genre, get the tracks in the search API
  self.opt.genres.forEach(function(genre){
    // Reset offset for each genre
    offset = 0;

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
      function runRequest(url, callback){
        request.get(url, function(error, response, body){
          // In case of success in the request save the tracks
          if(!error && response.statusCode == 200){
            // Received requests
            var tracks = body.tracks.items;

            // Parse the result of the request
            tracks.map(function(value, index){
              // if the id is not already in the structure
              var picked = self.tracksSet.tracks.find(x => x.id === value.id);

              // Save the tracks Id
              if(!picked){
                self.tracksSet.tracks.push({
                  'id': value.id,
                  'preview_url': value.preview_url,
                  'genre': genre
                });
              }
            });

            // Increment download counter
            self.getTracksCounter += search_limit;
            
            // If download list is completed, call the appropriate functions
            console.log(self.getTracksCounter);
            if(self.getTracksCounter == self.total_songs){

              // If backup option is selected, save the tracksSet
              if(self.opt.bkp){
                jsonfile.writeFile(self.bkp_filepath, self.tracksSet, function (err) {
                  if(err) console.error(err);
                });
              }

              //  If the audio features option is selected, download and
              // save to a CSV file
              if(self.opt.audiomet){
                self.downloadAudioFeatures();
              }

              //  If the audio preview option is selected, download and
              // save the files in mp3
              if(self.opt.audioprev){
                self.downloadPreviewTrack(0);
              }
            }
          } else {
            // Retry in retry-after or retry_ms seconds
            if(!error && response.statusCode == 429){
              setTimeout(runRequest(url), response['retry-after']);
            } else {
              console.log(error);
              setTimeout(runRequest(url), self.retry_ms);
            }
          }
        });
      }
      runRequest(options_searchtrack);

      // Increment offset for the next batch
      offset = offset + search_limit;
    }
  });
};

// Function to downlaod the Preview file from Spotify
// Thanks to the awesome answer of Vince Yuan on Stackoverflow
SongList.prototype.downloadPreviewTrack = function(id, callback){
  // Auxiliar variables
  var self = this;
  var track = self.tracksSet.tracks[id]

  // Create the file path
  var file_path = config.constants.audio_preview_folder + 
    track.genre + "/" + track.id + ".mp3";

  // Create the file and download from the given URL
  var file = fs.createWriteStream(file_path);
  var request = https.get(track.preview_url, function(response) {
    response.pipe(file);
    
    file.on('finish', function() {
      // When finish downloading one file, progress the bar
      self.barAudioPreview.tick();
      // If completed, tell to the user
      if (self.barAudioPreview.completed) {
        console.log('audio-preview download completed\n');
      } else {
        self.downloadPreviewTrack(id + 1);
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
SongList.prototype.downloadAudioFeatures = function(callback){
  // Auxiliar variables
  var self = this;
  var batchSize = 100;
  
  // Save the truth_table
  self.tracksSet.tracks.map(function(value, index){
    self.truth_table.push({
      "id" : value.id,
      "genre": value.genre
    });
  });

  var truth_table_csv = json2csv({ data: self.truth_table, fields: self.truth_table_headers });
  fs.writeFile(self.truth_table_filename, truth_table_csv, function(err) {
    if (err) console.log(err);
  });

  // Define the download bar
  self.barAudioFeatures = new ProgressBar({ 
    schema: ' [.white:filled.blue:blank.grey] .white' + self.tokens,
    total : self.tracksSet.tracks.length
  });

  // Get audio-features in batchs (API limit - max of 100 tracks per request)
  for(var i = 0; i < self.total_songs; i += batchSize){
    // Get a batch of ids
    var ids = self.tracksSet.tracks.slice(i, i + batchSize).map(function(value, index){
      return value.id;
    });

    // Request parameters
    var options_track_features = {
      url: config.spotify.url.audio_features + querystring.stringify({
          ids: ids.toString()
        }),
        headers: { 
          'Authorization': 'Bearer ' + self.access_token
        },
        json: true
    };
    
    // Request audio features for this track
    function runRequest(url, callback){
      request.get(url, function(err, resp, data) {
        if(!err && resp.statusCode == 200){
          // Map each entry to the data structure
          data.audio_features.map(function(value, index){
            self.dataset.push(value);
          });

          // Update bar
          self.barAudioFeatures.tick(data.audio_features.length);
          
          // Check if is the last request to be completed
          if (self.barAudioFeatures.completed) {
            console.log('audio-features download completed!\n');

            // Write to the CSV file
            var dataset_csv = json2csv({ data: self.dataset, fields: self.dataset_headers });
            fs.writeFile(self.dataset_filename, dataset_csv, function(err) {
              if (err) console.log(err);
            });
          }
        } else {
          // Retry in retry-after or retry_ms seconds
          if(!err && resp.statusCode == 429){
            setTimeout(runRequest(url), resp['retry-after']);
          } else {
            setTimeout(runRequest(url), self.retry_ms);
          }
        }
      });
    }

    runRequest(options_track_features);
  }
};

module.exports = SongList; 