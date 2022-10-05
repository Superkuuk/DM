
// Dice interprenter
function roll(input) {
  if(Array.isArray(input)) {
    var r = [];
    input.forEach((item, i) => {
      r.push(handleDice(item));
    });
    return {format: "", rolls: r.reverse()};
  } else if (typeof input == 'string') {
    var r = [];
    var t = input.replace(/(\d+)?d(\d+)([\+\-\*\/]\d+)?/ig, d => {
      var ri = handleDice(d);
      r.push(ri);
      return "" + ri.r;
    });
    return {format: t, rolls: r.reverse()};
  } else {
    // Error, only strings or arrays are allowed!
    return false;
  }
}

function handleDice(item) {
  let amount = item.split("d")[0] || 1;
  let dice = item.split("d")[1].split(/[\-\+\*\/]/g)[0];
  let modSt = item.match(/[\-\+\*\/]\d/g) || [""];
  modSt = modSt[0];

  var total = 0;
  var text = "rolling " + item + ": ";
  for (var i = 0; i < amount; i++) {
    let roll = Math.floor(Math.random() * parseInt(dice)) + 1;
    text += "["+ roll +"]+";
    total += roll;
  }

  text = text.slice(0, -1);

  switch (modSt.charAt(0)) {
    case "-":
      total -= parseInt(modSt.slice(1));
      break;
    case "+":
      total += parseInt(modSt.slice(1));
      break;
    case "*":
      total = total * parseInt(modSt.slice(1));
      text = "(" + text + ")";
      break;
    case "/":
      total = Math.floor(total / parseInt(modSt.slice(1)));
      text = "(" + text + ")";
      break;
  }

  text += modSt + "=" + total;

  return {t: text, r: total};
}

// Exports
module.exports = { roll };
