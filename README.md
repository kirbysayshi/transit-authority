
transit-authority
=================

An experiment that defines a state machine in terms of transitions.

Instead of defining states with enter/exit semantics, define what happens when states change, and _if_ the state should change when asked.

This might be a horrible idea.

Example
-------

A hypothetical HTML page with a play/pause button.

```js
var Machine = require('transit-authority');

var m = new Machine();
var $ = require('jquery'); // Not required, just for this example
var $document = $(document);
var $button = $('button#toggle');
var sound = new Audio('bawoosh.wav');

$document.on('click', '.paused' function(e) {
  // Just try to go to the state, we don't care if it succeeds or not.
  m.to('playing');
})

$document.on('click', '.playing' function(e) {
  // Same here.
  m.to('paused');
})

// Register a new transition.
m.transition('paused => loading', function(ctr) {
  if (sound.readyState < sound.HAVE_ENOUGH_DATA) {
    // Yep, we're actually loading. Accept the state.
    ctr.ok();
    $button.addClass('loading');
    sound.addEventListener('canplaythrough', function canplay(e) {
      sound.removeEventListener('canplaythrough', canplay);
      ctr.to('playing');
    })
  } else {
    // Nope, do not accept the state and instead go to 'playing'.
    ctr.halt();
    ctr.to('playing');
  }
})

// This transition has two possible entry points, paused or loading.
m.transition('paused, loading => playing', function(ctr) {
  if (sound.readyState >= sound.HAVE_ENOUGH_DATA) {
    ctr.ok();
    $button.removeClass('loading paused');
    $button.addClass('playing');
    sound.play();
  } else {
    ctr.halt('Audio is not loaded enough yet');
    ctr.to('loading');
  }
})

m.transition('playing => paused', function(ctr) {
  ctr.ok();
  sound.pause();
  $button.removeClass('playing');
  $button.addClass('paused');
})
```

More Examples
-------------

Check [out the examples folder](examples/) and the [test coverage](test/) for more.

API
---

### new `Machine(options)`

Options can include:

- `id`: An identifier to allow this machine to have named debug output. Defaults to a random number.
- `initial`: the initial state of the machine. If not defined, defaults to the exit state of the first defined transition.
- `transitions`: an object containing transition keys and actions:

```js
transitions: {
  'ready => loading': function(ctr) {}
}
```

### .transition(namePair, action)

A `namePair` can be anything like:

- `origin => destination`

And can also be expanded:

- `(current) => next`
- `{current, another} => next`
- `current, another => next`
- `current,another => next,future`
- `current,another => {next,future}`

The only important aspects are that a `=>` (fat arrow) separates the various `origin`s and `destination`s.

And action is simply a function that accepts a single parameter, `controller` (shortened to `ctl` or `ctr` in examples). A `controller` gives the action:

- `.ok()`: accept this transition, and move to the state defined as the `destination` state.
- `.halt(reason)`: reject this transition, and remain in the `origin` state. If a `reason` is provided it is passed along to the `.to` callback (if any) that originally requested the change. If no `reason` is given, a default error is created instead.
- `.to(newState)`: move to a new state from the current. If the transition has not be `ok()`ed or `halt()`ed prior to calling `.to`, then a warning is printed when debug output is enabled:

```js
m.transition('ready => waiting', function(ctr) {
  ctr.to('done');
})

// When transitioned to, the above would output:
// 'WARNING: transitioning waiting => done from within ready => waiting
// without acceptance (.ok) or halting (.halt) of waiting
```

### .to(newState, opt_callback)

Attempt a transition to the `newState`. If the transition is not defined, a warning will be printed in debug mode, and an `Error` will be passed as the first argument of the callback.

It's ok to no define all possible transition pairs! The warnings are just for debugging purposes.

The `opt_callback` always receives an `Error` or null (in the absence of an error) as its first argument.

Debug Output
------------

Debug output is provided by the [debug](https://github.com/visionmedia/debug) package. To enable, simply set the `debug` value of localStorage (in a browser) or `DEBUG` (in node) to `transit-authority:*`.

### Examples:

Enable debug output for all instances:

```
// Browser
localStorage.debug = 'transit-authority:*';

// node
DEBUG='transit-authority:*' node myfile.js
```

Enable for a specific named instance:

```js
var m = new TransitAuthority({ id: 'my-machine' });
```

```
// Browser
localStorage.debug = 'transit-authority:my-machine';

// node
DEBUG='transit-authority:my-machine' node myfile.js
```

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

License
-------

MIT