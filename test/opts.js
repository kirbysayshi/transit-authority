var test = require('tape').test;
var StateMachine = require('../');

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


