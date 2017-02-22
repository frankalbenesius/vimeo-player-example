"use strict";

var options = {
  id: 59777392,
  width: '600px'
};
var player = new Vimeo.Player('player', options);

player.on('cuepoint', function(cuepoint) {
  console.log('cuepoint', cuepoint);
});

document.querySelector('.cueForm').addEventListener('submit', function(e) {
  e.preventDefault();

  player.getCurrentTime().then(function(seconds) {
    var time = seconds;
    var text = document.querySelector('.cueInput').value;
    document.querySelector('.cueInput').value = ''; // clear input value

    player.addCuePoint(time, {
      text: text }
    ).then(function(id) {
      console.log('cue point added', id);
    }).catch(function(error) {
      switch (error.name) {
        case 'UnsupportedError':
          console.warn('cue points are not supported with the current player or browser');
          break;
        case 'RangeError':
          console.warn('the time was less than 0 or greater than the video’s duration');
          break;
        default:
          console.warn('some other error occurred');
          break;
      }
    });
  }).catch(function(error) {
    console.warn('getCurrentTime() error', error);
  });
});
