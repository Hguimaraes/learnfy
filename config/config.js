module.exports = {
  'port': 8888,
  'spotify': {
    'client_id': process.env.SPOTIFY_CLIENT_ID,
    'client_secret' : process.env.SPOTIFY_CLIENT_SECRET,
    'redirect_uri' : 'http://localhost:8888/callback',
    'url': {
      'account': 'https://accounts.spotify.com/',
      'refresh_token': 'https://accounts.spotify.com/api/token',
      'audio_features': 'https://api.spotify.com/v1/audio-features/?ids=',
      'search_item' : 'https://api.spotify.com/v1/search'
    }
  }
};