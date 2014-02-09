var test = require('tape').test;
var TMachine = require('../');

test('A transition controls its density by going', function(t) {

  var m = new TMachine();
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

  var m = new TMachine();
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
  var m = new TMachine();

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

  var m = new TMachine();

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
  var m = new TMachine();
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
  var m = new TMachine();
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
  var m = new TMachine();
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
  var m = new TMachine();
  m.transition('start => loaded', function(ctr) {
    ctr.ok();
    setTimeout(function() {
      t.throws(ctr.halt)
      t.end();
    })
  })
  m.to('loaded');
})

test('If no error is passed to .halt, a default one is present', function(t) {
  var m = new TMachine();
  m.transition('start => loaded', function(ctr) {
    ctr.halt();
  })

  m.to('loaded', function(err) {
    t.ok(err, 'Default error should be present');
    t.ok(err.message === 'TransitionHalted');
    t.end();
  });
})