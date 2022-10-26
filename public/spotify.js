/**
 * Obtains parameters from the hash of the URL
 * @return Object
 */
function getHashParams() {
  var hashParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
  while ( e = r.exec(q)) {
     hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

var params = getHashParams();

var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;

if (error) {
  alert('There was an error during the authentication');
} else {
  if (access_token) {
    document.getElementById('menuToggle').click();
    // Hide connect button
    // Show player
    Player.init(access_token, refresh_token, "spotify");
    document.getElementById('musicLogin').style.display = "none";
    document.getElementById('musicControls').style.display = "block";

    // Add event handlers:
    document.getElementById('prev').addEventListener('click', () => {Player.previous()});
    document.getElementById('play').addEventListener('click', () => {Player.togglePlay()});
    document.getElementById('next').addEventListener('click', () => {Player.next()});
  } else {
    // Hide player
    // Show connect button
    document.getElementById('musicLogin').style.display = "block";
    document.getElementById('musicControls').style.display = "none";
  }
}
