
transit-authority
=================

An experiment that defines a state machine in terms of transitions.

Instead of defining states with enter/exit semantics, define what happens when states change, and _if_ the state should change when asked.

Example
-------

```js
var Machine = require('transit-authority');

var m = new Machine();
var button = document.querySelector('button#toggle');
var sound = new Audio('bawoosh.wav');

m.transition('paused => loading', function(ctr) {
  if (sound.readyState < sound.HAVE_ENOUGH_DATA) {
    // Yep, we're actually loading.
    ctr.ok();
    button.classList.add('loading');
    sound.addEventListener('canplaythrough', function canplay(e) {
      sound.removeEventListener('canplaythrough', canplay);
      ctr.to('playing');
    })
  } else {
    ctr.halt();
    ctr.to('playing');
  }
})

m.transition('paused, loading => playing', function(ctr) {
  if (sound.readyState >= sound.HAVE_ENOUGH_DATA) {
    ctr.ok();
    button.classList.remove('loading');
    button.classList.add('playing');
    sound.play();
  } else {
    ctr.halt('Audio is not loaded enough yet');
  }
})

m.transition('playing => paused', function(ctr) {
  ctr.ok();
  sound.pause();
  button.classList.remove('playing');
  button.classList.add('paused');
})
```

Examples
--------

Check [out the examples folder for some code](examples/).

Tests and Coverage
------------------

```
$ npm install
$ npm test
```

```
$ npm run test-coverage
```

If you contribute, please ensure all tests pass and coverage is at 100%!