module.exports = {
  'port': 8888,
  'spotify': {
    'client_id': process.env.SPOTIFY_CLIENT_ID,
    'client_secret' : process.env.SPOTIFY_CLIENT_SECRET,
    'redirect_uri' : 'http://localhost:8888/callback',
    'statekey':'spotify_auth_state',
    'url': {
      'account': 'https://accounts.spotify.com/',
      'refresh_token': 'https://accounts.spotify.com/api/token',
      'audio_features': 'https://api.spotify.com/v1/audio-features/?',
      'search_item' : 'https://api.spotify.com/v1/search?',
      'search_track' : 'https://api.spotify.com/v1/tracks'
    }
  },
  'constants':{
    'audio_preview_folder' : './dataset/songs/',
    'truth_table_filename' : "./dataset/spotify_truth_table.csv",
    'dataset_filename' : './dataset/spotify_dataset.csv',
    'bkp' : './dataset/spotify_dataset.bkp'
  }
};