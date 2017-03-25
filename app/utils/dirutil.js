var fs            = require('fs');
var path          = require('path');
var child_process = require('child_process');
var config        = require('../../config/config');

module.exports = {
  configureDatasetFolder : function(opt){
    if(opt.audiomet){
      fs.unlinkSync(config.constants.dataset_filename);
      fs.unlinkSync(config.constants.truth_table_filename);
    }
  }
};