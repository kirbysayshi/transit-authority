var StateMachine = require('../');

module.exports = Player;

function Player() {
  var self = this;
  this.track = null;
  this.index = 0;
  this.queued = [];

  // Dummy audio context.
  function noop() {}
  this.audio = { play: noop, pause: noop };

  var v = this.visual = new StateMachine({ id: 'visual' });

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
  this.visual.to('playing', cb);
}

Player.prototype.pause = function() {
  this.visual.to('paused');
}

Player.prototype.queue = function(track) {
  this.queued.push(track);

  if(this.visual.current() === 'waiting') {
    // Load up the newly queued track if we're waiting for one.
    this.visual.to('ready');
  }
}

Player.prototype.emptyQueue = function() {
  this.queued.length = 0;
  this.visual.to('waiting');
}

Player.prototype.nextTrack = function() {
  this.visual.to('next');
}