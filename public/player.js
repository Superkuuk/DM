var Player = {
  playing: false,
  track: null,
  token: null,
  refreshToken: null,
  locked: true,
  type: null,
  retryCount: 0,
  maxTries: 10,
  pingTime: 100,
  pingOn: false,
  listeningMode: false,
  device: null,

  init: function(token, refresh, type) {
    type = type.toLowerCase();
    if(type == "spotify" || type == "apple" && token != null) {
      this.token = token;
      this.refreshToken = refresh;
      this.type = type;
      this.pingOn = true;
      this.locked = false;
      this.emitChange(this.track);
      this.ping(); // Starts pinging.
    } else {
      console.error("Error initiating Player. Type is not correct. Either use apple or spotify.");
    }
  },

  ping: function() {
    if (!this.locked) {
      this.update();
    }
    if (this.pingOn) {
      setTimeout(() => {this.ping()}, this.pingTime);
    }
  },

  authenticate: function() {
      $.ajax({
        url: '/refresh_spotify_token',
        context: this,
        data: {
          'refresh_token': this.refreshToken
        },
      }).done(function(data) {
        console.log("Done reauthenticating");
        this.token = data.access_token;
      });
  },

  emitChange: function(track) {
    const state = {
      is_playing: this.playing,
      item: track
    }
    socket.emit('musicInfo', state);
  },

  update: function(callback = function(){}) {
    if(this.token == null) return;

    if(this.type == "spotify") {
      $.ajax({
          url: 'https://api.spotify.com/v1/me/player',
          type: 'GET',
          context: this,
          headers: {
            'Authorization': 'Bearer ' + this.token
          },
          success: function(response, textStatus, jqXHR) {
            //userProfilePlaceholder.innerHTML = userProfileTemplate(response);
            this.retryCount = 0;
            if (response && response.currently_playing_type == "track") {
              this.device = response.device.id;
              this.playing = response.is_playing;

              if (!this.track) {
                this.track = response.item;
              }
              if (this.track.id != response.item.id) {
                this.emitChange(response.item);
              }

              this.track = response.item;
              this.locked = false;

              var artistList = "";
              response.item.artists.forEach((artist, i) => {
                artistList += artist.name + ", ";
              });
              artistList = artistList.slice(0, -2);
              document.getElementById('track').innerHTML = response.item.name;
              document.getElementById('artist').innerHTML = artistList;
              document.getElementById('album').innerHTML = response.item.album.name;

              if (this.playing) {
                document.getElementById('play').innerHTML = "pause";
              } else {
                document.getElementById('play').innerHTML = "play_arrow";
              }
            } else {
              document.getElementById('track').innerHTML = (jqXHR.status = 204) ? "No active device." : "Not playing a track.";
              document.getElementById('artist').innerHTML = "";
              document.getElementById('album').innerHTML = "";
              document.getElementById('play').innerHTML = "play_arrow";
              this.playing = false;
              this.locked = false;
              this.track = null;
              if (this.device != null) {
                this.emitChange(this.track);
                this.device = null;
              }
            }
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.log("failed to update player. Error code: " + jqXHR.status);
            if (jqXHR.status == 429) {
              const waitTime = parseInt(jqXHR.getResponseHeader("Retry-After")) * 1000;
              this.pingOn = false;
              setTimeout(() => {this.ping()}, waitTime);
              // Possibly do something with the wait time and the pingtime. (reduce ping time)
              console.log("Too many requests, waiting " + waitTime + " seconds before pinging starts again.");
              console.log(errorThrown);
            }
            if (jqXHR.status == 401) {
              console.log("Failed to authenticate. Re-authenticating.");
              this.authenticate();
            }
          }
      }).done(callback);
    }
  },

  togglePlay: function() {
    if(this.token == null || this.locked || this.device == null) return;
    this.locked = true;

    var play = this.playing ? "pause" : "play";
    this.playing = !this.playing;
    if (this.playing) {
      document.getElementById('play').innerHTML = "pause";
    } else {
      document.getElementById('play').innerHTML = "play_arrow";
    }

    if(this.type == "spotify") {
      $.ajax({
          url: 'https://api.spotify.com/v1/me/player/'+play,
          type: 'PUT',
          context: this,
          headers: {
            'Authorization': 'Bearer ' + this.token
          },
          success: function(response) {
            this.locked = false;
            this.retryCount = 0;
          },
          error: function(jqXHR, textStatus, errorThrown) {
            this.retryCount++;
            if (this.retryCount < this.maxTries + 1) {
              console.log(jqXHR.status);
              console.log(textStatus);
              console.log(errorThrown);
              this.update(this.togglePlay());
              // this.togglePlay(); => as callback
            } else {
              console.log("Max tries reached. Stopping updates for now. Waiting 1 second.");
              setTimeout(() => {this.update()}, 1000);
            }
          }
      });
    }
  },

  previous: function() {
    if(this.token == null || this.locked || this.device == null) return;
    this.locked = true;

    if(this.type == "spotify") {
      $.ajax({
          url: 'https://api.spotify.com/v1/me/player/previous',
          type: 'POST',
          context: this,
          headers: {
            'Authorization': 'Bearer ' + this.token
          },
          success: function(response) {
            this.locked = false;
            this.update();
          }
      });
    }
  },

  next: function() {
    if(this.token == null || this.locked || this.device == null) return;
    this.locked = true;

    if(this.type == "spotify") {
      $.ajax({
          url: 'https://api.spotify.com/v1/me/player/next',
          type: 'POST',
          context: this,
          headers: {
            'Authorization': 'Bearer ' + this.token
          },
          success: function(response) {
            this.locked = false;
            this.update();
          }
      });
    }
  },

  play: function(track, callback = function(){}) {
    if(this.token == null || this.locked || track == undefined || track == null || this.device == null) return;
    this.locked = true;

    if(this.type == "spotify") {
      $.ajax({
          url: 'https://api.spotify.com/v1/me/player/play',
          type: 'PUT',
          context: this,
          headers: {
            'Authorization': 'Bearer ' + this.token
          },
          data: JSON.stringify({
            'uris': [track.uri]
          }),
          success: function(response) {
            this.locked = false;
            callback();
            this.update();
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.log("Error playing a song.");
            console.log(textStatus);
            callback();
          }
      });
    }
  }
}


socket.on("musicPlayer", (state) => {
  if (state.item.id != Player.track.id && state.is_playing != Player.playing) {
    Player.play(state.item, function(){
      Player.togglePlay();
    });
  }

  else if (state.item.id != Player.track.id) {
    Player.play(state.item);
  }

  else if (state.is_playing != Player.playing) {
    Player.togglePlay();
  }

});
