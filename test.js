
var test = require('tape').test;
var StateMachine = require('./');

test('Initial state is the first defined if not explicit', function(t) {
  var m = new StateMachine();
  m.transition('start => ready', function() {});

  t.equal(m.current(), 'start', 'Current state should be start');
  t.end();
});

test('Constructor accepts options', function(t) {
  var opts;
  var m;

  opts = { initial: 'ready' };
  m = new StateMachine(opts);
  t.equal(m.current(), 'ready', 'Initial state should be ready');

  opts = {
    initial: 'ready',
    transitions: {
      'start => ready': function() {},
      'ready => playing': function() {}
    }
  };
  m = new StateMachine(opts);
  t.equal(m.current(), 'ready', 'Initial state should be ready');
  t.ok(typeof m._transitions.start.ready === 'function',
    'start state has pointer to start -> ready callback');
  t.ok(typeof m._transitions.ready.playing === 'function',
    'ready state has pointer to ready -> playing callback');

  m = new StateMachine('ready');
  t.equal(m.current(), 'ready', 'Initial state should be ready');

  t.end();
});

test('A new transition populates internal states', function(t) {
  var m = new StateMachine();
  m.transition('start => ready', function() {});

  t.ok(m._transitions.start.ready,
    'start state has pointer to start -> ready callback');
  t.end();
});

test('A transition can define multiple origins', function(t) {
  var m = new StateMachine();
  m.transition('{start, epoch, reset} => ready', function() {});

  t.ok(m._transitions.start.ready,
    'start state has pointer to start -> ready callback');
  t.ok(m._transitions.epoch.ready,
    'epoch state has pointer to epoch -> ready callback');
  t.ok(m._transitions.reset.ready,
    'reset state has pointer to reset -> ready callback');
  t.end();
});

test('A transition can define multiple destinations', function(t) {
  var m = new StateMachine();
  m.transition('start => {ready, waiting, reset}', function() {});

  t.ok(m._transitions.start.ready,
    'start state has pointer to start -> ready callback');
  t.ok(m._transitions.start.waiting,
    'start state has pointer to start -> waiting callback');
  t.ok(m._transitions.start.reset,
    'start state has pointer to start -> reset callback');
  t.end();
});

test('A transition can define multiple origins and destinations', function(t) {
  var m = new StateMachine();
  m.transition('{start, epoch} => {ready, waiting}', function() {});

  t.ok(m._transitions.start.ready,
    'start state has pointer to start -> ready callback');
  t.ok(m._transitions.start.waiting,
    'start state has pointer to start -> waiting callback');
  t.ok(m._transitions.epoch.ready,
    'epoch state has pointer to epoch -> ready callback');
  t.ok(m._transitions.epoch.waiting,
    'epoch state has pointer to epoch -> waiting callback');
  t.end();
});

test('Origins and destinations can be wrapped in {} or () or not', function(t) {
  var input;
  var output = ['a', 'b', 'three'];
  var parse = StateMachine.prototype._parseGroup;

  input = '{ a, b, three }';
  t.deepEqual(parse(input), output);

  input = '( a, b, three )';
  t.deepEqual(parse(input), output);

  input = 'a, b, three';
  t.deepEqual(parse(input), output);

  input = '{ a,b,three }';
  t.deepEqual(parse(input), output);

  t.end();
})

test('Transitions throw if malformed', function(t) {
  var m = new StateMachine();

  t.throws(function() {
    m.transition(' => nope', function(){ });
  }, 'Missing start');

  t.throws(function() {
    m.transition('yep => ', function(){ });
  }, 'Missing end');

  t.throws(function() {
    m.transition(', => nope', function(){ });
  }, 'Missing multiple start');

  t.throws(function() {
    m.transition('yep => ,', function(){ });
  }, 'Missing multiple end');

  t.end();
})

test('Transitions throw if duplicatd', function(t) {
  var m = new StateMachine();
  m.transition('yep => nope', function(){ });

  t.throws(function() {
    m.transition('yep => nope', function(){ });
  }, 'Straight duplicate');

  t.throws(function() {
    m.transition('yep, hey => nope', function(){ });
  }, 'Half-start duplicate');

  t.throws(function() {
    m.transition('yep => nope, hey', function(){ });
  }, 'Half-end duplicate');

  t.throws(function() {
    m.transition('yep, hey => nope, hey', function(){ });
  }, 'Grouped duplicate');

  t.end();
})

test('An undefined origin is Error', function(t) {
  var m = new StateMachine();

  m.transition('a => b', function(ctr) {
    ctr.ok();
    m.to('c', function (err) {
      t.ok(err, 'Invalid transition should error (no b => c defined)');
      t.end();
    });
  });

  m.to('b');
})

test('An undefined destination is Error', function(t) {
  var m = new StateMachine();
  m.transition('a => c', function() {});
  m.to('b', function(err) {
    t.ok(err, 'Invalid transition should error');
    t.end();
  });
})

test('A transition controls its density by going', function(t) {

  var m = new StateMachine();
  m.transition('start => loaded', function(controller) {
    t.ok(controller, 'Transition callback receives a controller');
    t.equal(controller.fromState, 'start');
    t.equal(controller.toState, 'loaded');
    controller.ok();
  });

  m.to('loaded', function(err) {
    t.iferror(err, 'Expect a successful transition');
    t.end();
  });
});

test('A transition controls its density by halting', function(t) {

  var m = new StateMachine();
  m.transition('start => loaded', function(controller) {
    t.ok(controller, 'Transition callback receives a controller');
    t.equal(controller.fromState, 'start');
    t.equal(controller.toState, 'loaded');
    controller.halt(new Error('NO PLUTONIUM'));
  });

  m.to('loaded', function(err) {
    t.ok(err, 'Expect an error');
    t.end();
  })
});

test('A transition can spawn another transition', function(t) {
  var m = new StateMachine();

  m.transition('start => loaded', function(ctr) {
    ctr.ok();
    ctr.to('finished', function(err) {
      t.iferror(err);
      t.end();
    });
  })

  m.transition('loaded => finished', function(ctr) {
    ctr.ok();
  });

  m.to('loaded');
});

test('A transition spawning another transition warns if no ok/halt', function(t) {

  var m = new StateMachine();

  // Capture debug output for warnings.
  var _debug = m._lg;
  var _data = '';
  m._lg = function() {
    _data += [].join.call(arguments, ',');
  }

  m.transition('start => loaded', function(ctr) {
    ctr.to('finished', function(err) {
      m._lg = _debug;
      t.iferror(err);
      t.ok(_data.indexOf('WARNING: transitioning') > -1, 'stderr contains warning');
      t.end();
    });
  })

  m.transition('start => finished', function(ctr) {
    ctr.ok();
  });

  m.to('loaded');
});

test('.ok seals subsequent calls', function(t) {
  var m = new StateMachine();
  m.transition('start => loaded', function(ctr) {
    ctr.ok();
    setTimeout(function() {
      t.throws(ctr.ok)
      t.end();
    })
  })
  m.to('loaded');
})

test('.halt seals subsequent calls', function(t) {
  var m = new StateMachine();
  m.transition('start => loaded', function(ctr) {
    ctr.halt();
    setTimeout(function() {
      t.throws(ctr.halt)
      t.end();
    })
  })
  m.to('loaded');
})

test('.halt seals subsequent calls to .ok', function(t) {
  var m = new StateMachine();
  m.transition('start => loaded', function(ctr) {
    ctr.halt();
    setTimeout(function() {
      t.throws(ctr.ok)
      t.end();
    })
  })
  m.to('loaded');
})

test('.ok seals subsequent calls to .halt', function(t) {
  var m = new StateMachine();
  m.transition('start => loaded', function(ctr) {
    ctr.ok();
    setTimeout(function() {
      t.throws(ctr.halt)
      t.end();
    })
  })
  m.to('loaded');
})

var Player = require('./examples/player');

test('Player: playing ("shortcuts")', function(t) {

  var p = new Player;

  var track1 = 'Track 1';
  var track2 = 'Track 2';

  // User clicks play
  p.play(function(err) {
    t.ok(err, 'Expect error if no tracks queued');

    // Oops, no tracks yet!
    p.queue(track1);
    p.queue(track2);

    p.play();
  });

  t.equal(p.machine.current(), 'playing', 'Player should be playing');
  t.equal(p.track, track1);

  // User clicks >|
  p.nextTrack();

  t.equal(p.machine.current(), 'playing', 'Player should still be playing');
  t.equal(p.track, track2);

  // User Clicks pause
  p.pause();
  t.equal(p.machine.current(), 'paused', 'Player should be paused');

  // User clicks play, and next, which should wrap around.
  p.play();
  p.nextTrack();
  t.equal(p.track, track1, 'Expect track wrap around');

  p.emptyQueue();
  t.equal(p.machine.current(), 'waiting', 'Player should be waiting after emptied queue');

  t.end();
})


