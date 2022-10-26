// is_playing
// item
// - id
// - uri

const dummy = {
  is_playing: false,
  item: {
    id: "0xN2Xc4oEhaHwHZQAWLCV3",
    uri: "spotify:track:0xN2Xc4oEhaHwHZQAWLCV3"
  }
}

socket.emit('musicInfo', dummy);
console.log("Sending data");
