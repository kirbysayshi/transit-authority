
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
    t.equal(controller.from, 'start');
    t.equal(controller.to, 'loaded');
    controller.ok();
    zalgo = false;
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
    t.equal(controller.from, 'start');
    t.equal(controller.to, 'loaded');
    controller.halt(new Error('NO PLUTONIUM'));
  });

  m.to('loaded', function(err) {
    t.ok(err, 'Expect an error');
    t.end();
  })
});


