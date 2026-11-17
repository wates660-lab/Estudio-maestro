(function (global) {
  var EM = global.EM = global.EM || {};

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var ESTILOS = [
    { modo: "todo-bien" },
    { modo: "mayoria-bien" },
    { modo: "regular" },
    { modo: "mal-gerente" },
    { modo: "todo-mal" },
    { modo: "culpar", quien: "maria" },
    { modo: "culpar", quien: "luis" },
    { modo: "culpar", quien: "rey" },
    { modo: "culpar", quien: "monica" },
    { modo: "culpar", quien: "theo" },
    { modo: "azar" }
  ];

  function resolverCrisis(estado) {
    var guard = 0;
    var tipo;
    while ((tipo = EM.estado.crisisPendiente(estado)) && guard < 6) {
      EM.estado.aplicarCrisis(estado, tipo, EM.CRISIS[tipo].opciones[0]);
      guard += 1;
    }
  }

  function simular(semilla) {
    var rng = mulberry32(semilla);
    var estilo = ESTILOS[Math.floor(rng() * ESTILOS.length)];
    var estado = EM.estado.crear(rng);
    EM.estado.prepararEventos(estado, rng);
    var indice = 0;
    for (var r = 1; r <= 4; r++) {
      EM.estado.abrirRonda(estado, r);
      var decs = EM.RONDAS[r - 1].decisiones;
      var ev = EM.eventoPorId(estado.eventos[r - 1]);
      for (var i = 0; i < decs.length; i++) {
        var d = EM.decisionPorId(decs[i]);
        var accion = EM.estado.accionParaEstilo(d, estilo, rng, indice);
        var resultado = EM.reglas.resolver(d.id, accion);
        EM.estado.aplicarResultado(estado, d, resultado);
        indice += 1;
        resolverCrisis(estado);
        if (i === 0) {
          if (ev.efectoBase) EM.estado.aplicarEfectos(estado, ev.efectoBase);
          var accE = EM.estado.accionEvento(ev, estilo, rng);
          var resE = EM.reglas.resolverEvento(ev.id, accE);
          EM.estado.aplicarResultado(estado, ev, resE);
          resolverCrisis(estado);
        }
      }
      if (r === 3) EM.estado.fijarFalso(estado);
      if (r === 4) {
        EM.estado.fijarSaboteador(estado);
        EM.estado.aplicarSabotaje(estado);
        resolverCrisis(estado);
      }
    }
    if (!estado.saboteador) throw new Error("Partida sin saboteador");
    if (!estado.falsoCulpable) throw new Error("Partida sin falso culpable");
    if (estado.falsoCulpable === estado.saboteador) throw new Error("El falso culpable coincide con el saboteador");
    EM.CONCEPTOS.forEach(function (c) {
      var p = estado.puntajeConcepto[c.id];
      if (typeof p !== "number" || p < 0 || p > 10) throw new Error("Puntaje inválido en " + c.id);
    });
    var acierta = rng() < 0.45;
    var total = EM.estado.puntajeTotal(estado, acierta);
    var finalInfo = EM.estado.clasificarFinal(total);
    return { saboteador: estado.saboteador, finalId: finalInfo.id, total: total, estilo: estilo.modo };
  }

  function vocesFaltantes() {
    var faltan = [];
    var i;
    for (i = 1; i <= 44; i++) {
      var ci = "I" + (i < 10 ? "0" : "") + i;
      if (!EM.GUION[ci] || typeof EM.GUION[ci].texto !== "string") faltan.push(ci);
    }
    for (i = 1; i <= 33; i++) {
      var cr = "R" + (i < 10 ? "0" : "") + i;
      if (!EM.GUION[cr] || typeof EM.GUION[cr].texto !== "string") faltan.push(cr);
    }
    return faltan;
  }

  function correr() {
    var errores = [];
    var sab = {};
    var fins = {};
    EM.SOSPECHOSOS.forEach(function (id) { sab[id] = 0; });
    EM.FINALES.forEach(function (f) { fins[f.id] = 0; });
    var n = 1000;
    for (var i = 0; i < n; i++) {
      try {
        var r = simular(i + 1);
        sab[r.saboteador] += 1;
        fins[r.finalId] += 1;
      } catch (e) {
        errores.push("Partida " + (i + 1) + ": " + (e && e.message ? e.message : e));
        if (errores.length > 8) break;
      }
    }
    var faltanVoces = vocesFaltantes();
    var sabFaltan = EM.SOSPECHOSOS.filter(function (id) { return !sab[id]; });
    var finFaltan = EM.FINALES.map(function (f) { return f.id; }).filter(function (id) { return !fins[id]; });
    var ok = errores.length === 0 && faltanVoces.length === 0 && sabFaltan.length === 0 && finFaltan.length === 0;
    var reporte = {
      ok: ok,
      partidas: n,
      errores: errores,
      vocesFaltantes: faltanVoces,
      saboteadores: sab,
      finales: fins,
      saboteadoresFaltantes: sabFaltan,
      finalesFaltantes: finFaltan
    };
    var lineas = [];
    lineas.push(ok ? "AUTOPRUEBA APROBADA" : "AUTOPRUEBA REPROBADA");
    lineas.push("Partidas: " + n);
    lineas.push("Errores: " + errores.length);
    if (errores.length) lineas.push(errores.join("\n"));
    lineas.push("Voces faltantes: " + (faltanVoces.length ? faltanVoces.join(", ") : "ninguna"));
    lineas.push("Saboteadores: " + EM.SOSPECHOSOS.map(function (id) { return id + " " + sab[id]; }).join(" · "));
    lineas.push("Finales: " + EM.FINALES.map(function (f) { return f.id + " " + fins[f.id]; }).join(" · "));
    if (sabFaltan.length) lineas.push("Sin alcanzar saboteador: " + sabFaltan.join(", "));
    if (finFaltan.length) lineas.push("Sin alcanzar final: " + finFaltan.join(", "));
    var texto = lineas.join("\n");
    if (global.console && console.log) console.log(texto);
    return reporte;
  }

  EM.autoprueba = { correr: correr, simular: simular };
})(typeof window !== "undefined" ? window : globalThis);
