const cmdlib = require('./cmdlib');
const dice = require("./dice");
const usersDB = require("./users");
var commands = {};

// cmd: a string which is similar to the function(name) which has to be called
// params: an array [] including all parameters (unnamed)
// user: the user calling this command
function execute(cmd, params, user) {
  if (cmd in commands) {
    return commands[cmd.toLowerCase()](params, user);
  } else {
    return {succes: false, chat: ["No such command found!"]};
  }
}

// All executable commands by the user must follow the following concept:
// commands.commandname where commandname is the commandname in lowercase (!important!) characters
// Exactly two params are needed:
// 1. an array of all parameters given by the user in the command (params)
// 2. the user who calls the command (user)
// The return value is always an object including a flag if the command was succesfully executed (succes)
// and an array of strings (chat), these strings will be displayed in the chat, each entry as a seperate row.
// If succes == false, then only the sending user will be send the chat strings. Use them to display an error message
// You can use html spans to format text. For example to have a complete blue message:
// "<span style='color:blue'>text here appears in blue</span>"
// Be aware of the quotes (single/double)
// Chat messages with succes = false will automatically be colored red.
// If the color is set to #user, the client automatically changes it to a client-side color which matches the user.

// Sets the level and return a chat message.
commands.setlevel = function(params, user) {
  let roll = dice.roll(params[0] + ""); // If a dice roll is required...
  const lvl = usersDB.setlevel(user.uid, roll.format);

  var messages = ["<span style='color:grey'>Set level of "+ user.name +" to " + lvl + "</span>"];
  roll.rolls.forEach((item, i) => {
    messages.push("<span style='color:$("+user.name+")'>"+user.name+": " + item.t + "</span>");
  });

  return {
    succes: true,
    chat: messages
  };
}

// Empty function
commands.exit = function(params, user) {
  return {succes: true, chat: []};
}

// Rolls dice
commands.roll = function(params, user) {
  let roll = dice.roll(params[0] + ""); // If a dice roll is required...
  var messages = [];
  roll.rolls.forEach((item, i) => {
    messages.push("<span style='color:$("+user.name+")'>"+user.name+": " + item.t + "</span>");
  });
  return {succes: true, chat: messages};
}

// Sends a database to user (alt code in server code)
// Succes is set to false, so only the executing user gets this message.
commands.getdatabase = function(params, user) {
  return {succes: false, chat: ["Printing database to console."]};
}

// Adds an NPC to the room or remove an NPC and return a chat message.
commands.npc = function(params, user) {
  if (params.length < 2) {
    return {succes: false, chat: ["Error during npc command. Did you enter all parameters?"]};
  }
  if (params.length == 2) {
    params.push("1"); // Add level if no level is given
  }
  if (params[0].toLowerCase() == "add") {
    const uid = usersDB.set(null, params[1], user.room, true);
    var re = commands.setlevel([params[2]], usersDB.getById(uid));
    var messages = re.chat;
    messages.push("<span style='color:grey'>Added NPC "+ params[1] +".</span>");

    return {
      succes: true,
      chat: messages
    };
  } else if (params[0].toLowerCase() == "remove") {
    const userToRemove = usersDB.getByNameRoom(params[1], user.room);
    if (userToRemove.npc) {
      usersDB.remove(userToRemove.uid);
    } else {
      return {succes: false, chat: ["Error, this player is not an NPC!"]};
    }

    return {
      succes: true,
      chat: ["<span style='color:grey'>Removed NPC "+ params[1] +".</span>"]
    };
  } else {
    return {succes: false, chat: ["Error during npc command. Did you enter the command correctly?"]};
  }
}

// Exports. Keep this at the bottom of the file!
module.exports = { execute };
