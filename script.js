"use strict";

var options = {
  id: 59777392,
  width: '600px'
};
var player = new Vimeo.Player('player', options);

/* CUE CREATION */
document.querySelector('#cueForm').addEventListener('submit', function(e) {
  e.preventDefault();

  player.getCurrentTime().then(function(seconds) {
    var time = seconds;
    var text = document.querySelector('#cueInput').value;
    document.querySelector('#cueInput').value = ''; // clear input value

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

/* CUE RENDERING */
var cueDuration = 4 * 1000;
var cueTimeout;
player.on('cuepoint', function(cuePoint) {
  clearTimeout(cueTimeout); // clear existing hide timeout
  var cue = document.querySelector('#cue'); // get cue
  cue.innerHTML = cuePoint.data.text; // set cue text
  cue.style.display = 'block'; // set cue to visible
  cueTimeout = setTimeout(function() { cue.style.display = 'none' }, cueDuration); // hide cue after delay
});
