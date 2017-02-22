"use strict";

var options = {
  id: 59777392,
  width: '600px'
};
var player = new Vimeo.Player('player', options);

/* CUE LIST RENDERING */
function padLeft(string, pad, length) {
  // lets be honest, I didn't write this http://stackoverflow.com/a/3733257
  return (new Array(length+1).join(pad)+string).slice(-length);
}

function toMinutes(seconds) {
  // converts seconds to prettified minutes
  var minutes = Math.floor(seconds / 60);
  var secondsLeft = Math.round(seconds) % 60;
  return padLeft(minutes, '0', 2)+':'+padLeft(secondsLeft, '0', 2);
}

function createElement(element, className, content) {
  // creates an element
  content = content || ''; // default empty content
  var element = document.createElement(element);
  element.className = className;
  element.innerHTML = content;
  return element;
}

function removeCuePoint(id) {
  // remove a cue point from embedded player
  player.removeCuePoint(id).then(function() {
    refreshCueList();
  }).catch(function(error) {
    switch (error.name) {
      case 'UnsupportedError':
        console.warn('cue points are not supported with the current player or browser', error);
        break;
      case 'RangeError':
        console.warn('a cue point with the id passed wasn’t found', error);
        break;
      default:
        console.warn('some other error occurred', error);
        break;
    }
  });
}

function createCueListItem(id, seconds, text) {
  // creates a cue list item
  var cueListItem = createElement('div', 'cueListItem');
  cueListItem.appendChild(createElement('div', 'cueListItemTime', toMinutes(seconds)));
  cueListItem.appendChild(createElement('div', 'cueListItemText', text));
  var deleteButton = createElement('button', 'cueListItemDelete', 'Delete')
  deleteButton.addEventListener('click', function(event) {
    event.preventDefault();
    removeCuePoint(id);
  });
  cueListItem.appendChild(deleteButton);
  return cueListItem;
}

function clearCueList() {
  // clears cueListItems
  var currentItems = document.getElementsByClassName('cueListItem');
  while(currentItems[0]) { // remove current list items
    currentItems[0].parentNode.removeChild(currentItems[0]);
  }
}

function refreshCueList() {
  // gets current video cues and displays them
  clearCueList();
  player.getCuePoints().then(function(cuePoints) {
    for(var i=0; i < cuePoints.length; i++) {
      var cuePoint = cuePoints[i];
      document.getElementById('cueList').appendChild(
        createCueListItem(cuePoint.id, cuePoint.time, cuePoint.data.text)
      );
    }
  }).catch(function(error) {
    console.warn('getCuePoints()', error);
  });
}
refreshCueList(); // do this immediately, just in case

/* CUE CREATION */
document.getElementById('cueForm').addEventListener('submit', function(e) {
  e.preventDefault();
  player.getCurrentTime().then(function(seconds) {
    var time = seconds;
    var text = document.getElementById('cueInput').value;
    document.getElementById('cueInput').value = ''; // clear input value

    player.addCuePoint(time, {
      text: text }
    ).then(function(id) {
      refreshCueList()
    }).catch(function(error) {
      switch (error.name) {
        case 'UnsupportedError':
          console.warn('cue points are not supported with the current player or browser', error);
          break;
        case 'RangeError':
          console.warn('the time was less than 0 or greater than the video’s duration', error);
          break;
        default:
          console.warn('some other error occurred', error);
          break;
      }
    });
  }).catch(function(error) {
    console.warn('getCurrentTime()', error);
  });
});

/* CUE RENDERING */
var cueDuration = 4 * 1000;
var cueTimeout;
player.on('cuepoint', function(cuePoint) {
  clearTimeout(cueTimeout); // clear existing hide timeout
  var cue = document.getElementById('cue'); // get cue
  cue.innerHTML = cuePoint.data.text; // set cue text
  cue.style.display = 'block'; // set cue to visible
  cueTimeout = setTimeout(function() { cue.style.display = 'none' }, cueDuration); // hide cue after delay
});
