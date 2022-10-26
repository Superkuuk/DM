var users = [];
var id = 0;

function set(sid, name, room, npc = false) {
  var foundUser = false;
  var foundUid = -1;
  users.forEach((user, i) => {
    if (user.name == name && user.room == room) {
      // Probably same user, only update sid:
      users[i].sid = sid;
      foundUser = true;
      foundUid = user.uid;
    }
  });

  if (!foundUser) {
    // No existing user with this name and room
    foundUid = id++;
    users.push({
          uid: foundUid,
          sid: sid,
          name: name,
          room: room,
          level: 1,
          npc: npc,
          music: false,
        });
  }
  return foundUid;
}

function setMusicConnected(uid, bool = false) {
  users.forEach((user, i) => {
    if (user.uid == uid) {
      users[i].music = bool;
    }
  });
}

function getByNameRoom(name, room) {
  const filtered = users.filter(user => {return (user.name == name && user.room == room)});
  if(filtered.length > 0) {
    return filtered[filtered.length - 1];
  } else {
    return {};
  }
}

function getById(id) {
  const filtered = users.filter(user => {return user.uid == id});
  if(filtered.length > 0) {
    return filtered[filtered.length - 1];
  } else {
    return {};
  }
}

function getByName(name) {
  const filtered = users.filter(user => {return user.name == name});
  if(filtered.length > 0) {
    return filtered[filtered.length - 1];
  } else {
    return {};
  }
}

function getBySid(sid) {
  const filtered = users.filter(user => {return user.sid == sid});
  if(filtered.length > 0) {
    return filtered[filtered.length - 1];
  } else {
    return {};
  }
}

function formatUser(user) {
  return {
    name: user.name,
    level: user.level,
    npc: user.npc,
    music: user.music
  }
}

function remove(uid) {
  users = users.filter(user => {return user.uid != uid});
  return true;
}

function getUsersIn(room) {
  const filtered = users.filter(user => {return user.room == room});
  var formattedUsers = [];
  filtered.forEach((user, i) => {
    formattedUsers.push(formatUser(user));
  });
  return formattedUsers;
}

function setlevel(uid, level) {
  var lvl = 1;
  users.forEach((user, i) => {
    if (user.uid == uid) {
      lvl = parseInt(level);
      if (lvl > 20) {
        lvl = 20;
      } else if (lvl < 1) {
        lvl = 1;
      } else if (lvl == null) {
        lvl = 1;
      } else if (lvl == undefined) {
        lvl = 1;
      }
      users[i].level = lvl;
    }
  });
  return lvl;
}

// Deletes all users in room
function deleteRoom(room) {
  users.forEach((user, i) => {
    if (user.room == room) {
      remove(user.uid);
    }
  });
}

// Exports
module.exports = { set, deleteRoom, setMusicConnected, getBySid, getById, getByNameRoom, formatUser, getByName, remove, getUsersIn, setlevel };
