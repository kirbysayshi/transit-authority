var TMachine = require('../');

module.exports = Player;

function Player() {
  var self = this;
  this.track = null;
  this.index = 0;
  this.queued = [];

  // Dummy audio context.
  function noop() {}
  this.audio = { play: noop, pause: noop };

  var v = this.machine = new TMachine({ id: 'machine' });

  v.transition('waiting => ready', function(ctr) {
    self.track = self.queued[self.index];
    ctr.ok();
  })

  v.transition('ready, next, paused => playing', function(ctr) {
    self.audio.play(self.track);
    ctr.ok();
  })

  v.transition('playing => paused', function(ctr) {
    self.audio.pause();
    ctr.ok();
  })

  v.transition('playing, paused => next', function(ctr) {
    if (self.index + 1 < self.queued.length) {
      self.index += 1;
    } else {
      self.index = 0;
    }

    ctr.ok();
    self.track = self.queued[self.index];
    // Return to previous playing or paused state.
    v.to(ctr.fromState);
  })

  v.transition('playing, paused => waiting', function(ctr) {
    self.audio.pause();
    self.track = null;
    self.index = 0;
    ctr.ok();
  })
}

Player.prototype.play = function(cb) {
  this.machine.to('playing', cb);
}

Player.prototype.pause = function() {
  this.machine.to('paused');
}

Player.prototype.queue = function(track) {
  this.queued.push(track);

  if(this.machine.current() === 'waiting') {
    // Load up the newly queued track if we're waiting for one.
    this.machine.to('ready');
  }
}

Player.prototype.emptyQueue = function() {
  this.queued.length = 0;
  this.machine.to('waiting');
}

Player.prototype.nextTrack = function() {
  this.machine.to('next');
}