// Gaeilge Go Deo: optional English instructions ("English Instructions Please! 🙂🙏" on the hub).
// Players switch it on/off on the hub; the choice is remembered on that device.
// Ardleibhéal games stay Irish only and never load this file.
//
// MASTER SWITCH: set to false to make the whole site Gaeilge amháin again
// (hides the hub button and all English instructions, whatever players have chosen).
var FREAMH_BEARLA_ENABLED = true;
(function () {
  var on = false;
  try { on = FREAMH_BEARLA_ENABLED && localStorage.getItem('freamh_bearla') === '1'; } catch (e) {}
  if (on) document.documentElement.classList.add('bearla');
})();
