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

function setCurrentTime(seconds) {
  console.log('seconds', seconds);
  var leadIn = Math.max(seconds - 2, 0); // start a bit before actual cue time
  console.log('leadIn', leadIn);
  player.setCurrentTime(leadIn).catch(function(error) {
    console.warn('an error occurred setting the player time');
  });
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

function createElement(element, className, content) {
  // creates an element
  content = content || ''; // default empty content
  var element = document.createElement(element);
  element.className = className;
  element.innerHTML = content;
  return element;
}

function createCueListItem(id, seconds, text) {
  // creates a cue list item
  var cueListItem = createElement('div', 'cueListItem');

  var timeButton = createElement('button', 'cueListItemTime', toMinutes(seconds));
  timeButton.addEventListener('click', function(event) {
    event.preventDefault();
    setCurrentTime(seconds);
  });
  cueListItem.appendChild(timeButton);

  var deleteButton = createElement('button', 'cueListItemDelete', 'Delete')
  deleteButton.addEventListener('click', function(event) {
    event.preventDefault();
    removeCuePoint(id);
  });
  cueListItem.appendChild(deleteButton);

  var textWrapper = createElement('div', 'cueListItemTextWrapper');
  textWrapper.appendChild(createElement('div', 'cueListItemText', text));
  cueListItem.appendChild(textWrapper);

  return cueListItem;
}

function clearCueList() {
  // clears cueListItems && no cues message
  var currentItems = document.getElementsByClassName('cueListItem');
  while(currentItems[0]) { // remove current list items (items are removed in live list)
    currentItems[0].parentNode.removeChild(currentItems[0]);
  }
}

var noCues = document.getElementById('noCues');
function refreshCueList() {
  // gets current video cues and displays them
  clearCueList();
  player.getCuePoints().then(function(cuePoints) {
    if (cuePoints.length < 1) {
      noCues.style.display = 'block';
    } else {
      noCues.style.display = 'none';
      cuePoints.sort(function(a, b) { //sort this just in case
        return a.time - b.time;
      });
      for(var i=0; i < cuePoints.length; i++) {
        var cuePoint = cuePoints[i];
        document.getElementById('cueList').appendChild(
          createCueListItem(cuePoint.id, cuePoint.time, cuePoint.data.text)
        );
      }
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
    if (text) { // do nothing if there is not text for the cue
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
    }
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
