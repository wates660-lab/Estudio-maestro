(function (global) {
  var EM = global.EM = global.EM || {};
  var mq = global.matchMedia ? global.matchMedia("(pointer: coarse)") : null;
  EM.tactil = !!(mq && mq.matches);

  function marcar() {
    if (document.body) document.body.classList.toggle("tactil", EM.tactil);
  }

  function despertar() {
    var a = EM.audio && EM.audio.estado;
    if (a && a.ac && a.ac.state !== "running") {
      try { a.ac.resume(); } catch (e) {}
    }
  }

  var VISTA_FIJA = "width=1280, viewport-fit=cover";
  var VISTA_ABIERTA = "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover";

  function esTelefono() {
    var corto = Math.min(global.screen.width, global.screen.height);
    return EM.tactil && corto < 600;
  }

  function ajustarVista() {
    var tel = esTelefono();
    var vertical = global.matchMedia("(orientation: portrait)").matches;
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    var quiere = tel && !vertical ? VISTA_FIJA : VISTA_ABIERTA;
    if (meta.getAttribute("content") !== quiere) meta.setAttribute("content", quiere);
    if (document.body) document.body.classList.toggle("vertical", tel && vertical);
  }

  ajustarVista();
  document.addEventListener("DOMContentLoaded", function () { marcar(); ajustarVista(); });
  global.addEventListener("orientationchange", function () { setTimeout(ajustarVista, 80); setTimeout(ajustarVista, 400); });
  global.addEventListener("resize", ajustarVista);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) despertar(); });
  document.addEventListener("pointerdown", despertar, { passive: true });
  global.addEventListener("pageshow", despertar);
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (n) {
    document.addEventListener(n, function (e) { e.preventDefault(); });
  });
  document.addEventListener("contextmenu", function (e) {
    if (EM.tactil) e.preventDefault();
  });
})(window);
