var fs            = require('fs');
var path          = require('path');
var child_process = require('child_process');
var config        = require('../../config/config');

module.exports = {
  configureDatasetFolder : function(opt){
    // Delete all files in the songs folder and recreate the structure
    if(opt.audioprev){
      opt.genres.forEach(function(genre){
        var dir = config.constants.audio_preview_folder + genre;
        // Delete all files inside the directory
        if (fs.existsSync(dir)) {
          var files = fs.readdirSync(dir);

          // Delete the files in the folders with fs.unlink
          for (var i = 0; i < files.length; i++) {
            fs.unlinkSync(path.join(dir, files[i]));
          }

        } else {
          // Create a new directory to save the files
          fs.mkdirSync(dir);
        }
      });
    }
  }
};