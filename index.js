function States(opts) {
  var self = this;

  if (!opts) {
    opts = {};
  } else if (typeof opts === 'string') {
    opts = { initial: opts };
  }

  this._state = opts.initial || null;
  this._transitions = {};

  if (opts.transitions) {
    Object.keys(opts.transitions).forEach(function(name) {
      self.transition(name, opts.transitions[name]);
    });
  }

}

States.prototype.current = function() {
  return this._state;
}

States.prototype.transition = function(name, action) {
  var parsed = this._parseTransition(name);
  var from = parsed[0];
  var to = parsed[1];

  var froms = this._transitions[from] = this._transitions[from] || {};

  if (froms[to]) {
    throw new Error('Duplicate transition: ' + name);
  }

  froms[to] = action;

  if (this._state === null) {
    this._state = from;
  }
}

function noop() {}

States.prototype.to = function(newState, opt_cb) {
  var cb = opt_cb || noop;
  var self = this;

  var from = this.current();
  var entry = this._transitions[from];
  var action = entry[newState];

  var zalgoWard = function() {
    var args = arguments
    process.nextTick(function() {
      cb.apply(null, args);
    });
  }

  if (!action) {
    zalgoWard(new Error('Undefined transition requested: '
      + from + '=>' + newState));
    return;
  }

  var controller = {
    from: from,
    to: newState,
    ok: function() {
      self._state = newState;
      zalgoWard(null);
      return;
    },
    halt: function(err) {
      zalgoWard(err || null);
      return;
    }
  };

  action.call(null, controller);
}

States.prototype._transition = function(from, to) {
  this._state = to;
}

States.prototype._parseTransition = function(name) {
  var parts = name.split('=>').map(function(s) {
    return s.trim();
  });
  return parts;
}

module.exports = States;
