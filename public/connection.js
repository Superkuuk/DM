var socket = io();
const userColors = ['#7FFFD4', '#DEB887', '#FF7F50', '#8B008B', '#556B2F', '#2F4F4F', '#1E90FF', '#FF8C00', '#FF6347'];
var usedColors = {};
var amountOfMessages = 20;

var messages = document.getElementById('messages');
var form = document.getElementById('commandline');
var input = document.getElementById('command');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    switch (input.value.toLowerCase().trim()) { // Filter all client side commands.
      case "/": // Don't do anything if enter has been hit after just a slash.
        break;
      case "/togglenight":
        document.querySelector('#darkModeToggle input[type=checkbox]').click();
        break;
      case "/help":
        appendMsg("<span style='color:grey'>========== Commands ==========</span>");
        let msg1 = "Available commands are: ";
        commands.forEach(cmd => {
          msg1 += cmd.name + ", ";
        });
        msg1 = msg1.slice(0, -2);
        appendMsg("<span style='color:grey'>" + msg1 + "</span>");
        commands.forEach(cmd => {
          appendMsg("<span style='color:grey'>/" + cmd.name + ":</span> <span style='color:grey;font-style:italic'>" + cmd.description + "</span>");
        });
        appendMsg("<span style='color:grey'>========== General ==========</span>");
        appendMsg("<span style='color:grey'>Use the arrow keys to select a command and use tab to autofinish it. Alternatively, use your mouse to select a command and click.</span>");
        appendMsg("<span style='color:grey'>You can enter parameters with spaces by quoting the parameter with ' or \".</span>");
        break;
      default:
        socket.emit('chat message', input.value);
    }
    input.value = '';
    cmdHandler();
  }
});

socket.on("log", (data) => {
  console.log(data);
});

socket.on("sound", (data) => {
  var audio = new Audio(data);
  audio.play();
});

socket.on("someonePlaying", (data) => {
  console.log(data);
  const username = data[0];
  const isPlaying = data[1];
  var spanText = "";
  if (isPlaying) {
    spanText = "Playing";
  }
  const elem = document.querySelector('li[u="'+username+'"]');
  console.log('li[u="'+username+'"]', elem);
  elem.insertAdjacentHTML("beforeend", "<span>"+spanText+"</span>");
});

socket.on('chat message', (msg) => {appendMsg(msg)});

function appendMsg(msg) {
  var item = document.createElement('li');
  msg = msg.replace(/(\$\(\w+\))/gi, c => {
    const username = c.replace("$(", "").replace(")", "");
    return color(username);
  });
  item.innerHTML = msg;
  messages.insertBefore(item, messages.firstChild);

  // Delete old messages.
  const elemsToRemove = Array.from(messages.children).slice(amountOfMessages);
  elemsToRemove.forEach((elem, i) => {
    elem.remove();
  });
}

socket.on('room info', (info) => {
  document.getElementById('roomname').innerHTML = info.room;
  var users = "";
  info.users.forEach((u, i) => {
    if (u.npc) {
      users += '<li u="'+u.name+'"><span class="material-symbols-outlined">smart_toy</span>'+u.name + ' (level '+ u.level +')</li>';
    } else {
      const music = u.music ? '<span class="material-symbols-outlined connectMusic">music_note</span>' : "";
      users += '<li u="'+u.name+'"><span class="material-symbols-outlined">face</span>'+u.name + ' (level '+ u.level +')'+music+'</li>';
    }
  });
  document.getElementById('players').innerHTML = users;
});

function color(user) {
  var color = '#383838';
  if (usedColors[user]) {
    color = usedColors[user];
  } else {
    var used = [];
    for (const [name, index] of Object.entries(usedColors)) {
      used.push(index);
    }
    var ci = Math.floor(Math.random() * userColors.length);
    while(!(!used.includes(ci) || used.length == userColors.length)) {
      ci = Math.floor(Math.random() * userColors.length);
    }
    usedColors[user] = userColors[ci];
    color = userColors[ci];
  }
  return color;
}

socket.on('redirect', (destination) => {
  window.location.href = destination;
});
