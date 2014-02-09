var test = require('tape').test;
var StateMachine = require('../');

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