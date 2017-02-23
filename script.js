"use strict";

var options = {
  id: 59777392,
  width: '600px'
};
var player = new Vimeo.Player('player', options);
var error = document.getElementById('error');
var noCues = document.getElementById('noCues');

var cueDuration = 4 * 1000;
var cueTimeout; // for cancelling timeouts later


/* LOCALSTORAGE */

function storageAvailable(type) {
  try {
    var storage = window[type],
      x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch(e) {
    return false;
  }
}

function storeCuesLocally(cues) {
  if (storageAvailable('localStorage')) {
    var storage = window.localStorage;
    storage.setItem('cues', JSON.stringify(cues));
  }
}

// add cues to player if found locally
if (storageAvailable('localStorage')) {
  var storage = window.localStorage;
  if (storage.cues) {
    var cues = JSON.parse(storage.getItem('cues'));
    var addCuePointPromises = cues.map(function(cue) {
      return player.addCuePoint(cue.time, { text: cue.data.text });
    });
    Promise.all(addCuePointPromises).then(function() {
      refreshCueList();
    });
  }
}


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
  player.setCurrentTime(leadIn).then(function() {
    clearError();
  }).catch(function(error) {
    console.warn('an error occurred setting the player time');
    setError('while setting the player time');
  });
}

function removeCuePoint(id) {
  // remove a cue point from embedded player
  player.removeCuePoint(id).then(function() {
    refreshCueList();
    clearError();
  }).catch(function(error) {
    setError('while deleting the cue');
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

function refreshCueList() {
  // gets current video cues and displays them
  clearCueList();
  player.getCuePoints().then(function(cuePoints) {
    clearError();
    storeCuesLocally(cuePoints);
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
    setError('while refreshing the cue list');
  });
}


/* CUE CREATION */

document.getElementById('cueForm').addEventListener('submit', function(e) {
  e.preventDefault();
  player.getCurrentTime().then(function(seconds) {
    clearError();
    var time = seconds;
    var text = document.getElementById('cueInput').value;
    if (text) { // do nothing if there is not text for the cue
      document.getElementById('cueInput').value = ''; // clear input value

      player.addCuePoint(time, {
        text: text }
      ).then(function(id) {
        refreshCueList();
        clearError();
      }).catch(function(error) {
        setError('while adding the cue');
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
    setError('while getting the current player time');
  });
});


/* CUE RENDERING */

player.on('cuepoint', function(cuePoint) {
  clearTimeout(cueTimeout); // clear existing hide timeout
  var cue = document.getElementById('cue'); // get cue
  cue.innerHTML = cuePoint.data.text; // set cue text
  cue.style.display = 'block'; // set cue to visible
  cueTimeout = setTimeout(function() { cue.style.display = 'none' }, cueDuration); // hide cue after delay
});

/* ERROR HANDLING */
// this error handling isn't perfect, but at least it provides some feedback

function setError(wrongText) {
  error.style.display = 'inline-block';
  error.innerHTML = 'Something went wrong ' + wrongText + '. Please try another operation or refresh the page.';
}
function clearError() {
  error.style.display = 'none';
}
