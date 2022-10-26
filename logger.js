module.exports.log = function(category, msg) {
  console.log(new Date().toLocaleTimeString("nl-Nl") + " [" + category + "] " + msg);
}
