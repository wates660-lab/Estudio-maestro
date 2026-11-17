(function (global) {
  var EM = global.EM = global.EM || {};
  var modoVoz = "probar";
  var fallosVoz = 0;
  var sfxMuertos = {};
  var vozActual = null;
  var latidoTimer = null;
  var relojActivo = false;

  var audio = {
    iniciado: false,
    mudo: false,
    volMusica: 0.55,
    volVoz: 1,
    ac: null,
    master: null,
    mus: null,
    sfx: null,
    nodos: null
  };

  function poca() {
    return global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function leerPrefs() {
    try {
      var c = global.localStorage && global.localStorage.getItem("em_audio");
      if (!c) return;
      var p = JSON.parse(c);
      if (typeof p.mudo === "boolean") audio.mudo = p.mudo;
      if (typeof p.volMusica === "number") audio.volMusica = p.volMusica;
      if (typeof p.volVoz === "number") audio.volVoz = p.volVoz;
    } catch (e) {  }
  }

  function guardarPrefs() {
    try {
      if (!global.localStorage) return;
      global.localStorage.setItem("em_audio", JSON.stringify({
        mudo: audio.mudo,
        volMusica: audio.volMusica,
        volVoz: audio.volVoz
      }));
    } catch (e2) {  }
  }

  function asegurar() {
    if (audio.ac) {
      if (audio.ac.state === "suspended") audio.ac.resume();
      return audio.ac;
    }
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    audio.ac = new AC();
    audio.master = audio.ac.createGain();
    audio.master.gain.value = audio.mudo ? 0 : 1;
    audio.master.connect(audio.ac.destination);
    audio.mus = audio.ac.createGain();
    audio.mus.gain.value = 0.22 * audio.volMusica;
    audio.mus.connect(audio.master);
    audio.sfx = audio.ac.createGain();
    audio.sfx.gain.value = 0.9;
    audio.sfx.connect(audio.master);
    drones();
    latido();
    return audio.ac;
  }

  function drones() {
    var ac = audio.ac;
    function osc(tipo, freq, gan) {
      var o = ac.createOscillator();
      o.type = tipo;
      o.frequency.value = freq;
      var g = ac.createGain();
      g.gain.value = gan;
      o.connect(g);
      g.connect(audio.mus);
      o.start();
      return { o: o, g: g };
    }
    var a = osc("sine", 55, 0.35);
    var b = osc("triangle", 82.5, 0.12);
    var c = osc("sawtooth", 87.3, 0.015);
    var filtro = ac.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 420;
    var lfo = ac.createOscillator();
    lfo.frequency.value = 0.07;
    var lg = ac.createGain();
    lg.gain.value = 6;
    lfo.connect(lg);
    lg.connect(a.o.frequency);
    lfo.start();
    audio.nodos = { a: a, b: b, c: c, filtro: filtro, lfo: lfo };
  }

  function setTension(n) {
    audio.tension = EM.util.clamp(n, 0, 100);
    if (!audio.nodos || !audio.ac) return;
    var k = audio.tension / 100;
    var t = audio.ac.currentTime;
    audio.nodos.c.g.gain.setTargetAtTime(0.012 + k * 0.07, t, 0.4);
    audio.nodos.b.g.gain.setTargetAtTime(0.08 + k * 0.1, t, 0.4);
    audio.nodos.a.o.frequency.setTargetAtTime(46 + k * 18, t, 0.6);
    audio.nodos.lfo.frequency.setTargetAtTime(0.05 + k * 0.4, t, 0.5);
    audio.mus.gain.setTargetAtTime((0.16 + k * 0.14) * audio.volMusica, t, 0.3);
  }

  function ruido(dur, freq, q, ganancia) {
    var ac = asegurar();
    if (!ac || audio.mudo) return;
    var n = Math.floor(ac.sampleRate * dur);
    var buffer = ac.createBuffer(1, n, ac.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < n; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    }
    var src = ac.createBufferSource();
    src.buffer = buffer;
    var f = ac.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = q;
    var g = ac.createGain();
    g.gain.value = ganancia;
    src.connect(f);
    f.connect(g);
    g.connect(audio.sfx);
    src.start();
  }

  function tono(freq, dur, tipo, ganancia) {
    var ac = asegurar();
    if (!ac || audio.mudo) return;
    var o = ac.createOscillator();
    o.type = tipo || "sine";
    o.frequency.value = freq;
    var g = ac.createGain();
    g.gain.setValueAtTime(ganancia, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g);
    g.connect(audio.sfx);
    o.start();
    o.stop(ac.currentTime + dur + 0.02);
  }

  function tocar(el) {
    try { var r = el.play(); if (r && r.catch) r.catch(function () {}); } catch (e) {}
  }

  var volFijo = (function () {
    try { var t = new Audio(); t.volume = 0.3; return t.volume === 0.3; } catch (e) { return true; }
  })();

  function poner(a, v) {
    if (!a) return;
    if (volFijo) { a.volume = v; return; }
    if (!a._g && audio.ac) {
      try {
        a._g = audio.ac.createGain();
        audio.ac.createMediaElementSource(a).connect(a._g);
        a._g.connect(audio.master || audio.ac.destination);
      } catch (e) { a._g = null; }
    }
    if (a._g) a._g.gain.value = v;
    else a.muted = v === 0;
  }

  function volMus() {
    return audio.volMusica * 0.22 * (audio.duck ? 0.4 : 1);
  }

  function ajustarMusica() {
    if (audio.pistaMusica) poner(audio.pistaMusica, audio.mudo ? 0 : volMus());
  }

  function habilitar() {
    leerPrefs();
    audio.iniciado = true;
    asegurar();
    aplicarMudo();
    if (!audio.musicaBuscada) {
      audio.musicaBuscada = true;
      probar("assets/audio/musica/ambiente.mp3", 6000).then(function (a) {
        if (!a) return probar("assets/audio/musica/tension.mp3", 6000);
        return a;
      }).then(function (a) {
        if (!a) return;
        a.loop = true;
        audio.pistaMusica = a;
        poner(a, audio.mudo ? 0 : volMus());
        tocar(a);
      });
    }
  }

  function aplicarMudo() {
    if (audio.pistaMusica) poner(audio.pistaMusica, audio.mudo ? 0 : volMus());
    if (!audio.master || !audio.ac) return;
    audio.master.gain.setTargetAtTime(audio.mudo ? 0 : 1, audio.ac.currentTime, 0.05);
    guardarPrefs();
    if (EM.ui && EM.ui.refrescarSonido) EM.ui.refrescarSonido();
  }

  function alternarMudo() {
    if (!audio.iniciado) habilitar();
    audio.mudo = !audio.mudo;
    aplicarMudo();
  }

  function setVolumen(tipo, valor) {
    if (!audio.iniciado) habilitar();
    if (tipo === "musica") audio.volMusica = valor;
    if (tipo === "voz") audio.volVoz = valor;
    if (audio.ac) setTension(audio.tension || 15);
    if (vozActual) poner(vozActual, audio.mudo ? 0 : audio.volVoz);
    if (audio.pistaMusica) poner(audio.pistaMusica, audio.mudo ? 0 : volMus());
    guardarPrefs();
  }

  function probar(ruta, espera) {
    return new Promise(function (resolve) {
      var a = new Audio();
      var listo = false;
      function fin(ok) {
        if (listo) return;
        listo = true;
        resolve(ok ? a : null);
      }
      a.preload = "auto";

      a.addEventListener("canplaythrough", function () { fin(true); });
      a.addEventListener("canplay", function () { fin(true); });
      a.addEventListener("loadeddata", function () { fin(true); });
      a.addEventListener("error", function () { fin(false); });
      a.src = ruta;
      try { a.load(); } catch (e) {}
      setTimeout(function () { fin(a.readyState >= 2 && !a.error); }, espera || 900);
    });
  }

  function sfxArchivo(nombre) {
    if (sfxMuertos[nombre]) return Promise.resolve(null);
    return probar("assets/audio/sfx/" + nombre + ".mp3").then(function (a) {
      if (!a) sfxMuertos[nombre] = true;
      return a;
    });
  }

  function tocarArchivoO(nombre, sintetico) {
    if (!audio.iniciado || audio.mudo) return;
    sfxArchivo(nombre).then(function (a) {
      if (a) {
        poner(a, audio.mudo ? 0 : 0.8);
        a.currentTime = 0;
        tocar(a);
      } else {
        sintetico();
      }
    });
  }

  function clic() { if (audio.iniciado) tono(660, 0.05, "square", 0.04); }
  function acierto() {
    tocarArchivoO("acierto", function () {
      tono(523, 0.08, "sine", 0.07);
      setTimeout(function () { tono(784, 0.12, "sine", 0.06); }, 90);
    });
  }
  function error() {
    tocarArchivoO("error", function () {
      tono(196, 0.18, "sawtooth", 0.05);
      tono(155, 0.22, "sine", 0.04);
    });
  }
  function sting() {
    tocarArchivoO("sting", function () {
      tono(90, 0.45, "sawtooth", 0.08);
      tono(70, 0.6, "sine", 0.1);
      ruido(0.25, 140, 0.7, 0.2);
    });
  }
  function claqueta() {
    tocarArchivoO("claqueta", function () {
      ruido(0.09, 1800, 0.6, 0.35);
      setTimeout(function () { ruido(0.12, 900, 0.8, 0.28); }, 40);
    });
  }
  function reflector(grande) {
    if (!audio.iniciado || audio.mudo) return;
    ruido(0.09, 1800, 1.2, 0.3);
    tono(grande ? 58 : 92, grande ? 0.9 : 0.5, "sawtooth", grande ? 0.1 : 0.05);
    setTimeout(function () { tono(grande ? 49 : 120, grande ? 1.2 : 0.35, "sine", grande ? 0.16 : 0.06); }, 60);
    if (grande) setTimeout(function () { ruido(0.4, 400, 0.6, 0.2); }, 80);
  }

  var acusadoSnd = null;
  function acusado() {
    if (!audio.iniciado || audio.mudo) return;
    if (acusadoSnd) { acusadoSnd.pause(); acusadoSnd = null; }
    sfxArchivo("acusado").then(function (a) {
      if (a) {
        poner(a, 0.85);
        a.currentTime = 0;
        acusadoSnd = a;
        tocar(a);
      } else {
        clic();
        setTimeout(function () { tono(110, 0.4, "sawtooth", 0.05); }, 80);
      }
    });
  }
  function tictac() { if (audio.iniciado) ruido(0.03, 2200, 2, 0.08); }
  function susurro() {
    if (!audio.iniciado || audio.mudo) return;
    ruido(0.7, 500, 0.4, 0.05);
  }
  function latidoUno() {
    if (!audio.iniciado || audio.mudo || !audio.ac) return;
    tono(70, 0.08, "sine", 0.12);
    setTimeout(function () { tono(54, 0.1, "sine", 0.08); }, 120);
  }

  function latido() {
    if (latidoTimer) clearTimeout(latidoTimer);
    function pulso() {
      if (!audio.iniciado) return;
      var tension = audio.tension || 10;
      var intervalo = relojActivo ? 320 : Math.round(1080 - tension * 7);
      if (poca()) intervalo = Math.max(intervalo, 700);
      latidoUno();
      latidoTimer = setTimeout(pulso, EM.util.clamp(intervalo, 280, 1400));
    }
    latidoTimer = setTimeout(pulso, 900);
  }

  function setReloj(activo) {
    relojActivo = !!activo;
  }

  function cargarVoz(codigo) {
    if (modoVoz === "sintesis") return Promise.resolve(null);
    return probar("assets/audio/voz/" + codigo + ".mp3", 2500).then(function (a) {
      if (a) { modoVoz = "archivo"; return a; }
      return probar("assets/audio/voz/" + codigo + ".wav").then(function (b) {
        if (b) { modoVoz = "archivo"; return b; }
        fallosVoz += 1;
        if (modoVoz === "probar" && fallosVoz >= 3) modoVoz = "sintesis";
        return null;
      });
    });
  }

  function elegirVoz(voces, serio) {
    var i;
    var mejor = null;
    for (i = 0; i < voces.length; i++) {
      var lang = (voces[i].lang || "").toLowerCase();
      if (lang.indexOf("es-mx") === 0) return voces[i];
      if (!mejor && lang.indexOf("es") === 0) mejor = voces[i];
    }
    return mejor;
  }

  function esperarVoces() {
    return new Promise(function (resolve) {
      if (!global.speechSynthesis) { resolve([]); return; }
      var v = speechSynthesis.getVoices();
      if (v.length) { resolve(v); return; }
      var hecho = false;
      function fin() {
        if (hecho) return;
        hecho = true;
        resolve(speechSynthesis.getVoices());
      }
      speechSynthesis.addEventListener("voiceschanged", fin);
      setTimeout(fin, 300);
    });
  }

  function hablar(texto, serio) {
    if (!global.speechSynthesis || !texto || texto === "...") return Promise.resolve();
    return esperarVoces().then(function (voces) {
      return new Promise(function (resolve) {
        try {
          var u = new SpeechSynthesisUtterance(texto);
          u.lang = "es-MX";
          var voz = elegirVoz(voces, serio);
          if (voz) u.voice = voz;
          u.rate = serio ? 0.82 : 0.95;
          u.pitch = serio ? 0.68 : 0.9;
          u.volume = audio.mudo ? 0 : audio.volVoz;
          u.onend = function () { resolve(); };
          u.onerror = function () { resolve(); };
          speechSynthesis.cancel();
          speechSynthesis.speak(u);
        } catch (e) {
          resolve();
        }
      });
    });
  }

  function reproducirVoz(codigo, texto, serio) {
    detenerVoz();
    return cargarVoz(codigo).then(function (a) {
      if (a && audio.iniciado) {
        vozActual = a;
        poner(a, audio.mudo ? 0 : audio.volVoz);
        a.currentTime = 0;
        audio.duck = true;
        ajustarMusica();
        a.onended = function () { if (vozActual === a) { audio.duck = false; ajustarMusica(); } };
        tocar(a);
        return a;
      }
      hablar(texto, serio);
      return null;
    });
  }

  function prepararVoz(codigo) {
    detenerVoz();
    if (!audio.iniciado) return Promise.resolve(null);
    return cargarVoz(codigo);
  }

  function arrancarVoz(a) {
    vozActual = a;
    poner(a, audio.mudo ? 0 : audio.volVoz);
    try { a.currentTime = 0; } catch (e) {}
    audio.duck = true;
    ajustarMusica();
    a.onended = function () { if (vozActual === a) { audio.duck = false; ajustarMusica(); } };
    try {
      var r = a.play();
      if (r && r.then) return r.then(function () { return true; }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
    return Promise.resolve(true);
  }

  function detenerVoz() {
    if (acusadoSnd) { acusadoSnd.pause(); acusadoSnd = null; }
    if (vozActual) {
      vozActual.pause();
      vozActual = null;
    }
    if (audio.duck) { audio.duck = false; ajustarMusica(); }
    if (global.speechSynthesis) speechSynthesis.cancel();
  }

  leerPrefs();
  audio.tension = 12;
  EM.audio = {
    estado: audio,
    habilitar: habilitar,
    alternarMudo: alternarMudo,
    setVolumen: setVolumen,
    setTension: setTension,
    setReloj: setReloj,
    clic: clic,
    acierto: acierto,
    error: error,
    sting: sting,
    claqueta: claqueta,
    acusado: acusado,
    reflector: reflector,
    tictac: tictac,
    susurro: susurro,
    latidoUno: latidoUno,
    reproducirVoz: reproducirVoz,
    prepararVoz: prepararVoz,
    arrancarVoz: arrancarVoz,
    hablar: hablar,
    detenerVoz: detenerVoz,
    poca: poca
  };
})(typeof window !== "undefined" ? window : globalThis);
