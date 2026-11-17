(function (global) {
  var EM = global.EM = global.EM || {};

  var juego = {
    token: 0,
    fase: "titulo",
    estado: null,
    forzado: null
  };

  function vivo(token) {
    return token === juego.token;
  }

  function sincronizar(estado) {
    EM.ui.actualizarHud(estado);
    if (EM.audio.estado.iniciado) EM.audio.setTension(EM.estado.calcularTension(estado));
  }

  function anunciar(pista) {
    if (pista) {
      if (EM.juego.estado) EM.juego.estado.pistaNueva = true;
      EM.ui.avisoPista(pista);
      EM.audio.susurro();
    }
  }

  function esperarPaso() {
    return new Promise(function (resolve) {
      EM.ui._paso = function () {
        EM.ui._paso = null;
        resolve();
      };
    });
  }

  async function crisis(estado, token) {
    var tipo;
    var guard = 0;
    while ((tipo = EM.estado.crisisPendiente(estado)) && guard < 4) {
      guard += 1;
      if (!vivo(token)) return;
      var ficha = EM.CRISIS[tipo];
      await EM.narradora.decir(EM.estado.tomarReaccion(estado, "shock"));
      if (!vivo(token)) return;
      EM.ui.encabezadoDecision({
        tipo: "crisis",
        concepto: ficha.concepto,
        titulo: ficha.titulo,
        contexto: ficha.texto
      });
      var id = await EM.ui.elegir(ficha.opciones);
      if (!vivo(token)) return;
      var op = ficha.opciones[0];
      ficha.opciones.forEach(function (o) { if (o.id === id) op = o; });
      var antes = {
        presupuesto: estado.presupuesto,
        moral: estado.moral,
        tiempo: estado.tiempo,
        calidad: estado.calidad
      };
      EM.estado.aplicarCrisis(estado, tipo, op);
      sincronizar(estado);
      var linea = EM.ui.pintarRetro({
        calidad: "regular",
        concepto: EM.conceptoPorId(ficha.concepto),
        porque: "Esto fue una crisis, no la decisión principal del concepto. El proyecto sigue y el costo ya quedó en los medidores.",
        diffs: {
          presupuesto: estado.presupuesto - antes.presupuesto,
          moral: estado.moral - antes.moral,
          tiempo: estado.tiempo - antes.tiempo,
          calidad: estado.calidad - antes.calidad
        }
      });
      await EM.narradora.decirEn(EM.estado.tomarReaccion(estado, "mal"), linea);
    }
  }

  function reaccionDe(estado, resultado, antes) {
    if (resultado.voz) return resultado.voz;
    var umbral = { moral: 30, calidad: 30, presupuesto: 100000, tiempo: 20 };
    var cruzo = Object.keys(umbral).some(function (k) {
      if (antes[k] >= umbral[k] && estado[k] < umbral[k] && !estado.alertasDadas[k]) {
        estado.alertasDadas[k] = true;
        return true;
      }
      return false;
    });
    var grupo;
    var golpe = (antes.moral - estado.moral >= 15) || (antes.calidad - estado.calidad >= 15) ||
      (antes.presupuesto - estado.presupuesto >= 80000) || (antes.tiempo - estado.tiempo >= 6);
    var racha = resultado.calidad === estado.ultimaCalidad ? estado.rachaCalidad + 1 : 1;
    if (cruzo) grupo = "alerta";
    else if (golpe) grupo = "golpe";
    else if (estado.pistaNueva && (estado.reaccionesPista || 0) < 2) { grupo = "pista"; estado.reaccionesPista = (estado.reaccionesPista || 0) + 1; }
    else if (racha >= 2 && resultado.calidad === "bien") grupo = "rachaBien";
    else if (racha >= 2 && resultado.calidad === "mal") grupo = "rachaMal";
    else grupo = resultado.calidad === "bien" ? "bien" : resultado.calidad === "mal" ? "mal" : "regular";
    estado.ultimaCalidad = resultado.calidad;
    estado.rachaCalidad = racha;
    estado.pistaNueva = false;
    var codigo = EM.estado.tomarReaccion(estado, grupo);
    if (codigo === estado.ultimoCodigo) {
      codigo = EM.estado.tomarReaccion(estado, resultado.calidad === "bien" ? "bien" : resultado.calidad === "mal" ? "mal" : "regular");
    }
    estado.ultimoCodigo = codigo;
    return codigo;
  }

  async function jugarDecision(estado, id, token) {
    var d = EM.decisionPorId(id);
    estado.ocultarRoles = d.tipo === "organigrama";
    if (estado.ocultarRoles) estado.ordenAsientos = EM.util.barajar(EM.SOSPECHOSOS.slice(), Math.random);
    EM.ui.ponerEscena(estado);
    EM.ui.encabezadoDecision(d);
    var accion = null;
    var espera = null;
    if (d.tipo !== "reloj") {
      espera = setTimeout(function () {
        if (vivo(token) && !accion) EM.narradora.flash(EM.estado.tomarReaccion(estado, "prisa"));
      }, 12000);
    }
    if (d.tipo === "opciones") accion = { opcion: await EM.ui.elegir(d.opciones) };
    else if (d.tipo === "organigrama") accion = await EM.minijuegos.organigrama();
    else if (d.tipo === "presupuesto") accion = await EM.minijuegos.presupuesto();
    else if (d.tipo === "reloj") {
      var crisisReloj = d.crisis[Math.floor(Math.random() * d.crisis.length)];
      accion = await EM.minijuegos.reloj(crisisReloj);
      accion.crisis = crisisReloj.id;
    } else if (d.tipo === "dependencias") accion = await EM.minijuegos.dependencias();
    else if (d.tipo === "kpis") accion = await EM.minijuegos.kpis();
    else if (d.tipo === "gantt") {
      EM.minijuegos.dibujarGantt(EM.ui.panel());
      accion = { opcion: await EM.ui.elegir(d.opciones) };
    }
    clearTimeout(espera);
    if (!vivo(token)) return;
    var resultado = EM.reglas.resolver(d.id, accion);
    var antesRes = Object.assign({}, estado.resentimiento);
    var antesVal = { moral: estado.moral, calidad: estado.calidad, presupuesto: estado.presupuesto, tiempo: estado.tiempo };
    var diffs = EM.estado.aplicarResultado(estado, d, resultado);
    if (d.id === "D1" && resultado.calidad === "bien") anunciar(EM.estado.otorgarPista(estado, "a-objetivos"));
    if (d.id === "D6" && resultado.calidad === "bien") anunciar(EM.estado.otorgarPista(estado, "a-minuta"));
    if (resultado.calidad === "bien") EM.audio.acierto();
    if (resultado.calidad === "mal") EM.audio.error();
    sincronizar(estado);
    var linea = EM.ui.pintarRetro({
      calidad: resultado.calidad,
      concepto: EM.conceptoPorId(d.concepto),
      porque: resultado.porque,
      diffs: diffs
    });
    EM.extras.trasDecision(estado, d, accion, resultado, antesRes);
    var voz = reaccionDe(estado, resultado, antesVal);
    if (voz) await EM.narradora.decirEn(voz, linea);
    else await esperarPaso();
  }

  async function jugarEvento(estado, ev, token) {
    await EM.narradora.decir(ev.voz);
    estado.ultimoCodigo = ev.voz;
    if (!vivo(token)) return;
    if (ev.efectoBase) {
      EM.estado.aplicarEfectos(estado, ev.efectoBase);
      sincronizar(estado);
    }
    EM.ui.encabezadoDecision({
      tipo: "evento",
      concepto: ev.concepto,
      titulo: ev.titulo,
      contexto: ev.contexto
    });
    var id = await EM.ui.elegir(ev.opciones);
    if (!vivo(token)) return;
    var resultado = EM.reglas.resolverEvento(ev.id, { opcion: id });
    var antesResEv = Object.assign({}, estado.resentimiento);
    var diffs = EM.estado.aplicarResultado(estado, ev, resultado);
    EM.extras.trasDecision(estado, ev, { opcion: id }, resultado, antesResEv);
    if (resultado.efectos && resultado.efectos.pista) {
      if (estado.saboteador) anunciar(EM.estado.pistaReal(estado, 3));
      else anunciar(EM.estado.otorgarPista(estado, "a-pasillo"));
    }
    if (resultado.calidad === "mal") EM.audio.error();
    if (resultado.calidad === "bien") EM.audio.acierto();
    sincronizar(estado);
    var concepto = EM.conceptoPorId(ev.concepto);
    var linea = EM.ui.pintarRetro({
      calidad: resultado.calidad,
      concepto: concepto,
      porque: resultado.porque,
      diffs: diffs
    });
    await esperarPaso();
    if (linea) linea.textContent = "";
  }

  async function jugarRonda(estado, n, token) {
    var ronda = EM.RONDAS[n - 1];
    EM.extras.guardarPartida(estado, n);
    EM.estado.abrirRonda(estado, n);
    sincronizar(estado);
    await EM.ui.corte();
    if (!vivo(token)) return;
    EM.ui.asegurarPantalla();
    EM.ui.ponerEscena(estado);
    await EM.narradora.decir(ronda.voz);
    if (!vivo(token)) return;
    var ev = EM.eventoPorId(estado.eventos[n - 1]);
    for (var i = 0; i < ronda.decisiones.length; i++) {
      if (!vivo(token)) return;
      await jugarDecision(estado, ronda.decisiones[i], token);
      await crisis(estado, token);
      if (i === 0 && ev) {
        await jugarEvento(estado, ev, token);
        await crisis(estado, token);
      }
    }
    if (!vivo(token)) return;
    if (n === 1) anunciar(EM.estado.otorgarPista(estado, "a-servidor"));
    if (n === 3) {
      EM.estado.fijarFalso(estado);
      EM.estado.otorgarFalsas(estado);
      await EM.ui.teoria(estado);
      if (!vivo(token)) return;
    }
    if (n === 4) {
      EM.estado.fijarSaboteador(estado);
      EM.estado.aplicarSabotaje(estado);
      anunciar(EM.estado.pistaReal(estado, 0));
      if ((estado.puntajeConcepto.control || 0) >= 8) anunciar(EM.estado.pistaReal(estado, 1));
      if ((estado.puntajeConcepto.comunicacion || 0) >= 8) anunciar(EM.estado.pistaReal(estado, 2));
      if ((estado.puntajeConcepto.organizacion || 0) >= 8) anunciar(EM.estado.pistaReal(estado, 3));
      sincronizar(estado);
      estado.habla = null;
      EM.ui.ponerEscena(estado);
      EM.audio.sting();
      EM.ui.temblor();
      await EM.narradora.decir(EM.estado.tomarReaccion(estado, "shock"));
      if (!vivo(token)) return;
      var s = EM.SABOTAJES[estado.saboteador];
      await EM.ui.sabotajeCartel(s);
      if (!vivo(token)) return;
      EM.ui.asegurarPantalla();
      EM.ui.ponerEscena(estado);
      await EM.narradora.decir("I25", { boton: "Continuar" });
      if (!vivo(token)) return;
      await EM.narradora.decir("I26", { boton: "Continuar" });
      if (!vivo(token)) return;
      await EM.ui.salidaCartel(estado);
      if (!vivo(token)) return;
      estado.habla = null;
      await crisis(estado, token);
      return;
    }
    if (n >= 2) {
      await EM.narradora.decir(EM.estado.tomarReaccion(estado, "sospecha"));
      if (!vivo(token)) return;
    }
    await EM.narradora.decir(ronda.cliff, { boton: "Siguiente ronda" });
  }

  async function intro(estado, token) {
    EM.ui.hudVisible(true);
    sincronizar(estado);
    for (var i = 0; i < EM.INTRO.length; i++) {
      if (!vivo(token)) return;
      await EM.ui.cartel(EM.INTRO[i], estado);
    }
    if (!vivo(token)) return;
    EM.ui.asegurarPantalla();
    EM.escenas.dibujar(document.getElementById("escenario"), estado, "juntas");
    await EM.narradora.decir("I01");
    if (!vivo(token)) return;
    await EM.narradora.decir("I02");
    if (!vivo(token)) return;
    await EM.narradora.decir("I03");
  }

  function drenarCrisis(estado) {
    var guard = 0;
    var tipo;
    while ((tipo = EM.estado.crisisPendiente(estado)) && guard < 4) {
      EM.estado.aplicarCrisis(estado, tipo, EM.CRISIS[tipo].opciones[0]);
      guard += 1;
    }
  }

  function prepararSalto(ronda) {
    var estado = EM.estado.crear(Math.random);
    estado.salto = true;
    estado.saboteadorForzado = juego.forzado;
    var estilo = juego.forzado ? { modo: "culpar", quien: juego.forzado } : { modo: "mayoria-bien" };
    EM.estado.prepararEventos(estado, Math.random);
    var indice = 0;
    var hasta = Math.min(4, ronda - 1);
    for (var r = 1; r <= hasta; r++) {
      EM.estado.abrirRonda(estado, r);
      var decs = EM.RONDAS[r - 1].decisiones;
      var ev = EM.eventoPorId(estado.eventos[r - 1]);
      for (var i = 0; i < decs.length; i++) {
        var d = EM.decisionPorId(decs[i]);
        var accion = EM.estado.accionParaEstilo(d, estilo, Math.random, indice);
        indice += 1;
        EM.estado.aplicarResultado(estado, d, EM.reglas.resolver(d.id, accion));
        drenarCrisis(estado);
        if (i === 0 && ev) {
          if (ev.efectoBase) EM.estado.aplicarEfectos(estado, ev.efectoBase);
          var resE = EM.reglas.resolverEvento(ev.id, EM.estado.accionEvento(ev, estilo, Math.random));
          EM.estado.aplicarResultado(estado, ev, resE);
          drenarCrisis(estado);
        }
      }
      if (r === 1) EM.estado.otorgarPista(estado, "a-servidor");
      if (r === 3) {
        EM.estado.fijarFalso(estado);
        EM.estado.otorgarFalsas(estado);
      }
      if (r === 4) {
        EM.estado.fijarSaboteador(estado);
        EM.estado.aplicarSabotaje(estado);
        EM.estado.pistaReal(estado, 0);
        if ((estado.puntajeConcepto.control || 0) >= 8) EM.estado.pistaReal(estado, 1);
        if ((estado.puntajeConcepto.comunicacion || 0) >= 8) EM.estado.pistaReal(estado, 2);
        if ((estado.puntajeConcepto.organizacion || 0) >= 8) EM.estado.pistaReal(estado, 3);
      }
    }
    estado.historial.forEach(function (h) {
      if (h.id === "D1" && h.calidad === "bien") EM.estado.otorgarPista(estado, "a-objetivos");
      if (h.id === "D6" && h.calidad === "bien") EM.estado.otorgarPista(estado, "a-minuta");
    });
    estado.ronda = ronda;
    return estado;
  }

  async function partida(estado, token) {
    juego.estado = estado;
    juego.fase = "partida";
    EM.ui.hudVisible(true);
    sincronizar(estado);
    if (!estado.salto) await intro(estado, token);
    if (!vivo(token)) return;
    var desde = estado.salto ? estado.ronda : 1;
    if (desde < 5) {
      for (var r = desde; r <= 4; r++) {
        if (!vivo(token)) return;
        await jugarRonda(estado, r, token);
      }
    }
    if (!vivo(token)) return;
    await EM.final.correr(estado, token);
  }

  function empezar() {
    juego.token += 1;
    var estado = EM.estado.crear(Math.random);
    estado.saboteadorForzado = juego.forzado;
    EM.estado.prepararEventos(estado, Math.random);
    partida(estado, juego.token);
  }

  function continuar() {
    juego.token += 1;
    var estado = EM.extras.restaurar();
    if (!estado) return;
    partida(estado, juego.token);
  }

  function saltar(ronda) {
    juego.token += 1;
    document.getElementById("capa-demo").hidden = true;
    partida(prepararSalto(ronda), juego.token);
  }

  function arrancar() {
    var params = new URLSearchParams(global.location.search);
    if (params.get("autoprueba") === "1") {
      var reporte = EM.autoprueba.correr();
      var pre = document.createElement("pre");
      pre.className = "autoprueba";
      var lineas = [];
      lineas.push(reporte.ok ? "AUTOPRUEBA APROBADA" : "AUTOPRUEBA REPROBADA");
      lineas.push("Partidas: " + reporte.partidas);
      lineas.push("Errores: " + reporte.errores.length);
      if (reporte.errores.length) lineas.push(reporte.errores.join("\n"));
      lineas.push("Voces faltantes: " + (reporte.vocesFaltantes.length ? reporte.vocesFaltantes.join(", ") : "ninguna"));
      lineas.push("Saboteadores: " + EM.SOSPECHOSOS.map(function (id) { return id + " " + reporte.saboteadores[id]; }).join(" · "));
      lineas.push("Finales: " + EM.FINALES.map(function (f) { return f.id + " " + reporte.finales[f.id]; }).join(" · "));
      pre.textContent = lineas.join("\n");
      document.body.appendChild(pre);
      return;
    }
    EM.ui.iniciar();
    var sinIntro = params.get("sinintro") === "1" || params.get("demo") === "1" ||
      (global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (sinIntro) {
      EM.ui.mostrarTitulo();
      if (params.get("demo") === "1") EM.ui.abrirDemo();
    } else {
      EM.extras.intro(function () { EM.ui.mostrarTitulo(); });
    }
  }

  juego.empezar = empezar;
  juego.saltar = saltar;
  juego.continuar = continuar;
  juego.sincronizar = sincronizar;
  juego.jugarEvento = jugarEvento;
  EM.juego = juego;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})(typeof window !== "undefined" ? window : globalThis);
