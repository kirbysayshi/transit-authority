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
  var d = this.datas = new StateMachine({ id: 'data' });

  // Visual will contain:
  // waiting => ready
  // ready => playing
  // playing => paused
  // playing => next
  // paused => next
  // next => waiting
  // next => playing

  // Data will contain:
  // ready => loading
  // loading => loaded
  // loaded => ready

  v.transition('waiting => ready', function(ctr) {

    if (!self.track) {
      if (self.queued.length === 0 || !self.queued[self.index]) {
        ctr.halt(new Error('No tracks to load'));
        return;
      }
    }

    self.track = self.queued[self.index];
    ctr.ok();
  })

  /*v.transition('waiting => playing', function(ctr) {

    // This is a "shortcut" to prevent duplicate logic...
    // Maybe?
    ctr.halt();
    ctr.to('ready', function(err) {
      if (err) throw err;
      v.to('playing');
    })
  })*/

  v.transition('ready => playing', function(ctr) {
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

    if (!self.queued[self.index]) {
      ctr.halt();
      v.to('waiting');
    } else {
      ctr.ok();
      v.to('playing');
    }
  })
}

Player.prototype.play = function() {
  this.visual.to('playing');
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

Player.prototype.nextTrack = function() {
  this.visual.to('next');
}