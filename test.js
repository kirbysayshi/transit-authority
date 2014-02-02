
var test = require('tape').test;
var StateMachine = require('./');

test('The initial state is the first transition defined if not explicit', function(t) {
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
  t.ok(typeof m._transitions.start.ready === 'function', 'start state has pointer to start -> ready callback');
  t.ok(typeof m._transitions.ready.playing === 'function', 'ready state has pointer to ready -> playing callback');

  m = new StateMachine('ready');
  t.equal(m.current(), 'ready', 'Initial state should be ready');

  var aThing = { amAThing: true };
  opts = { initial: 'ready', data: aThing };
  m = new StateMachine(opts);
  t.equal(m.current(), 'ready', 'Initial state should be ready');
  t.ok(m.data() === aThing, 'Data stash is same object');

  t.end();
});

test('A new transition populates internal states', function(t) {
  var m = new StateMachine();
  m.transition('start => ready', function() {});

  t.ok(m._transitions.start.ready, 'start state has pointer to start -> ready callback');
  t.end();
});

test('A transition controls its density by going', function(t) {

  var m = new StateMachine();
  var zalgo = true;
  m.transition('start => loaded', function(controller) {
    t.ok(controller, 'Transition callback receives a controller');
    t.equal(this, m.data(), 'Transition context should be .data');
    t.equal(controller.from, 'start');
    t.equal(controller.to, 'loaded');
    controller.go();
    zalgo = false;
  });

  m.to('loaded', function(err) {
    t.error(err, 'Expect a successful transition');
    t.equal(zalgo, false, '.to callback should be async');
    t.end();
  });
});

test('A transition controls its density by halting', function(t) {

  var m = new StateMachine();
  var zalgo = true;
  m.transition('start => loaded', function(controller) {
    t.ok(controller, 'Transition callback receives a controller');
    t.equal(this, m.data(), 'Transition context should be .data');
    t.equal(controller.from, 'start');
    t.equal(controller.to, 'loaded');
    controller.halt(new Error('NO PLUTONIUM'));
    zalgo = false;
  });

  m.to('loaded', function(err) {
    t.ok(err, 'Expect an error');
    t.equal(zalgo, false, '.to callback should be async');
    t.end();
  })
});




