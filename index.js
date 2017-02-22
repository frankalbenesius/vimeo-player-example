var options = {
  id: 59777392,
  width: 600,
  loop: true
};

var player = new Vimeo.Player('player', options);

player.on('play', function() {
  console.log('played the video');
});
