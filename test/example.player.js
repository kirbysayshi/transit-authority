var test = require('tape').test;
var Player = require('../examples/player');

test('Player example', function(t) {

  var p = new Player;

  var track1 = 'Track 1';
  var track2 = 'Track 2';

  // User clicks play
  p.play(function(err) {
    t.ok(err, 'Expect error if no tracks queued');

    // Oops, no tracks yet!
    p.queue(track1);
    p.queue(track2);

    p.play();
  });

  t.equal(p.machine.current(), 'playing', 'Player should be playing');
  t.equal(p.track, track1);

  // User clicks >|
  p.nextTrack();

  t.equal(p.machine.current(), 'playing', 'Player should still be playing');
  t.equal(p.track, track2);

  // User Clicks pause
  p.pause();
  t.equal(p.machine.current(), 'paused', 'Player should be paused');

  // User clicks play, and next, which should wrap around.
  p.play();
  p.nextTrack();
  t.equal(p.track, track1, 'Expect track wrap around');

  p.emptyQueue();
  t.equal(p.machine.current(), 'waiting', 'Player should be waiting after emptied queue');

  t.end();
})