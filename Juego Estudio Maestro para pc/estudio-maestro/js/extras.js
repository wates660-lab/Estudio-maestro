(function (global) {
  "use strict";
  var EM = global.EM;

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  var KEY = "em_progreso";
  var KEYG = "em_guardado";
  var cache = null;
  var guardadoMem = null;

  function progreso() {
    if (cache) return cache;
    cache = { insignias: {}, culpables: {} };
    try {
      var crudo = global.localStorage && global.localStorage.getItem(KEY);
      if (crudo) {
        var o = JSON.parse(crudo);
        if (o && typeof o === "object") {
          cache.insignias = o.insignias || {};
          cache.culpables = o.culpables || {};
        }
      }
    } catch (e) {}
    return cache;
  }

  function guardarProgreso() {
    try { global.localStorage.setItem(KEY, JSON.stringify(progreso())); } catch (e) {}
  }

  function guardarPartida(estado, ronda) {
    try {
      var copia = JSON.parse(JSON.stringify(estado));
      copia.ronda = ronda;
      var paquete = { ronda: ronda, estado: copia };
      guardadoMem = paquete;
      global.localStorage.setItem(KEYG, JSON.stringify(paquete));
    } catch (e) {}
  }

  function leerGuardado() {
    try {
      var crudo = global.localStorage && global.localStorage.getItem(KEYG);
      if (crudo) {
        var o = JSON.parse(crudo);
        if (o && o.estado && o.ronda) return o;
      }
    } catch (e) {}
    return guardadoMem;
  }

  function borrarGuardado() {
    guardadoMem = null;
    try { global.localStorage.removeItem(KEYG); } catch (e) {}
  }

  function restaurar() {
    var g = leerGuardado();
    if (!g) return null;
    var e = EM.estado.crear(Math.random);
    Object.keys(g.estado).forEach(function (k) {
      if (k !== "azar") e[k] = g.estado[k];
    });
    e.salto = true;
    e.ronda = g.ronda;
    e.expTemp = null;
    return e;
  }

  var INSIGNIAS = [
    { id: "jefe", nombre: "Jefe que escucha", desc: "Aciertas en Liderazgo y en Comunicación.", letra: "J" },
    { id: "imprevistos", nombre: "Cero imprevistos", desc: "Dejas al menos 10% de colchón en el presupuesto.", letra: "$" },
    { id: "organigrama", nombre: "Organigrama perfecto", desc: "Los 5 puestos en su lugar.", letra: "O" },
    { id: "reflejos", nombre: "Reflejos de director", desc: "Decides bien antes de que se acabe el reloj.", letra: "R" },
    { id: "detective", nombre: "Ojo de detective", desc: "Cazas al culpable sin usar pistas falsas.", letra: "D" },
    { id: "sinmala", nombre: "Sin una mala", desc: "Terminas sin ninguna decisión en rojo.", letra: "✓" },
    { id: "anio", nombre: "Gerente del año", desc: "Cierras con 90 puntos o más.", letra: "★" },
    { id: "sobreviviste", nombre: "Sobreviviste a todo", desc: "Moral arriba de 50 después del sabotaje.", letra: "S" }
  ];

  function defInsignia(id) {
    for (var i = 0; i < INSIGNIAS.length; i++) if (INSIGNIAS[i].id === id) return INSIGNIAS[i];
    return null;
  }

  var cola = [];
  var mostrando = false;

  function siguienteToast() {
    var ins = cola.shift();
    if (!ins) { mostrando = false; return; }
    mostrando = true;
    var t = el("div", "toast-insignia");
    t.appendChild(el("span", "ins-ico", ins.letra));
    var txt = el("div", "ins-txt");
    txt.appendChild(el("small", null, "Insignia"));
    txt.appendChild(el("strong", null, ins.nombre));
    t.appendChild(txt);
    document.body.appendChild(t);
    if (EM.audio && EM.audio.acierto) EM.audio.acierto();
    requestAnimationFrame(function () { t.classList.add("visible"); });
    setTimeout(function () {
      t.classList.remove("visible");
      setTimeout(function () { t.remove(); siguienteToast(); }, 450);
    }, 3300);
  }

  function otorgar(estado, id) {
    estado.insignias = estado.insignias || [];
    if (estado.insignias.indexOf(id) >= 0) return;
    estado.insignias.push(id);
    progreso().insignias[id] = 1;
    guardarProgreso();
    var def = defInsignia(id);
    if (def) { cola.push(def); if (!mostrando) siguienteToast(); }
  }

  var DUENO = {
    planeacion: "monica", organizacion: "theo", direccion: "maria", control: "rey", liderazgo: "maria",
    decisiones: "rey", gestion: "rey", trabajo: "theo", comunicacion: "luis", proyectos: "monica"
  };

  var GLOBOS = {
    maria: { mal: ["¡Hmph!", "Aghh…", "¿En serio?", "Tsk."], bien: ["Al fin.", "Mmm, eso sí.", "¡Eso!"], neutro: ["Mmm.", "Ajá."] },
    luis: { mal: ["Uuuy…", "Esto lo cuento.", "Ay, no."], bien: ["Jeje, bien.", "¡Va!", "Eso sí se cuenta."], neutro: ["Ajá…", "Interesante."] },
    rey: { mal: ["Eso no cuadra.", "Tsss…", "Bah."], bien: ["Bien.", "Cuadró.", "Aprobado."], neutro: ["Hmm.", "Veremos."] },
    monica: { mal: ["Qué decepción.", "Uf…", "Hm."], bien: ["Eso sí tiene sentido.", "¡Entonces sí leíste!", "Bien."], neutro: ["Mm.", "Okay…"] },
    theo: { mal: ["¿Y yo qué?", "Aghh…", "Uy."], bien: ["¡Va!", "¡Órale!", "¡Eso!"], neutro: ["Eh…", "Okay."] }
  };

  function azarDe(lista) { return lista[Math.floor(Math.random() * lista.length)]; }

  function elegirAfectado(estado, ficha, resultado, antesRes) {
    var mejor = null;
    var mayor = 2;
    EM.SOSPECHOSOS.forEach(function (id) {
      if (estado.ausentes && estado.ausentes[id]) return;
      var d = (estado.resentimiento[id] || 0) - (antesRes[id] || 0);
      if (Math.abs(d) > mayor) { mayor = Math.abs(d); mejor = { id: id, delta: d }; }
    });
    var animo;
    var id;
    if (mejor) {
      id = mejor.id;
      animo = mejor.delta > 0 ? "mal" : "bien";
    } else {
      id = DUENO[ficha.concepto] || azarDe(EM.SOSPECHOSOS);
      if (estado.ausentes && estado.ausentes[id]) {
        var vivos = EM.SOSPECHOSOS.filter(function (x) { return !estado.ausentes[x]; });
        id = vivos.length ? azarDe(vivos) : null;
      }
      animo = resultado.calidad === "bien" ? "bien" : resultado.calidad === "mal" ? "mal" : "neutro";
    }
    return id ? { id: id, animo: animo } : null;
  }

  var temporizadorCara = null;

  function reaccionPersonaje(estado, ficha, resultado, antesRes) {
    var quien = elegirAfectado(estado, ficha, resultado, antesRes || {});
    if (!quien) return;
    var esc = document.getElementById("escenario");
    if (!esc) return;
    if (quien.animo !== "neutro") {
      estado.expTemp = {};
      estado.expTemp[quien.id] = quien.animo === "mal" ? "molesto" : "contento";
      EM.ui.ponerEscena(estado);
      clearTimeout(temporizadorCara);
      temporizadorCara = setTimeout(function () {
        estado.expTemp = null;
        if (document.getElementById("escenario") && EM.juego.fase === "partida") EM.ui.ponerEscena(estado);
      }, 3600);
    }
    var fig = esc.querySelector('.persona[data-quien="' + quien.id + '"]');
    if (!fig) return;
    if (quien.animo !== "neutro") fig.classList.add(quien.animo === "mal" ? "reacciona-mal" : "reacciona-bien");
    var er = esc.getBoundingClientRect();
    var fr = fig.getBoundingClientRect();
    var globo = el("div", "globito " + quien.animo);
    globo.appendChild(el("span", "g", azarDe(GLOBOS[quien.id][quien.animo])));
    globo.style.left = Math.round(fr.left - er.left + fr.width / 2) + "px";
    globo.style.top = Math.max(40, Math.round(fr.top - er.top + fr.height * 0.12)) + "px";
    esc.appendChild(globo);
    setTimeout(function () { globo.remove(); }, 2700);
  }

  function trasDecision(estado, ficha, accion, resultado, antesRes) {
    var lid = false;
    var com = false;
    estado.historial.forEach(function (x) {
      if (x.cuentaConcepto && x.calidad === "bien") {
        if (x.concepto === "liderazgo") lid = true;
        if (x.concepto === "comunicacion") com = true;
      }
    });
    if (lid && com) otorgar(estado, "jefe");
    var h = estado.historial[estado.historial.length - 1];
    if (h && h.id === ficha.id) {
      if (ficha.tipo === "presupuesto") {
        var m = /imprevistos (\d+)%/.exec(h.eleccion || "");
        if (m && Number(m[1]) >= 10) otorgar(estado, "imprevistos");
      }
      if (ficha.tipo === "organigrama") {
        var o = /(\d) de 5/.exec(h.eleccion || "");
        if (o && Number(o[1]) === 5) otorgar(estado, "organigrama");
      }
      if (ficha.tipo === "reloj" && resultado.calidad === "bien") otorgar(estado, "reflejos");
    }
    reaccionPersonaje(estado, ficha, resultado, antesRes);
  }

  function trasAcusar(estado) {
    if (!estado.acierto) return;
    var usadas = estado.pistasUsadas || [];
    if (!usadas.length) return;
    var ok = usadas.every(function (id) {
      var p = EM.CATALOGO_PISTAS.filter(function (x) { return x.id === id; })[0];
      return p && p.tipo !== "falsa";
    });
    if (ok) otorgar(estado, "detective");
  }

  function alFinalizar(estado, fin) {
    var sinMala = !estado.historial.some(function (x) { return x.cuentaConcepto && x.calidad === "mal"; });
    if (sinMala) otorgar(estado, "sinmala");
    if (fin.id === "anio") otorgar(estado, "anio");
    if (estado.sabotajeOcurrido && estado.moral > 50) otorgar(estado, "sobreviviste");
    if (estado.saboteador) progreso().culpables[estado.saboteador] = 1;
    guardarProgreso();
    borrarGuardado();
  }

  var CORTOS = ["Planeación", "Organización", "Dirección", "Control", "Liderazgo", "Decisiones", "Recursos", "Equipo", "Comunicación", "Proyectos"];

  function radar(estado) {
    var cx = 230, cy = 205, R = 128, n = EM.CONCEPTOS.length;
    function punto(i, f) {
      var a = (-90 + i * 360 / n) * Math.PI / 180;
      return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f];
    }
    var s = '<svg viewBox="0 0 460 410" role="img" aria-label="Radar de los 10 conceptos">';
    [0.2, 0.4, 0.6, 0.8, 1].forEach(function (f) {
      var pts = [];
      for (var i = 0; i < n; i++) pts.push(punto(i, f).join(","));
      s += '<polygon points="' + pts.join(" ") + '" fill="none" stroke="rgba(236,227,208,.18)" stroke-width="1"/>';
    });
    var val = [];
    for (var i = 0; i < n; i++) {
      var p = punto(i, 1);
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="rgba(236,227,208,.14)"/>';
      var pt = estado.puntajeConcepto[EM.CONCEPTOS[i].id];
      var f = Math.max(0.04, (pt == null ? 0 : pt) / 10);
      val.push(punto(i, f));
    }
    s += '<polygon points="' + val.map(function (q) { return q.join(","); }).join(" ") + '" fill="rgba(242,163,58,.3)" stroke="#f2a33a" stroke-width="2.5" stroke-linejoin="round"/>';
    for (var j = 0; j < n; j++) {
      var q = val[j];
      s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="4" fill="#ffc978"/>';
      var l = punto(j, 1.2);
      var anc = Math.abs(l[0] - cx) < 8 ? "middle" : l[0] > cx ? "start" : "end";
      var pt2 = estado.puntajeConcepto[EM.CONCEPTOS[j].id];
      s += '<text x="' + l[0] + '" y="' + (l[1] + 4) + '" text-anchor="' + anc + '" fill="#ece3d0" font-size="13" font-family="Source Sans 3, Segoe UI, sans-serif">' +
        CORTOS[j] + ' <tspan fill="#ffc978" font-weight="700">' + (pt2 == null ? 0 : pt2) + '</tspan></text>';
    }
    s += "</svg>";
    var caja = el("section", "radar");
    caja.appendChild(el("h3", null, "Tus 10 conceptos"));
    var dib = el("div", "radar-dibujo");
    dib.innerHTML = s;
    caja.appendChild(dib);
    return caja;
  }

  var EPILOGOS = {
    maria: {
      bajo: "María abrió su propia casa productora y te mandó invitación al estreno. Con tu nombre en los agradecimientos.",
      medio: "María sigue en el estudio. Trabaja, guarda su libreta y, cuando le preguntan por ti, sonríe a medias.",
      alto: "María dirige ahora para la competencia. Su primer corto trata de un jefe que nunca escucha. Nadie dijo tu nombre. No hizo falta."
    },
    luis: {
      bajo: "Luis sigue editando y enterándose de todo. Esta vez lo que cuenta es bueno.",
      medio: "Luis lleva un canal de chismes del medio. Sales en el episodio tres, sin pena ni gloria.",
      alto: "Luis publicó su versión de lo que pasó. Tiene más seguidores que el estudio."
    },
    rey: {
      bajo: "Rey fue ascendido a director de producción. Su primera regla: todo gasto, con doble firma.",
      medio: "Rey sigue cuidando el dinero. Ahora también revisa tus recibos.",
      alto: "Rey cobró su último cheque y se mudó de ciudad. Nadie volvió a abrir esa caja chica."
    },
    monica: {
      bajo: "Mónica vendió su guion. Se estrena el año que viene y te agradece en los créditos.",
      medio: "Mónica escribe en cafés. Dice que ya tiene el final, pero no te lo cuenta.",
      alto: "Mónica guardó el guion en un cajón. Dice que nunca supo de qué trataba."
    },
    theo: {
      bajo: "Theo opera su propia cámara. Dice que ese set fue donde aprendió a no perderse.",
      medio: "Theo sigue de becario. Sabe dónde está cada cable, pero nunca pregunta nada.",
      alto: "Theo dejó la carrera. Hoy vende cámaras usadas y a veces mira una tarjeta de memoria vieja."
    }
  };

  function textoEpilogo(estado, id) {
    var r = estado.resentimiento[id] || 0;
    var nivel = r <= 20 ? "bajo" : r >= 50 ? "alto" : "medio";
    var base = EPILOGOS[id][nivel];
    if (estado.saboteador === id) {
      return (estado.acierto ? "Lo señalaste a tiempo. " : "Se salió con la suya. ") + base;
    }
    if (estado.seFue === id) return "Se fue sin ser el culpable. Esa renuncia fue cosa tuya. " + base;
    return base;
  }

  function textoClaudia(estado) {
    if (estado.calidad >= 75) return "Claudia entregó la película en el festival y pidió que la siguiente fuera contigo.";
    if (estado.calidad >= 50) return "Claudia pagó la factura y dijo «tal vez» sobre una segunda parte.";
    return "Claudia no volvió a llamar. Su abogado sí.";
  }

  function epilogo(estado, fin) {
    return new Promise(function (resolve) {
      var doc = el("article", "epilogo");
      doc.appendChild(el("p", "kicker", "Después de los créditos"));
      doc.appendChild(el("h2", null, "¿Y qué fue de cada quien?"));
      var rejilla = el("div", "epilogo-rejilla");
      EM.SOSPECHOSOS.concat(["claudia"]).forEach(function (id) {
        var t = el("section", "epilogo-ficha");
        var foto = el("div", "epilogo-foto");
        var exp = id === "claudia" ? (estado.calidad >= 70 ? "contenta" : estado.calidad < 45 ? "molesta" : "neutral")
          : (estado.saboteador === id ? "culpable" : EM.estado.expresionDe(estado, id));
        foto.appendChild(EM.escenas.obtenerRetrato(id, exp));
        t.appendChild(foto);
        var tx = el("div", "epilogo-texto");
        tx.appendChild(el("h3", null, EM.PERSONAJES[id].nombre));
        tx.appendChild(el("p", null, id === "claudia" ? textoClaudia(estado) : textoEpilogo(estado, id)));
        t.appendChild(tx);
        rejilla.appendChild(t);
      });
      doc.appendChild(rejilla);
      var gan = (estado.insignias || []).map(defInsignia).filter(Boolean);
      var bloque = el("div", "epilogo-insignias");
      bloque.appendChild(el("h3", null, gan.length ? "Insignias de esta partida" : "Esta vez no ganaste insignias"));
      var fila = el("div", "chips-insignias");
      gan.forEach(function (d) {
        var c = el("span", "chip-insignia");
        c.appendChild(el("b", null, d.letra));
        c.appendChild(document.createTextNode(" " + d.nombre));
        fila.appendChild(c);
      });
      bloque.appendChild(fila);
      doc.appendChild(bloque);
      var btn = el("button", "btn continuar", "Terminar");
      btn.type = "button";
      btn.addEventListener("click", function () { EM.ui._paso = null; resolve(); });
      doc.appendChild(btn);
      EM.ui._paso = function () { EM.ui._paso = null; resolve(); };
      EM.ui.pantallaCompleta(doc);
    });
  }

  function galeria() {
    EM.juego.fase = "galeria";
    var vista = document.getElementById("vista");
    vista.textContent = "";
    var pantalla = el("div", "titulo-pantalla galeria-pantalla");
    var doc = el("article", "galeria");
    doc.appendChild(el("p", "kicker", "Expediente del estudio"));
    doc.appendChild(el("h2", null, "Galería"));
    var vistos = EM.estado.leerFinales();
    doc.appendChild(el("h3", null, "Finales · " + vistos.length + "/5"));
    var fin = el("div", "gal-finales");
    EM.FINALES.forEach(function (f) {
      var ok = vistos.indexOf(f.id) >= 0;
      var c = el("div", "gal-final" + (ok ? " ok" : ""));
      c.appendChild(el("strong", null, ok ? f.nombre : "???"));
      c.appendChild(el("span", null, ok ? (f.min ? f.min + "+ puntos" : "Menos de 40") : "Aún no lo ves"));
      fin.appendChild(c);
    });
    doc.appendChild(fin);
    var p = progreso();
    var nCul = EM.SOSPECHOSOS.filter(function (id) { return p.culpables[id]; }).length;
    doc.appendChild(el("h3", null, "Culpables descubiertos · " + nCul + "/5"));
    var cul = el("div", "gal-culpables");
    EM.SOSPECHOSOS.forEach(function (id) {
      var ok = !!p.culpables[id];
      var c = el("div", "gal-culpable" + (ok ? " ok" : ""));
      var foto = el("div", "gal-foto");
      foto.appendChild(EM.escenas.obtenerRetrato(id, ok ? "culpable" : "neutral"));
      c.appendChild(foto);
      c.appendChild(el("span", null, ok ? EM.PERSONAJES[id].nombre : "???"));
      cul.appendChild(c);
    });
    doc.appendChild(cul);
    var nIns = INSIGNIAS.filter(function (d) { return p.insignias[d.id]; }).length;
    doc.appendChild(el("h3", null, "Insignias · " + nIns + "/" + INSIGNIAS.length));
    var ins = el("div", "gal-insignias");
    INSIGNIAS.forEach(function (d) {
      var ok = !!p.insignias[d.id];
      var c = el("div", "gal-insignia" + (ok ? " ok" : ""));
      c.appendChild(el("span", "ins-ico", ok ? d.letra : "?"));
      var t = el("div", "ins-txt");
      t.appendChild(el("strong", null, ok ? d.nombre : "Insignia secreta"));
      t.appendChild(el("small", null, ok ? d.desc : "Sigue jugando para descubrirla."));
      c.appendChild(t);
      ins.appendChild(c);
    });
    doc.appendChild(ins);
    var volver = el("button", "btn continuar", "Volver");
    volver.type = "button";
    volver.addEventListener("click", function () { EM.ui.mostrarTitulo(); });
    doc.appendChild(volver);
    pantalla.appendChild(doc);
    vista.appendChild(pantalla);
    volver.focus();
  }

  function abrirDiccionario() {
    var estado = EM.juego.estado;
    var capa = document.getElementById("capa-diccionario");
    if (!capa || !estado) return;
    capa.hidden = false;
    capa.textContent = "";
    var caja = el("div", "diccionario");
    var cab = el("div", "corcho-cabeza");
    cab.appendChild(el("h2", null, "Diccionario de administración"));
    var cerrar = el("button", "btn", "Cerrar");
    cerrar.type = "button";
    cerrar.addEventListener("click", cerrarDiccionario);
    cab.appendChild(cerrar);
    caja.appendChild(cab);
    var jugados = 0;
    var rejilla = el("div", "dic-rejilla");
    EM.CONCEPTOS.forEach(function (c) {
      var hito = null;
      estado.historial.forEach(function (x) { if (x.cuentaConcepto && x.concepto === c.id) hito = x; });
      var t = el("section", "dic-ficha" + (hito ? "" : " bloqueada"));
      if (hito) {
        jugados += 1;
        t.appendChild(el("h3", null, c.nombre));
        t.appendChild(el("p", "dic-def", c.definicion));
        t.appendChild(el("p", "dic-ej", "En tu partida: " + hito.eleccion));
        t.appendChild(el("p", "dic-consejo", "Consejo: " + c.consejo));
      } else {
        t.appendChild(el("h3", null, "???"));
        t.appendChild(el("p", "dic-def", "Se desbloquea cuando llegues a esta decisión."));
      }
      rejilla.appendChild(t);
    });
    caja.appendChild(el("p", "dic-cuenta", jugados + " de 10 conceptos desbloqueados"));
    caja.appendChild(rejilla);
    capa.appendChild(caja);
    cerrar.focus();
  }

  function cerrarDiccionario() {
    var capa = document.getElementById("capa-diccionario");
    if (capa) capa.hidden = true;
  }

  function decorarTitulo(fila) {
    var g = leerGuardado();
    if (g) {
      var seguir = el("button", "btn", "Continuar · Ronda " + g.ronda);
      seguir.type = "button";
      seguir.addEventListener("click", function () {
        EM.audio.habilitar();
        EM.juego.continuar();
      });
      fila.insertBefore(seguir, fila.firstChild);
    }
    var gal = el("button", "btn ghost", "Galería");
    gal.type = "button";
    gal.addEventListener("click", function () { EM.audio.habilitar(); galeria(); });
    fila.insertBefore(gal, fila.firstChild);
  }

  var introHecha = false;

  function intro(alMostrar) {
    return new Promise(function (resolve) {
      var raiz = el("div", "intro");
      raiz.id = "intro";
      var conos = el("div", "intro-conos");
      for (var i = 1; i <= 5; i++) conos.appendChild(el("div", "cono c" + i));
      raiz.appendChild(conos);
      raiz.appendChild(el("div", "intro-charco"));
      var polvo = el("div", "intro-polvo");
      for (var d = 0; d < 34; d++) {
        var mota = el("i", "mota");
        mota.style.left = (Math.random() * 100).toFixed(1) + "%";
        mota.style.top = (Math.random() * 100).toFixed(1) + "%";
        var tam = (1.5 + Math.random() * 2.5).toFixed(1);
        mota.style.width = mota.style.height = tam + "px";
        mota.style.animationDuration = (6 + Math.random() * 7).toFixed(1) + "s";
        mota.style.animationDelay = "-" + (Math.random() * 8).toFixed(1) + "s";
        polvo.appendChild(mota);
      }
      raiz.appendChild(polvo);
      var logo = el("div", "intro-logo");
      var imgLogo = document.createElement("img");
      imgLogo.src = "assets/img/wates.png";
      imgLogo.alt = "Wates";
      imgLogo.draggable = false;
      logo.appendChild(imgLogo);
      logo.appendChild(el("span", "il-studio", "Studio"));
      logo.appendChild(el("span", "il-presenta", "presenta"));
      raiz.appendChild(logo);
      var claq = el("div", "intro-claqueta");
      claq.appendChild(el("span", "ic-brazo"));
      var piz = el("div", "ic-pizarra");
      piz.appendChild(el("span", null, "PROD · ESTUDIO MAESTRO"));
      piz.appendChild(el("span", null, "ESC 01 · TOMA 01"));
      claq.appendChild(piz);
      raiz.appendChild(claq);
      raiz.appendChild(el("div", "intro-flash"));
      var h = el("h1", "intro-titulo");
      "ESTUDIO MAESTRO".split("").forEach(function (ch, k) {
        var s = el("span", null, ch === " " ? " " : ch);
        s.style.animationDelay = (6.75 + k * 0.07) + "s";
        h.appendChild(s);
      });
      raiz.appendChild(h);
      raiz.appendChild(el("p", "intro-sub", "Sabotaje en producción"));
      var saltar = el("button", "intro-saltar", "Saltar ›");
      saltar.type = "button";
      saltar.hidden = true;
      raiz.appendChild(saltar);
      var encender = el("button", "intro-encender", "Encender las luces");
      encender.type = "button";
      raiz.appendChild(encender);
      document.body.appendChild(raiz);
      encender.focus();

      var tiempos = [];
      var terminado = false;
      var mostrado = false;
      function mostrarTitulo() {
        if (mostrado) return;
        mostrado = true;
        if (alMostrar) alMostrar();
      }
      function terminar() {
        if (terminado) return;
        terminado = true;
        tiempos.forEach(clearTimeout);
        mostrarTitulo();
        raiz.classList.add("sale");
        document.removeEventListener("keydown", teclas);
        setTimeout(function () { raiz.remove(); introHecha = true; resolve(); }, 700);
      }
      function teclas(e) {
        if (!raiz.classList.contains("corriendo")) return;
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); terminar(); }
      }
      function en(ms, fn) { tiempos.push(setTimeout(fn, ms)); }

      encender.addEventListener("click", function () {
        EM.audio.habilitar();
        encender.hidden = true;
        saltar.hidden = false;
        raiz.classList.add("corriendo");
        [100, 600, 1100, 1600].forEach(function (t) { en(t, function () { EM.audio.reflector(false); }); });
        en(2200, function () { EM.audio.reflector(true); });
        en(6560, function () { EM.audio.claqueta(); });
        en(7200, function () { if (EM.audio.sting) EM.audio.sting(); });
        en(9900, mostrarTitulo);
        en(10200, terminar);
        document.addEventListener("keydown", teclas);
      });
      saltar.addEventListener("click", terminar);
    });
  }

  function iniciarExtras() {
    var btn = document.getElementById("btn-diccionario");
    if (btn) btn.addEventListener("click", abrirDiccionario);
    var capa = document.getElementById("capa-diccionario");
    if (capa) {
      capa.addEventListener("click", function (e) { if (e.target === capa) cerrarDiccionario(); });
    }
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarDiccionario(); });
  }

  EM.extras = {
    INSIGNIAS: INSIGNIAS,
    otorgar: otorgar,
    trasDecision: trasDecision,
    trasAcusar: trasAcusar,
    alFinalizar: alFinalizar,
    radar: radar,
    epilogo: epilogo,
    galeria: galeria,
    decorarTitulo: decorarTitulo,
    guardarPartida: guardarPartida,
    restaurar: restaurar,
    hayGuardado: function () { return !!leerGuardado(); },
    intro: intro,
    introHecha: function () { return introHecha; },
    iniciar: iniciarExtras
  };
})(typeof window !== "undefined" ? window : globalThis);
