var debug = require('debug');
var pkg = require('./package.json');

function States(opts) {
  var self = this;

  if (!opts) {
    opts = {};
  } else if (typeof opts === 'string') {
    opts = { initial: opts };
  }

  this._state = opts.initial || null;
  this._transitions = {};
  this._id = opts.id || Math.floor(Math.random()*100000);
  this._lg = debug(pkg.name + ':' + this._id);

  if (opts.transitions) {
    Object.keys(opts.transitions).forEach(function(name) {
      self.transition(name, opts.transitions[name]);
    });
  }

}

States.prototype.current = function() {
  return this._state;
}

// TODO: should these create constants on the machine?
// .transition('now => then')
// .NOW .THEN

States.prototype.transition = function(name, action) {
  var self = this;

  try {
    var parsed = this._parseTransition(name);
    var froms = this._parseGroup(parsed[0]);
    var tos = this._parseGroup(parsed[1]);
  } catch(e) {
    throw new Error('Invalid transition name: ' + name + '\n' + e.message);
  }

  self._lg('Parsed transitions %s => %s', froms.join(','), tos.join(','));

  froms.forEach(function(from) {
    var fromTrans = self._transitions[from] = self._transitions[from] || {};

    tos.forEach(function(to) {
      if (fromTrans[to]) {
        throw new Error('Duplicate transition: ' + name);
      }

      fromTrans[to] = action;
      self._lg('Registered transition %s => %s', from, to);

      if (self._state === null) {
        self._state = from;
        self._lg('Setting initial state implicitely: %s', from);
      }
    })
  })
}

function noop() {}

States.prototype.to = function(newState, opt_cb) {
  var cb = opt_cb || noop;
  var self = this;

  var err;
  var from = this.current();
  var entry = this._transitions[from];

  if (!entry) {
    err = new Error('Undefined transition requested: '
      + from + ' (undefined) => ' + newState);
    self._lg(err);
    cb(err);
    return;
  }

  var action = entry[newState];

  if (!action) {
    err = new Error('Undefined transition requested: '
      + from + ' => ' + newState + ' (undefined)');
    self._lg(err);
    cb(err);
    return;
  }

  var controller = {
    fromState: from,
    toState: newState,
    oked: false,
    halted: false,
    ok: function() {
      transitionCheck();
      self._state = newState;
      self._lg('Transition ok %s => %s', from, newState);
      controller.oked = true;
      cb(null);
      return;
    },
    halt: function(err) {
      transitionCheck();
      self._lg('Halted transition %s => %s', from, newState);
      controller.halted = true;
      cb(err || null);
      return;
    },
    to: function(name, cb) {
      self._lg('Attempting transition %s => %s from within %s => %s',
        newState, name, from, newState);
      if (!controller.oked && !controller.halted) {
        self._lg('WARNING: transitioning %s => %s from within %s => %s'
          + ' without acceptance (.ok) or halting (.halt) of %s',
          newState, name, from, newState, newState);
      }
      self.to(name, cb);
      return;
    }
  };

  this._lg('Executing transition action %s => %s', from, newState);
  action.call(null, controller);
  return;

  function transitionCheck() {
    if (controller.oked === true) {
      throw new Error('Transition ' + from + ' => ' + newState + ' '
        + 'has already been completed. (Duplicate call to .ok)');
    }

    if (controller.halted === true) {
      throw new Error('Transition ' + from + ' => ' + newState + ' '
        + 'has already been halted. (Duplicate call to .halt)');
    }
  }
}

States.prototype._parseTransition = function(name) {
  var parts = name.split('=>').map(function(s) {
    return s.trim();
  });
  return parts;
}

States.prototype._parseGroup = function(group) {
  var re = /[^{}(),]+/g;
  var result = group.match(re);
  return result.map(function(s) {
    return s.trim();
  });
}

module.exports = States;
