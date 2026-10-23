/* Climber procedural audio. Made by Nova Labs ⭐ */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, sfxBus = null, musicBus = null, comp = null;
  var noiseBuf = null, vol = 0.8, muted = false, unlocked = false;
  var voices = 0, MAX_VOICES = 24;
  var cont = {}; // continuous layers
  var musicInt = 0, musicTimer = null, fallState = null;

  function ok() { return !!(ctx && unlocked && ctx.state === 'running'); }
  function safe(fn) { return function () { try { return fn.apply(null, arguments); } catch (e) { } }; }
  function clamp(v, a, b) { v = +v; if (v !== v) v = 0; return v < a ? a : v > b ? b : v; }
  function now() { return ctx.currentTime; }

  function build() {
    if (ctx || !AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    master = ctx.createGain(); master.gain.value = muted ? 0 : vol;
    sfxBus = ctx.createGain(); musicBus = ctx.createGain(); musicBus.gain.value = 0.35;
    sfxBus.connect(comp); musicBus.connect(comp); comp.connect(master); master.connect(ctx.destination);
    var len = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  function unlock() {
    build(); if (!ctx) return;
    if (ctx.state !== 'running' && ctx.resume) ctx.resume();
    var s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, 22050); s.connect(ctx.destination); s.start(0);
    unlocked = true; startContinuous();
  }
  function hookUnlock() {
    ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown', 'click'].forEach(function (ev) {
      window.addEventListener(ev, unlock, { passive: true, capture: true });
    });
    document.addEventListener('visibilitychange', function () {
      if (!ctx) return;
      if (document.hidden) { if (ctx.suspend) ctx.suspend(); }
      else if (unlocked && ctx.resume) ctx.resume();
    });
    window.addEventListener('pageshow', function () { if (ctx && unlocked && ctx.resume) ctx.resume(); });
  }

  // ---- voice helpers ----
  function voice(dur) { if (voices >= MAX_VOICES) return false; voices++; setTimeout(function () { voices--; }, dur * 1000 + 50); return true; }
  function noise(t, dur, type, freq, q, peak, atk, out) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + (atk || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out || sfxBus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    return { src: s, f: f, g: g };
  }
  function tone(t, dur, type, freq, freqEnd, peak, out) {
    var o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || sfxBus); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function r(a, b) { return a + Math.random() * (b - a); }

  // ---- one-shots ----
  var A = {};
  var surf = 'rock';
  A.surface = function (v) { if (v === 'rock' || v === 'snow' || v === 'ice') surf = v; };
  A.iceAxe = function () { if (!ok() || !voice(0.4)) return; var t = now();
    noise(t, 0.04, 'highpass', 4000, 1, 0.6); tone(t, 0.3, 'triangle', r(2800, 3300), null, 0.15); tone(t, 0.2, 'square', 5200, null, 0.03);
    noise(t + 0.01, 0.15, 'bandpass', 2500, 2, 0.15); };
  A.crampon = function () { if (!ok() || !voice(0.3)) return; var t = now();
    for (var i = 0; i < 3; i++) noise(t + i * 0.012, 0.03, 'highpass', r(4500, 6500), 2, 0.3);
    noise(t, 0.12, 'bandpass', 1800, 1, 0.15); tone(t, 0.15, 'triangle', 3600, null, 0.05); };
  A.grip = function (s) {
    if (surf !== 'rock') { if (!ok() || !voice(0.3)) return; s = clamp(s == null ? 0.6 : s, 0, 1); var t0 = now();
      if (surf === 'snow') { noise(t0, 0.2, 'lowpass', 1500, 0.7, 0.25 + s * 0.3, 0.02); noise(t0 + 0.05, 0.12, 'bandpass', 3500, 1, 0.08); }
      else { noise(t0, 0.06, 'highpass', 5000, 1, 0.25 + s * 0.3); tone(t0, 0.08, 'triangle', 4200, 3800, 0.04); }
      return; } if (!ok() || !voice(0.2)) return; s = clamp(s == null ? 0.6 : s, 0, 1); var t = now();
    noise(t, 0.08 + s * 0.08, 'bandpass', r(1800, 2600), 0.8, 0.25 + s * 0.4);
    noise(t, 0.05, 'lowpass', 400, 1, 0.2 * s); };
  A.slip = function () { if (!ok() || !voice(0.4)) return; var t = now();
    var n = noise(t, 0.35, 'bandpass', 3000, 2, 0.4, 0.02); n.f.frequency.exponentialRampToValueAtTime(900, t + 0.35); };
  A.footstep = function () {
    if (surf === 'snow') { if (!ok() || !voice(0.3)) return; var t1 = now();
      for (var j = 0; j < 4; j++) noise(t1 + j * 0.03, 0.06, 'bandpass', r(1500, 3000), 1.5, 0.2);
      noise(t1, 0.2, 'lowpass', 500, 1, 0.35); return; }
    if (surf === 'ice') { if (!ok() || !voice(0.2)) return; var t2 = now();
      noise(t2, 0.05, 'highpass', 3500, 1, 0.4); tone(t2, 0.06, 'sine', 140, 60, 0.25); return; } if (!ok() || !voice(0.15)) return; var t = now();
    noise(t, 0.09, 'lowpass', r(500, 800), 1, 0.5); tone(t, 0.07, 'sine', r(90, 120), 50, 0.3);
    noise(t + 0.02, 0.05, 'highpass', 3000, 1, 0.08); };
  A.chalk = function () { if (!ok() || !voice(0.5)) return; var t = now();
    noise(t, 0.45, 'bandpass', 1200, 0.5, 0.18, 0.06); noise(t, 0.1, 'highpass', 5000, 1, 0.08); };
  A.ropeFeed = function () { if (!ok() || !voice(0.6)) return; var t = now();
    var n = noise(t, 0.5, 'bandpass', 1500, 4, 0.25, 0.05); n.f.frequency.linearRampToValueAtTime(2600, t + 0.5);
    for (var i = 0; i < 4; i++) noise(t + i * 0.11, 0.04, 'highpass', 4000, 1, 0.06); };
  A.clip = function () { if (!ok() || !voice(0.3)) return; var t = now();
    tone(t, 0.12, 'triangle', 3200, 2900, 0.25); tone(t, 0.09, 'square', 4700, null, 0.05);
    noise(t, 0.02, 'highpass', 6000, 1, 0.4); noise(t + 0.06, 0.02, 'highpass', 5000, 1, 0.3); tone(t + 0.06, 0.15, 'triangle', 2400, null, 0.15); };
  A.cam = function () { if (!ok() || !voice(0.3)) return; var t = now();
    for (var i = 0; i < 3; i++) noise(t + i * 0.035, 0.025, 'bandpass', 3500 - i * 400, 3, 0.35);
    tone(t + 0.1, 0.18, 'triangle', 1900, null, 0.12); };
  A.camPop = function () { if (!ok() || !voice(0.5)) return; var t = now();
    noise(t, 0.12, 'bandpass', 1500, 1, 0.6); tone(t, 0.2, 'triangle', 2200, 800, 0.2);
    tone(t + 0.15, 0.3, 'triangle', 2600, null, 0.12); A.pebbles(3); };
  A.nut = function () { if (!ok() || !voice(0.3)) return; var t = now();
    tone(t, 0.2, 'triangle', 2100, null, 0.18); tone(t + 0.05, 0.15, 'triangle', 2700, null, 0.08); noise(t, 0.03, 'bandpass', 2500, 2, 0.3); };
  A.pebbles = function (count) { if (!ok()) return; var t = now(), n = count || Math.floor(r(4, 8));
    for (var i = 0; i < n; i++) { if (!voice(0.1)) break; var tt = t + r(0, 1.2) * (i / n + 0.1);
      noise(tt, r(0.03, 0.08), 'bandpass', r(1500, 4500), 4, r(0.08, 0.25)); } };
  A.land = function () { stopFall(); if (!ok() || !voice(0.5)) return; var t = now();
    tone(t, 0.3, 'sine', 110, 40, 0.7); noise(t, 0.25, 'lowpass', 600, 1, 0.6); A.pebbles(4); };
  A.belayCatch = function (f) { stopFall(); if (!ok() || !voice(0.8)) return; f = clamp(f == null ? 0.6 : f, 0, 1); var t = now();
    tone(t, 0.25 + f * 0.2, 'sine', 80 + f * 40, 45, 0.3 + f * 0.5);
    var n = noise(t, 0.5, 'bandpass', 700, 3, 0.2 + f * 0.3, 0.01); n.f.frequency.exponentialRampToValueAtTime(250, t + 0.5);
    tone(t + 0.02, 0.4, 'sawtooth', 160, 90, 0.05 + f * 0.08); };

  function stopFall() { if (!fallState || !ctx) return; var t = now();
    try { fallState.g.gain.cancelScheduledValues(t); fallState.g.gain.setTargetAtTime(0.0001, t, 0.05); fallState.src.stop(t + 0.3); } catch (e) { }
    fallState = null; }
  A.fallWhoosh = function (on) { if (on === false || on === 'stop') return stopFall(); if (!ok() || fallState) return;
    var t = now(), s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.7; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2200, t + 2.5);
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 1.2);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + 8); // auto-stops at 8s
    fallState = { src: s, g: g }; s.onended = function () { if (fallState && fallState.src === s) fallState = null; }; };
  A.fall = function () { if (!ok()) return; A.fallWhoosh(true); A.pebbles(5); };

  // ---- continuous layers ----
  function loopNoise(type, freq, q) { var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    var g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(sfxBus); s.start(); return { s: s, f: f, g: g }; }
  var target = { effort: 0, heart: 0, alt: 0, weather: 'clear' };
  function startContinuous() {
    if (cont.started || !ctx) return; cont.started = true;
    cont.wind = loopNoise('lowpass', 400, 0.7); cont.rain = loopNoise('highpass', 2500, 0.5);
    cont.breath = loopNoise('bandpass', 1100, 1.2); cont.howl = loopNoise('bandpass', 800, 18);
    startMusic(); tick(); setInterval(safe(tick), 100);
  }
  var phase = 0, hbNext = 0, gust = 0;
  function tick() {
    if (!ok()) return; var t = now(); phase += 0.1;
    // wind
    var a = clamp((target.alt - 5300) / 3549, 0, 1), hi = clamp((target.alt - 7000) / 1849, 0, 1), storm = target.weather === 'storm' ? 1 : 0;
    gust += (Math.random() - 0.5) * (0.2 + a * 0.5); gust = clamp(gust * 0.95, -1, 1);
    var wl = 0.03 + a * 0.25 + storm * 0.2 + Math.abs(gust) * (0.05 + a * 0.2);
    cont.wind.g.gain.setTargetAtTime(wl, t, 0.3); cont.wind.f.frequency.setTargetAtTime(300 + a * 500 + Math.abs(gust) * 700, t, 0.3);
    // above ~7000 m: thin, harsh howl (resonant bandpass sweeping with gusts)
    cont.howl.g.gain.setTargetAtTime(hi * (0.06 + Math.abs(gust) * 0.18), t, 0.4);
    cont.howl.f.frequency.setTargetAtTime(600 + hi * 500 + gust * 400, t, 0.5);
    cont.wind.f.Q.setTargetAtTime(0.7 + hi * 2, t, 0.5);
    var rl = target.weather === 'rain' ? 0.12 : storm ? 0.25 : 0; cont.rain.g.gain.setTargetAtTime(rl, t, 0.8);
    if (storm && Math.random() < 0.004) thunder();
    // breathing: rate & volume rise with effort
    var e = clamp(target.effort + a * 0.35 + hi * 0.15, 0, 1), rate = 0.25 + e * 0.6, cyc = Math.sin(phase * rate * Math.PI * 2 / 1);
    var bl = e < 0.05 ? 0 : (0.02 + e * 0.12) * (cyc > 0 ? cyc : -cyc * 0.6);
    cont.breath.g.gain.setTargetAtTime(bl, t, 0.08); cont.breath.f.frequency.setTargetAtTime(cyc > 0 ? 900 + e * 400 : 1500, t, 0.1);
    // heartbeat
    var h = target.heart; if (h > 0.05 && t >= hbNext) { var bpm = 60 + h * 80;
      if (voice(0.4)) { tone(t, 0.12, 'sine', 60, 40, 0.15 + h * 0.4); tone(t + 0.18, 0.1, 'sine', 55, 38, 0.1 + h * 0.3); }
      hbNext = t + 60 / bpm; }
  }
  function thunder() { if (!voice(3)) return; var t = now(); noise(t, 2.5, 'lowpass', 180, 1, 0.6, 0.1); noise(t, 0.3, 'lowpass', 1200, 1, 0.3); }
  A.breathing = function (e) { target.effort = clamp(e, 0, 1); };
  A.heartbeat = function (l) { target.heart = clamp(l, 0, 1); };
  A.wind = function (m) { target.alt = Math.max(0, +m || 0); };
  A.weather = function (w) { if (w === 'clear' || w === 'rain' || w === 'storm') target.weather = w; };

  // ---- music: generative pad ----
  var scale = [0, 2, 4, 7, 9, 12, 14, 16, 19], root = 146.83; // D pentatonic
  function hz(st) { return root * Math.pow(2, st / 12); }
  var padFilter = null;
  function startMusic() {
    padFilter = ctx.createBiquadFilter(); padFilter.type = 'lowpass'; padFilter.frequency.value = 700; padFilter.connect(musicBus);
    var chords = [[0, 7, 16], [-3, 4, 12], [2, 9, 14], [-5, 2, 11]], ci = 0;
    function step() { if (!ok()) return; var t = now(), c = chords[ci++ % chords.length], dur = 8 - musicInt * 3;
      padFilter.frequency.setTargetAtTime(500 + musicInt * 2500, t, 1);
      c.forEach(function (st) { [-4, 4].forEach(function (det) {
        var o = ctx.createOscillator(); o.type = musicInt > 0.5 ? 'sawtooth' : 'triangle'; o.frequency.value = hz(st); o.detune.value = det;
        var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1);
        o.connect(g); g.connect(padFilter); o.start(t); o.stop(t + dur + 1.1); }); });
      var notes = Math.floor(musicInt * 8); for (var i = 0; i < notes; i++) tone(t + i * dur / Math.max(notes, 1), 0.6, 'sine', hz(scale[Math.floor(Math.random() * scale.length)] + 12), null, 0.04 + musicInt * 0.04, musicBus);
      if (musicInt > 0.6) for (var k = 0; k < 4; k++) tone(t + k * dur / 4, 0.4, 'sine', 70, 40, 0.15 * musicInt, musicBus);
    }
    step(); (function loop() { musicTimer = setTimeout(function () { safe(step)(); loop(); }, (8 - musicInt * 3) * 1000); })();
  }
  A.setMusicIntensity = function (v) { musicInt = clamp(v, 0, 1); };
  A.summit = function () { if (!ok()) return; var t = now(); [0, 4, 7, 12, 16].forEach(function (st, i) {
      tone(t + i * 0.12, 1.6 - i * 0.1, 'triangle', hz(st + 12), null, 0.12, musicBus); tone(t + i * 0.12, 1.4, 'sine', hz(st), null, 0.06, musicBus); }); };

  // ---- global ----
  A.init = function () { hookOnce(); build(); if (ctx && ctx.state === 'running') { unlocked = true; startContinuous(); } };
  A.setMasterVolume = function (v) { vol = clamp(v, 0, 1); if (master && !muted) master.gain.setTargetAtTime(vol, now(), 0.02); };
  A.mute = function (m) { muted = m === undefined ? true : !!m; if (master) master.gain.setTargetAtTime(muted ? 0 : vol, now(), 0.02); };
  A.isUnlocked = function () { return ok(); };
  var hooked = false; function hookOnce() { if (!hooked) { hooked = true; hookUnlock(); } }

  A.unlock = function () { unlock(); };
  A.resume = function () { if (ctx && ctx.resume) ctx.resume(); };
  var api = {}; Object.keys(A).forEach(function (k) { api[k] = safe(A[k]); });
  hookOnce();
  window.CLIMB_AUDIO = api;
})();
