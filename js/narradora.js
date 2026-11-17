(function (global) {
  var EM = global.EM = global.EM || {};

  function poca() {
    return EM.audio.poca();
  }

  function escribir(el, texto, ms) {
    var cancelado = false;
    var termino = false;
    function completar() {
      cancelado = true;
      termino = true;
      el.textContent = texto || "";
    }
    if (!texto || poca() || ms < 30) {
      el.textContent = texto || "";
      termino = true;
    } else {
      var t0 = performance.now();
      function frame(now) {
        if (cancelado) return;
        var p = Math.min(1, (now - t0) / ms);
        el.textContent = texto.slice(0, Math.max(1, Math.floor(p * texto.length)));
        if (p < 1) requestAnimationFrame(frame);
        else termino = true;
      }
      requestAnimationFrame(frame);
    }
    return {
      completar: completar,
      termino: function () { return termino; }
    };
  }

  function sincronizar(el, texto, codigo, serio, opciones) {
    opciones = opciones || {};
    var T = EM.VOZ_TIEMPOS && EM.VOZ_TIEMPOS[codigo];
    var ctl = { termino: false, cancelado: false };
    var audioEl = null;
    var viejo = null;
    var t0 = 0, ultCT = -1, ultMs = 0;
    var total = texto.length;

    function terminar() {
      if (ctl.termino) return;
      ctl.termino = true;
      el.textContent = texto;
      if (opciones.alTerminar) opciones.alTerminar();
    }

    function caracteres(t) {
      var k = T.k;
      if (t <= k[0][0]) return 0;
      for (var i = 1; i < k.length; i++) {
        if (t <= k[i][0]) {
          var a = k[i - 1], b = k[i];
          var span = b[0] - a[0];
          var f = span > 0 ? (t - a[0]) / span : 1;
          return (a[1] + (b[1] - a[1]) * f) * total / T.n;
        }
      }
      return total;
    }

    function cuadro(ahora) {
      if (ctl.cancelado || ctl.termino) return;
      var t;
      if (audioEl) {
        if (audioEl.ended) { terminar(); return; }
        var ct = audioEl.currentTime;
        if (ct !== ultCT) { ultCT = ct; ultMs = ahora; }
        t = ultCT + Math.min(0.25, (ahora - ultMs) / 1000);
        if (audioEl.paused && ct > 0) { terminar(); return; }
      } else {
        t = (ahora - t0) / 1000;
      }
      var n = Math.floor(caracteres(t) + 0.0001);
      if (n >= total || t >= T.k[T.k.length - 1][0] + 0.02) { terminar(); return; }
      var visible = texto.slice(0, Math.max(0, n));
      if (el.textContent !== visible) el.textContent = visible;
      requestAnimationFrame(cuadro);
    }

    ctl.completar = function () {
      if (viejo) viejo.completar();
      else { ctl.cancelado = true; ctl.termino = true; el.textContent = texto; if (opciones.alTerminar) opciones.alTerminar(); }
    };
    ctl.cancelar = function () { ctl.cancelado = true; if (viejo) viejo.completar(); };
    ctl.finalizado = function () { return viejo ? viejo.termino() : ctl.termino; };
    el.textContent = "";

    if (poca() || !T) {
      viejo = escribir(el, texto, Math.max(1100, total * (serio ? 64 : 48)));
      EM.audio.reproducirVoz(codigo, texto, serio);
      return ctl;
    }

    EM.audio.prepararVoz(codigo).then(function (a) {
      if (ctl.cancelado) return;
      if (a) {
        audioEl = a;
        t0 = performance.now();
        EM.audio.arrancarVoz(a).then(function (ok) {
          if (!ok && !ctl.cancelado) { audioEl = null; t0 = performance.now(); }
        });
      } else {
        t0 = performance.now();
        if (EM.audio.estado.iniciado) EM.audio.hablar(texto, serio);
      }
      requestAnimationFrame(cuadro);
    });
    return ctl;
  }

  function presentar(codigo, texto, serio, opciones) {
    opciones = opciones || {};
    return new Promise(function (resolve) {
      var caja = opciones.caja || EM.ui.montarDialogo(opciones.boton || "Continuar");
      var linea = caja.querySelector(".linea");
      var completo = false;
      var cerrado = false;
      linea.textContent = "";
      caja.classList.toggle("serio", !!serio);

      function cerrar() {
        if (cerrado) return;
        cerrado = true;
        EM.ui._paso = null;
        if (maquina) maquina.cancelar();
        EM.audio.detenerVoz();
        resolve();
      }

      function paso() {
        if (!completo) {
          completo = true;
          if (maquina) maquina.completar();
          return;
        }
        cerrar();
      }

      var maquina = null;
      EM.ui._paso = paso;
      if (codigo === "I29" || texto === "...") {
        cerrar();
        return;
      }
      maquina = sincronizar(linea, texto, codigo, serio);
      (function vigilar() {
        if (cerrado) return;
        if (maquina.finalizado()) completo = true;
        else requestAnimationFrame(vigilar);
      })();
    });
  }

  function decir(codigo, opciones) {
    if (codigo === "I29") return silencio();
    var linea = EM.GUION[codigo];
    if (!linea) return Promise.resolve();
    if (opciones && opciones.donde) {
      return decirEn(codigo, opciones.donde, opciones.boton);
    }
    return presentar(codigo, linea.texto, linea.serio, opciones);
  }

  function decirEn(codigo, elemento, etiqueta) {
    var linea = EM.GUION[codigo];
    if (!linea) return Promise.resolve();
    return new Promise(function (resolve) {
      var completo = false;
      var cerrado = false;
      var boton = elemento.parentElement && elemento.parentElement.querySelector(".continuar");
      if (boton && etiqueta) boton.textContent = etiqueta;
      function cerrar() {
        if (cerrado) return;
        cerrado = true;
        EM.ui._paso = null;
        if (maquina) maquina.cancelar();
        EM.audio.detenerVoz();
        resolve();
      }
      function paso() {
        if (!completo) {
          completo = true;
          if (maquina) maquina.completar();
          return;
        }
        cerrar();
      }
      var maquina = sincronizar(elemento, linea.texto, codigo, linea.serio);
      EM.ui._paso = paso;
      (function vigilar() {
        if (cerrado) return;
        if (maquina.finalizado()) completo = true;
        else requestAnimationFrame(vigilar);
      })();
    });
  }

  function silencio() {
    return new Promise(function (resolve) {
      EM.audio.detenerVoz();
      EM.ui._paso = null;
      document.body.classList.add("silencio-dramatico");
      EM.audio.setReloj(false);
      setTimeout(function () { EM.audio.latidoUno(); }, 400);
      setTimeout(function () {
        document.body.classList.remove("silencio-dramatico");
        resolve();
      }, 1500);
    });
  }

  var flashActual = null;
  var flashFin = 0;

  function flash(codigo) {
    var linea = EM.GUION[codigo];
    if (!linea) return;
    var aviso = document.getElementById("flash-voz");
    if (!aviso) {
      aviso = document.createElement("p");
      aviso.id = "flash-voz";
      document.body.appendChild(aviso);
    }
    if (flashActual) flashActual.cancelar();
    clearTimeout(flashFin);
    aviso.classList.add("visible");
    var mio = flashActual = sincronizar(aviso, linea.texto, codigo, linea.serio, {
      alTerminar: function () {
        if (flashActual !== mio) return;
        flashFin = setTimeout(function () { aviso.classList.remove("visible"); }, 1100);
      }
    });
  }

  EM.narradora = {
    decir: decir,
    decirEn: decirEn,
    silencio: silencio,
    flash: flash,
    escribir: escribir
  };
})(typeof window !== "undefined" ? window : globalThis);
