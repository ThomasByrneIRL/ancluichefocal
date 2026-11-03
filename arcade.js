// Gaeilge Go Deo: arcade controls for a four-station cabinet.
// Every station has the same four buttons (up, down, left, right) plus an optional OK/start button.
// Works with keyboard-style encoders (e.g. I-PAC) and USB gamepad encoders ("zero delay" boards).
//
// Arcade mode is OFF by default, so phones and laptops behave exactly as before.
//   Turn on:  add ?arcade=1 to any game's link once (remembered on that machine).
//   Turn off: add ?arcade=0.
//
// When arcade mode is on, a game can say whose turn it is (window.ARCADE_GAME.active()),
// and presses from every other station are ignored.
(function () {
  // ── Button map: change these to match how the cabinet is wired ──────────
  // Keyboard encoders: the key each button sends (I-PAC style defaults).
  var KEYS = [
    { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', ok: '1' }, // Station 1
    { up: 'r',       down: 'f',         left: 'd',         right: 'g',          ok: '2' }, // Station 2
    { up: 'i',       down: 'k',         left: 'j',         right: 'l',          ok: '3' }, // Station 3
    { up: 'y',       down: 'n',         left: 'v',         right: 'u',          ok: '4' }  // Station 4
  ];
  // Gamepad encoders: which connected controller (0, 1, 2, 3) belongs to each station.
  var PADS = [0, 1, 2, 3];
  var PAD_OK_BUTTONS = [0, 1, 2, 3, 8, 9];   // any of these counts as OK
  var AXIS_THRESHOLD = 0.5;

  // ── what each action becomes inside the games ───────────────────────────
  var AS_KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', ok: 'Enter' };

  var on = false;
  try {
    var q = new URLSearchParams(location.search).get('arcade');
    if (q === '1') localStorage.setItem('freamh_arcade', '1');
    if (q === '0') localStorage.removeItem('freamh_arcade');
    on = localStorage.getItem('freamh_arcade') === '1';
  } catch (e) {}
  if (window.ARCADE_FORCE) on = true;   // the button-test page

  var listeners = [];
  var Arcade = window.Arcade = {
    enabled: function () { return on; },
    // for test pages: fn(station 0-3, action, source)
    listen: function (fn) { listeners.push(fn); },
    pads: function () { return Array.prototype.filter.call(navigator.getGamepads ? navigator.getGamepads() : [], Boolean).map(function (p) { return p.index + ': ' + p.id; }); }
  };

  function lookupKey(k) {
    var key = k.length === 1 ? k.toLowerCase() : k;
    for (var s = 0; s < KEYS.length; s++) for (var a in KEYS[s]) if (KEYS[s][a] === key) return { s: s, a: a };
    return null;
  }

  function activeStation() {
    var g = window.ARCADE_GAME;
    if (!g || typeof g.active !== 'function') return -1;
    try { var v = g.active(); return typeof v === 'number' ? v : -1; } catch (e) { return -1; }
  }

  function fire(station, action, source) {
    listeners.forEach(function (fn) { try { fn(station, action, source); } catch (e) {} });
    if (on) {
      var act = activeStation();
      if (act >= 0 && station !== act) return;                 // not your turn
      var g = window.ARCADE_GAME;
      if (action === 'ok' && g && typeof g.ok === 'function') { try { if (g.ok(station) !== false) return; } catch (e) {} }
    }
    var ev = new KeyboardEvent('keydown', { key: AS_KEY[action], bubbles: true, cancelable: true });
    ev._arcade = true;
    document.dispatchEvent(ev);
  }

  // ── keyboard encoders ───────────────────────────────────────────────────
  window.addEventListener('keydown', function (e) {
    if (e._arcade || !on) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; // typing names
    var hit = lookupKey(e.key);
    if (!hit) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat) return;
    fire(hit.s, hit.a, 'key');
  }, true);

  // ── gamepad encoders ────────────────────────────────────────────────────
  var prev = {};
  function padState(p) {
    var b = function (i) { return !!(p.buttons[i] && p.buttons[i].pressed); };
    var x = p.axes[0] || 0, y = p.axes[1] || 0;
    var okBtn = PAD_OK_BUTTONS.some(b);
    return {
      up: y < -AXIS_THRESHOLD || b(12), down: y > AXIS_THRESHOLD || b(13),
      left: x < -AXIS_THRESHOLD || b(14), right: x > AXIS_THRESHOLD || b(15), ok: okBtn
    };
  }
  function poll() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (var i = 0; i < pads.length; i++) {
      var p = pads[i]; if (!p) continue;
      var station = PADS.indexOf(p.index); if (station < 0) continue;
      var now = padState(p), was = prev[p.index] || {};
      for (var a in now) if (now[a] && !was[a]) fire(station, a, 'pad');
      prev[p.index] = now;
    }
    requestAnimationFrame(poll);
  }
  window.addEventListener('gamepadconnected', function () { if (!poll._on) { poll._on = true; requestAnimationFrame(poll); } });

  // ── small badge so it's obvious arcade mode is on ───────────────────────
  if (on) document.addEventListener('DOMContentLoaded', function () {
    var d = document.createElement('div');
    d.textContent = '🕹️';
    d.title = 'Mód stuara';
    d.style.cssText = 'position:fixed;right:8px;bottom:6px;font-size:14px;opacity:.45;pointer-events:none;z-index:9999';
    document.body.appendChild(d);
  });
})();
