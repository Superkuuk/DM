// All functions for creating the help box under the input field.

let commands = [];

const source = document.getElementById('command'); // Command input element
const cmdHelp = document.getElementById('cmdHelp');

loadXMLDoc();

function loadXMLDoc() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      parseCommands(this);
    }
  };
  xmlhttp.open("GET", "commands.xml", true);
  xmlhttp.send();
}

function parseCommands(xml) {
  var x, i, xmlDoc, txt;
  xmlDoc = xml.responseXML;
  x = xmlDoc.getElementsByTagName("command");
  for (i = 0; i< x.length; i++) {
    args = [];
    argsXML = x[i].getElementsByTagName("arg");
    for (j = 0; j< argsXML.length; j++) {
      args.push({
        name: argsXML[j].innerHTML,
        type: argsXML[j].getAttribute("type")
      });
    }
    keys = [];
    k = x[i].getElementsByTagName("key");
    for (j = 0; j< k.length; j++) {
      keys.push({
        key: k[j].innerHTML,
        weight: k[j].getAttribute("weight")
      });
    }
    commands.push({
      id: x[i].getElementsByTagName("id")[0].innerHTML,
      name: x[i].getElementsByTagName("name")[0].innerHTML,
      keys: keys,
      description: x[i].getElementsByTagName("description")[0].innerHTML,
      args: args
    });
  }
}

function cmdHandler() {
  cmdHelp.innerHTML = "";
  cmdHelp.removeAttribute("class");

  source.value = source.value.replace(/\s{2,}/g, " ");
  if (source.value.charAt(0) == "/" && (source.value.match(/\s/g) || []).length > 0) {
    cmdHelp.style.display = "block";

    let ndArg = (source.value.match(/\s(?=\w)/g) || []).length - 1;
    const args = source.value.split(/\s(?=\w)/g);
    let help = args[0].replace(" ", "");
    sc = commands.filter(cmd => cmd.name.toLowerCase() === help.substring(1).toLowerCase())[0];

    if (!sc) return;

    sc.args.every((arg, i) => {
      if (i <= ndArg) {
        if (arg.type == "number" && !Number.isInteger(Number(args[i+1]))) {
          help += " " + args[i+1] + " < Error, please enter a number.";
          cmdHelp.setAttribute("class", "error");
          return false;
        } else {
          help += " " + args[i+1];
        }
      } else {
        help += " [" + arg.name + "]";
      }
      return true;
    });
    if (ndArg >= sc.args.length && cmdHelp.getAttribute("class") !== "error") {
      help += " < Error, only " + sc.args.length + " arguments are accepted."
      cmdHelp.setAttribute("class", "error");
    }
    cmdHelp.innerHTML = help;

  } else if (source.value.charAt(0) == "/") {
    cmdHelp.style.display = "block";

    let shownCmds = commands;

    // Filter only the matching commands
    if (source.value.length > 1) {
      shownCmds = commands.filter(cmd => {
        let keyString = "";
        cmd.keys.forEach((item, i) => {
          keyString += item.key.toLowerCase() + " ";
        });
        return keyString.search(source.value.toLowerCase().substring(1)) > -1;
      });
    }

    // Sort commands by the highest weight of their matching key set
    shownCmds.sort((cmda, cmdb) => {
      const cmdaKeys = cmda.keys.filter(key => {return key.key.search(source.value.toLowerCase().substring(1)) > -1});
      let cmdaWeight = 0;
      cmdaKeys.forEach((key, i) => {
        let keyWeight = parseInt(key.weight);
        if (keyWeight > cmdaWeight) cmdaWeight = keyWeight;
      });

      const cmdbKeys = cmdb.keys.filter(key => {return key.key.search(source.value.toLowerCase().substring(1)) > -1});
      let cmdbWeight = 0;
      cmdbKeys.forEach((key, i) => {
        let keyWeight = parseInt(key.weight);
        if (keyWeight > cmdbWeight) cmdbWeight = keyWeight;
      });
      return cmdbWeight - cmdaWeight;
    });
    shownCmds = shownCmds.slice(0,5); // Only show the top 5 commands

    if (shownCmds.length == 0) {
      cmdHelp.innerHTML = "No command found, type '/' to see all commands.";
      cmdHelp.setAttribute("class", "error");
    }
    shownCmds.forEach((item, i) => {
      var li = document.createElement("li");
      if (i == 0) {
        li.setAttribute("class", "selected");
      }
      li.appendChild(document.createTextNode("/" + item.name));
      cmdHelp.appendChild(li);
      li.addEventListener("mouseover", hoverCmdHelp);
      li.addEventListener("click", enterHelpCmd);
    });


  } else {
    cmdHelp.style.display = "none";
  }
}

function checkKeyPress(e) {
  // pick passed event or global event object if passed one is empty
  e = e || event;
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      if (cmdHelp.getAttribute("class") !== "error") {
        var sel = 0;
        for (var i = 0; i < cmdHelp.querySelectorAll('li').length; i++) {
          if(cmdHelp.querySelectorAll('li')[i].getAttribute('class') === 'selected') {
            sel = i;
          }
        }
        sel--;
        if(sel < 0) {
          sel = cmdHelp.querySelectorAll('li').length - 1;
        }
        if (cmdHelp.querySelector('li[class=selected]')) cmdHelp.querySelector('li[class=selected]').removeAttribute("class");
        if (cmdHelp.querySelector('li')) cmdHelp.querySelectorAll('li')[sel].setAttribute("class", "selected");
      }
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (cmdHelp.getAttribute("class") !== "error") {
        var sel = 0;
        for (var i = 0; i < cmdHelp.querySelectorAll('li').length; i++) {
          if(cmdHelp.querySelectorAll('li')[i].getAttribute('class') === 'selected') {
            sel = i;
          }
        }
        sel++;
        if(sel == cmdHelp.querySelectorAll('li').length) {
          sel = 0;
        }
        if (cmdHelp.querySelector('li[class=selected]')) cmdHelp.querySelector('li[class=selected]').removeAttribute("class");
        if (cmdHelp.querySelector('li')) cmdHelp.querySelectorAll('li')[sel].setAttribute("class", "selected");
      }
      break;
    case 'Tab':
      e.preventDefault();
      enterHelpCmd()
      break;
    default:
  }
}

function enterHelpCmd(el) {
  if (cmdHelp.querySelector('li[class=selected]')) {
    var c = cmdHelp.querySelector('li[class=selected]').innerHTML;
    source.value = c + " ";
  }
  source.focus();
  cmdHandler();
}

function hoverCmdHelp(e) {
  cmdHelp.querySelector('li[class=selected]').removeAttribute("class");
  e.srcElement.setAttribute("class", "selected");
}

// EventListeners:
source.addEventListener('input', cmdHandler);
document.querySelector('body').addEventListener('keydown', checkKeyPress);
