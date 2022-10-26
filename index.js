// TODO:
// - Error handling on client side (/error#code)
// - Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead
// - Send access_token and refresh_token via json instead of via url
// - Save chat to file of ten minste alleen in cookie voor de sessie
// - Check if username is free
// - On refresh verlies je data zoals je level.
// ---> Set user id in cookie and upon socket reconnect use that id to identify

require('dotenv').config();
const logger = require('./logger');
logger.log("Server", "Starting server...");

const express = require('express');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
const fs = require('fs'); // File system

const axios = require('axios');
const qs = require('qs');
const cors = require('cors');

// =================
// Spotify settings:
// =================
var client_id = process.env.SPOTIFY_KEY; // Your client id
var client_secret = process.env.SPOTIFY_SECRET; // Your secret
var redirect_uri = 'https://dm.pecorella.nl/cb_spotify'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state'; // Cookie name

// =================
// Server settings:
// =================
const app = express();
const port = process.env.PORT;

const cookieAge = 1000 * 60 * 60 * 24; // one day
const sessionMiddleware = sessions({
    secret: process.env.SESSION_SECRET,
    name: "PecorellaDM",
    saveUninitialized:true,
    cookie: { maxAge: cookieAge, sameSite: "lax" },
    resave: false
});

app.use(sessionMiddleware);

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const cmdlib = require('./cmdlib');
const dice = require("./dice");
const users = require("./users");
const cmd = require("./commands");

let taunts = {};
filenames = fs.readdirSync("./public/taunts/")
filenames.forEach(function(filename) {
  taunts["" + parseInt(filename)] = filename;
});
logger.log("Server", "Loaded taunts.");

// Characters allowed in chat or names
const deniedCharacters = /[^\w\'\"\d\s\*\/\-\+\.\,]/gi;
const roomnamePrefix = "room:";

// =================
// Basic routes:
// =================
app.use(express.static('public'));
app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.get('/', (req, res) => {
  if(req.session.name) {
    res.redirect('/room');
  } else {
    res.redirect('/login');
  }
});

app.get('/room', function (req, res) {
  logger.log("DEBUG - /ROOM", req.session.name);
  if(req.session.name) {
    res.sendFile(__dirname + '/public/room.html');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', function (req, res) {
  if(req.session.name) {
    res.redirect('/room');
  } else {
    res.sendFile(__dirname + '/public/login.html');
  }
});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/');
});

app.post('/join', function (req, res) {
  if(req.body.name && req.body.room
      && req.body.name.match(deniedCharacters) == null
      && req.body.room.match(deniedCharacters) == null) {
    var s = req.session;
    s.name = req.body.name;
    s.room = roomnamePrefix + req.body.room;
    res.redirect('/room');
  } else {
    res.send('Invalid username or room name');
  }
});

app.get('/spot', function (req, res) {
  res.sendFile(__dirname + '/public/spotify.html');
});

// =================
// Spotify routes:
// =================
app.get('/spotify', function(req, res) { // Login to spotify
  logger.log("DEBUG - /SPOTIFY", req.session.name);
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-modify-playback-state user-read-currently-playing user-read-playback-state'; // All scopes for Spotify Connect (adjust player)
  res.redirect('https://accounts.spotify.com/authorize?' +
    qs.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/cb_spotify', function(req, res) {
  logger.log("DEBUG - /CB_SPOTIFY", req.session.name);
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/room#' +
      qs.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);

    const headers = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: client_id,
        password: client_secret,
      },
    };
    const data = {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code',
    };

    axios.post('https://accounts.spotify.com/api/token', qs.stringify(data), headers)
      .then(function (response) {
        if (response.status == 200) {
          logger.log("DEBUG - /CB_SPOTIFY, post", req.session.name);
          res.redirect('/room#' +
            qs.stringify({
              access_token: response.data.access_token,
              refresh_token: response.data.refresh_token
            }));
        } else {
          console.log("Error");
        }
      })
      .catch(function (response) {
        console.log(response);
        res.redirect('/room#' +
          qs.stringify({
            error: 'invalid_token'
          }));
      });
  }
});

app.get('/refresh_spotify_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  const headers = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    auth: {
      username: client_id,
      password: client_secret,
    },
  };
  const data = {
    grant_type: 'refresh_token',
    refresh_token: refresh_token
  };

  axios.post('https://accounts.spotify.com/api/token', qs.stringify(data), headers)
    .then(function (response) {
      if (response.status == 200) {
        res.send({access_token: response.data.access_token});
      } else {
        console.log("Error");
      }
    })
    .catch(function (response) {
      console.log(response);
      res.redirect('/room#' +
        qs.stringify({
          error: 'invalid_token'
        }));
    });
});



// =================
// Sockets:
// =================

// convert a connect middleware to a Socket.IO middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

io.on('connection', (socket) => {
  logger.log("Sockets", "A user connected");
  const username = socket.request.session.name;
  const room = socket.request.session.room;
  let uid = -1;
  if (username && room) {

    uid = users.set(socket.id, username, room); // Returns id of user
    socket.join(room);

    io.to(room).emit('room info', {
      room: room.replace(roomnamePrefix, ""),
      users: users.getUsersIn(room)
    });

  } else {
    logger.log("Sockets", "Unallowed socket connection. Redirecting");
    var destination = '/login';
    socket.emit('redirect', destination);
  }


  socket.on('disconnect', () => {
    logger.log("Sockets", "user "+username+" disconnected");
  });

  socket.on("disconnecting", (reason) => {
    logger.log("Sockets", "user "+username+" disconnecting...");
    users.remove(uid);
    socket.to(room).emit('room info', {
      room: room ? room.replace(roomnamePrefix, "") : undefined,
      users: users.getUsersIn(room)
    });
  });

  socket.on('chat message', (msg) => {
    if (msg.match(deniedCharacters) != null) {
      // Error, Unallowed characters!
      var notAllowed = "";
      msg.match(deniedCharacters).forEach((item, i) => {
        notAllowed += item + ", ";
      });
      notAllowed = notAllowed.slice(0, -2);

      socket.emit('chat message', '<span style="color:red">Error, not allowed character ('+notAllowed+')</span>');

    } else if (msg.match(/^\d+$/) != null) {
      // Only a number found!
      // Initiating taunt :)
      io.to(room).emit('sound', "/taunts/" + taunts[msg]);
      io.to(room).emit('chat message', "<span style='color:$("+username+")'>"+username+":</span> <span style='color:grey;font-style:italic'>" + taunts[msg].split(".")[0] + "</span>");

    } else if (msg.charAt(0) === "/") { // Command commissioned...
      const command = msg.substring(1).split(" ")[0].toLowerCase();
      const strToFormat = msg.match(/(["'](\w+\s+\w*)+["'])/gi);
      if (strToFormat) {
        strToFormat.forEach((item, i) => {
          msg = msg.replace(item, item.replace(" ", "_").replace(/(["'])/gi, ""));
        });
      }

      var params = msg.split(" ");
      params.shift();
      params.forEach((item, i) => {
        params[i] = item.replace("_", " ");
      });

      logger.log("Sockets", "["+username+"] command: " + command);

      const reply = cmd.execute(command, params, users.getById(uid));
      if (reply.succes) {
        reply.chat.forEach((message, i) => {
          io.to(room).emit('chat message', message);
        });
      } else {
        reply.chat.forEach((message, i) => {
          socket.emit('chat message', '<span style="color:red">'+message+'</span>');
        });
      }

      // Special commands requiring more than only text output:
      switch (command) {
        case "setlevel": // needs to emit new user info to the room
          io.to(room).emit('room info', {
            room: room.replace(roomnamePrefix, ""),
            users: users.getUsersIn(room)
          });
          break;
        case "npc": // needs to emit new user info to the room
          io.to(room).emit('room info', {
            room: room.replace(roomnamePrefix, ""),
            users: users.getUsersIn(room)
          });
          break;
        case "exit": // needs to redirect user to logout page
          users.remove(uid);
          var destination = '/logout';
          socket.emit('redirect', destination);
          break;
        case "getdatabase": // needs to emit something
          // Is it a good idea to first replace all "_" with " " and then here replace all " " back to "_"?
          const table = params[0].replace(" ", "_").toLowerCase().trim();
          if (table == "all") {
            logger.log("Sockets", "Sending list of tables to " + username);
            socket.emit('log', Object.keys(cmdlib.lib).join(", "));
          } else {
            logger.log("Sockets", "Sending table ("+table+") for logging to " + username);
            socket.emit('log', cmdlib.lib[table]);
          }
          break;
      }


    } else { // Just a message.
      let roll = dice.roll(msg);

      roll.rolls.forEach((item, i) => {
        io.to(room).emit('chat message', "<span style='color:$("+username+")'>"+username+": " + item.t + "</span>");
      });
      io.to(room).emit('chat message', "<span style='color:$("+username+")'>"+username+":</span> " + roll.format);

    }
  });

  socket.on("musicInfo", (state) => {
    // User is connected to spotify.
    // Update user
    users.setMusicConnected(uid, state.is_playing);
    // if user starts or stops listening
    // Emit change to room that user is/stopped listening.
    //io.to(room).emit('someonePlaying', [username, isPlaying]);

    io.to(room).emit('room info', {
      room: room.replace(roomnamePrefix, ""),
      users: users.getUsersIn(room)
    });

    // Emit state to all listening players (including progress in ms)
    socket.to(room).emit('musicPlayer', state);
    // io.emit('musicPlayer', state); // DEBUG mode
  });

});



server.listen(port, () => {
  logger.log("Server", `DM app listening on port ${port}`);
});
