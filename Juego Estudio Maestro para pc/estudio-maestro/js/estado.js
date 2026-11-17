(function (global) {
  var EM = global.EM = global.EM || {};

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function clonarEfectos(ef) {
    var o = {};
    if (!ef) return o;
    ["presupuesto", "moral", "tiempo", "calidad"].forEach(function (k) {
      if (typeof ef[k] === "number") o[k] = ef[k];
    });
    if (ef.resentimiento) o.resentimiento = Object.assign({}, ef.resentimiento);
    if (ef.ausente) o.ausente = { id: ef.ausente.id, modo: ef.ausente.modo };
    if (ef.sinColchon) o.sinColchon = true;
    if (ef.pista) o.pista = ef.pista;
    return o;
  }

  function barajar(lista, rng) {
    var arr = lista.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function decisionPorId(id) {
    for (var i = 0; i < EM.DECISIONES.length; i++) {
      if (EM.DECISIONES[i].id === id) return EM.DECISIONES[i];
    }
    return null;
  }

  function eventoPorId(id) {
    for (var i = 0; i < EM.EVENTOS.length; i++) {
      if (EM.EVENTOS[i].id === id) return EM.EVENTOS[i];
    }
    return null;
  }

  function conceptoPorId(id) {
    for (var i = 0; i < EM.CONCEPTOS.length; i++) {
      if (EM.CONCEPTOS[i].id === id) return EM.CONCEPTOS[i];
    }
    return null;
  }

  function pistaPorId(id) {
    for (var i = 0; i < EM.CATALOGO_PISTAS.length; i++) {
      if (EM.CATALOGO_PISTAS[i].id === id) return EM.CATALOGO_PISTAS[i];
    }
    return null;
  }

  function puntajesVacios() {
    var o = {};
    EM.CONCEPTOS.forEach(function (c) { o[c.id] = null; });
    return o;
  }

  function resentimientoVacio() {
    var o = {};
    EM.SOSPECHOSOS.forEach(function (id) { o[id] = 0; });
    return o;
  }

  function crear(rng) {
    return {
      presupuesto: 500000,
      moral: 70,
      tiempo: 60,
      calidad: 60,
      resentimiento: resentimientoVacio(),
      puntajeConcepto: puntajesVacios(),
      ronda: 0,
      historial: [],
      pistas: [],
      hilos: [],
      ausentes: {},
      sinColchon: false,
      sabotajeOcurrido: false,
      saboteador: null,
      falsoCulpable: null,
      saboteadorForzado: null,
      eventos: [],
      crisisRonda: {},
      ultimaReaccion: {},
      alertasDadas: {},
      ultimaCalidad: null,
      rachaCalidad: 0,
      pistaNueva: false,
      evidRonda: 0,
      acusacion: null,
      acierto: false,
      puntajeFinal: null,
      finalId: null,
      azar: rng || Math.random
    };
  }

  function fotoMetros(estado) {
    return {
      presupuesto: estado.presupuesto,
      moral: estado.moral,
      tiempo: estado.tiempo,
      calidad: estado.calidad
    };
  }

  function aplicarEfectos(estado, ef) {
    var antes = fotoMetros(estado);
    ef = ef || {};
    if (typeof ef.presupuesto === "number") estado.presupuesto += ef.presupuesto;
    if (typeof ef.moral === "number") estado.moral = clamp(estado.moral + ef.moral, 0, 100);
    if (typeof ef.tiempo === "number") estado.tiempo = clamp(estado.tiempo + ef.tiempo, 0, 99);
    if (typeof ef.calidad === "number") estado.calidad = clamp(estado.calidad + ef.calidad, 0, 100);
    if (ef.resentimiento) {
      EM.SOSPECHOSOS.forEach(function (id) {
        if (typeof ef.resentimiento[id] === "number") {
          estado.resentimiento[id] = clamp(estado.resentimiento[id] + ef.resentimiento[id], 0, 100);
        }
      });
    }
    if (ef.sinColchon) estado.sinColchon = true;
    if (ef.ausente && ef.ausente.id) estado.ausentes[ef.ausente.id] = ef.ausente.modo || "ronda";
    return {
      presupuesto: estado.presupuesto - antes.presupuesto,
      moral: estado.moral - antes.moral,
      tiempo: estado.tiempo - antes.tiempo,
      calidad: estado.calidad - antes.calidad
    };
  }

  function aplicarResultado(estado, ficha, resultado) {
    var efectos = clonarEfectos(resultado.efectos);
    var diffs = aplicarEfectos(estado, efectos);
    if (ficha.cuentaConcepto && typeof resultado.puntaje === "number") {
      estado.puntajeConcepto[ficha.concepto] = clamp(resultado.puntaje, 0, 10);
    }
    estado.historial.push({
      id: ficha.id,
      tipo: ficha.tipo || "decision",
      concepto: ficha.concepto,
      cuentaConcepto: !!ficha.cuentaConcepto,
      calidad: resultado.calidad,
      puntaje: resultado.puntaje,
      eleccion: resultado.eleccion,
      porque: resultado.porque,
      voz: resultado.voz || null,
      deltaResentimiento: Object.assign({}, efectos.resentimiento || {}),
      ronda: estado.ronda
    });
    return diffs;
  }

  function crisisPendiente(estado) {
    if (estado.presupuesto <= 0 && !estado.crisisRonda.presupuesto) return "presupuesto";
    if (estado.moral <= 0 && !estado.crisisRonda.moral) return "moral";
    if (estado.tiempo <= 0 && !estado.crisisRonda.tiempo) return "tiempo";
    if (estado.calidad <= 0 && !estado.crisisRonda.calidad) return "calidad";
    return null;
  }

  function aplicarCrisis(estado, tipo, opcion) {
    aplicarEfectos(estado, clonarEfectos(opcion.efectos));
    if (estado.presupuesto < 70000) estado.presupuesto = 70000;
    if (estado.moral < 28) estado.moral = 28;
    if (estado.tiempo < 8) estado.tiempo = 8;
    if (estado.calidad < 22) estado.calidad = 22;
    estado.crisisRonda[tipo] = true;
    estado.historial.push({
      id: "crisis-" + tipo,
      tipo: "crisis",
      concepto: EM.CRISIS[tipo].concepto,
      cuentaConcepto: false,
      calidad: "regular",
      puntaje: null,
      eleccion: opcion.texto,
      porque: "La crisis no sustituye la decisión del concepto: solo evita que el proyecto se detenga.",
      voz: null,
      deltaResentimiento: Object.assign({}, (opcion.efectos && opcion.efectos.resentimiento) || {}),
      ronda: estado.ronda
    });
  }

  function abrirRonda(estado, n) {
    Object.keys(estado.ausentes).forEach(function (id) {
      if (estado.ausentes[id] === "ronda") delete estado.ausentes[id];
    });
    estado.crisisRonda = {};
    estado.ronda = n;
    if (n >= 1 && n <= 4) estado.tiempo = clamp(estado.tiempo - 2, 0, 99);
  }

  function ordenarSospechosos(estado) {
    var llave = {};
    EM.SOSPECHOSOS.forEach(function (id) { llave[id] = estado.azar(); });
    var arr = EM.SOSPECHOSOS.map(function (id) {
      var conceptos = EM.CONCEPTO_DE[id];
      var peor = 10;
      conceptos.forEach(function (c) {
        var p = estado.puntajeConcepto[c];
        if (p == null) p = 5;
        if (p < peor) peor = p;
      });
      var peso = { maria: 1, luis: 1.7, rey: 1.3, monica: 1, theo: 0.7 }[id] || 1;
      return { id: id, res: Math.round(estado.resentimiento[id] * peso), peor: peor, llave: llave[id] };
    });
    arr.sort(function (a, b) {
      if (b.res !== a.res) return b.res - a.res;
      if (a.peor !== b.peor) return a.peor - b.peor;
      return a.llave - b.llave;
    });
    return arr;
  }

  function fijarFalso(estado) {
    if (estado.falsoCulpable) return;
    var ranking = ordenarSospechosos(estado);
    if (ranking[0].res < 12) {
      estado.falsoCulpable = estado.saboteadorForzado === "luis"
        ? ranking.filter(function (x) { return x.id !== "luis"; })[0].id
        : "luis";
      return;
    }
    if (estado.saboteadorForzado) {
      estado.falsoCulpable = ranking.filter(function (x) { return x.id !== estado.saboteadorForzado; })[0].id;
      return;
    }
    estado.falsoCulpable = ranking[1].id;
  }

  function fijarSaboteador(estado) {
    if (estado.saboteador) return;
    var ranking = ordenarSospechosos(estado);
    var elegido;
    if (ranking[0].res < 12) {
      elegido = ranking.filter(function (x) { return x.id !== "luis"; })[0].id;
      if (!estado.falsoCulpable) estado.falsoCulpable = "luis";
    } else {
      elegido = ranking[0].id;
      if (!estado.falsoCulpable) estado.falsoCulpable = ranking[1].id;

      var cercanos = ranking.filter(function (x) {
        return x.res >= ranking[0].res - 18 && x.id !== estado.falsoCulpable;
      });
      if (cercanos.length) elegido = cercanos[Math.floor(estado.azar() * cercanos.length)].id;
    }

    if (estado.falsoCulpable && elegido === estado.falsoCulpable) {
      elegido = ranking.filter(function (x) { return x.id !== estado.falsoCulpable; })[0].id;
    }
    if (estado.saboteadorForzado && EM.SOSPECHOSOS.indexOf(estado.saboteadorForzado) >= 0) {
      elegido = estado.saboteadorForzado;
    }
    estado.saboteador = elegido;
    if (estado.falsoCulpable === estado.saboteador) {
      estado.falsoCulpable = ranking.filter(function (x) { return x.id !== estado.saboteador; })[0].id;
    }
  }

  function yaTienePista(estado, id) {
    return estado.pistas.some(function (p) { return p.id === id; });
  }

  function otorgarPista(estado, id) {
    if (!id || yaTienePista(estado, id)) return null;
    var base = pistaPorId(id);
    if (!base) return null;
    if (base.variantes && base.variantes.length) {
      base = Object.assign({}, base, { texto: base.variantes[Math.floor(estado.azar() * base.variantes.length)] });
    }
    var copia = {
      id: base.id,
      tipo: base.tipo,
      senala: base.senala,
      titulo: base.titulo,
      texto: base.texto,
      nueva: true
    };
    estado.pistas.push(copia);
    return copia;
  }

  function pistasDe(tipo, quien) {
    return EM.CATALOGO_PISTAS.filter(function (p) {
      return p.tipo === tipo && p.senala === quien;
    });
  }

  function otorgarFalsas(estado) {
    if (!estado.falsoCulpable) return;
    pistasDe("falsa", estado.falsoCulpable).forEach(function (p) {
      otorgarPista(estado, p.id);
    });
  }

  function pistaReal(estado, indice) {
    if (!estado.saboteador) return null;
    var reales = pistasDe("real", estado.saboteador);
    if (!reales[indice]) return null;
    return otorgarPista(estado, reales[indice].id);
  }

  function aplicarSabotaje(estado) {
    var s = EM.SABOTAJES[estado.saboteador];
    var ef = clonarEfectos(s.efectos);
    if (estado.sinColchon) ef.presupuesto = (ef.presupuesto || 0) - 40000;
    var diffs = aplicarEfectos(estado, ef);
    estado.sabotajeOcurrido = true;

    var se = estado.saboteador;
    if (estado.falsoCulpable && estado.falsoCulpable !== se && estado.azar() < 0.5) se = estado.falsoCulpable;
    estado.seFue = se;
    estado.ausentes[se] = "permanente";
    return diffs;
  }

  function puntajeTotal(estado, acierto) {
    var suma = 0;
    EM.CONCEPTOS.forEach(function (c) {
      var p = estado.puntajeConcepto[c.id];
      suma += (p == null ? 0 : p);
    });
    return Math.min(100, Math.round(suma + (acierto ? 5 : 0)));
  }

  function clasificarFinal(puntaje) {
    for (var i = 0; i < EM.FINALES.length; i++) {
      if (puntaje >= EM.FINALES[i].min) return EM.FINALES[i];
    }
    return EM.FINALES[EM.FINALES.length - 1];
  }

  function cercaDelSiguiente(puntaje) {
    var umbrales = [90, 75, 60, 40];
    for (var i = 0; i < umbrales.length; i++) {
      var falta = umbrales[i] - puntaje;
      if (falta > 0 && falta < 5) return true;
    }
    return false;
  }

  function expresionDe(estado, id) {
    if (id === "isabel") return "neutral";
    if (id === "claudia") {
      if (estado.moral < 40 || estado.calidad < 40) return "molesta";
      if (estado.calidad > 75 && estado.moral > 70) return "contenta";
      return "neutral";
    }
    if (estado.revelado === id) return "culpable";
    if (estado.expTemp && estado.expTemp[id]) return estado.expTemp[id];
    var r = estado.resentimiento[id] || 0;
    if (r >= 55) return "molesto";
    if (r <= 12 && estado.moral >= 65) return "contento";
    return "neutral";
  }

  function calcularTension(estado) {
    var base = (estado.ronda || 1) * 10;
    var moral = (100 - estado.moral) * 0.22;
    var maxRes = 0;
    EM.SOSPECHOSOS.forEach(function (id) {
      if (estado.resentimiento[id] > maxRes) maxRes = estado.resentimiento[id];
    });
    var extra = (estado.tiempo < 18 ? 12 : 0) + (estado.sabotajeOcurrido ? 18 : 0) + (estado.ronda >= 5 ? 10 : 0);
    return clamp(Math.round(base + moral + maxRes * 0.18 + extra), 0, 100);
  }

  function tomarReaccion(estado, grupo) {
    var pool = EM.GRUPOS_REACCION[grupo].filter(function (c) {
      return c !== estado.ultimaReaccion[grupo];
    });
    if (!pool.length) pool = EM.GRUPOS_REACCION[grupo];
    var codigo = pool[Math.floor(estado.azar() * pool.length)];
    estado.ultimaReaccion[grupo] = codigo;
    return codigo;
  }

  function resultadoDeOpcion(ficha, op) {
    return {
      calidad: op.calidad,
      puntaje: op.puntaje,
      efectos: clonarEfectos(op.efectos),
      voz: op.voz || null,
      porque: op.porque,
      eleccion: op.texto
    };
  }

  function evaluarOrganigrama(asignacion) {
    var correctos = 0;
    EM.PUESTOS.forEach(function (p) {
      if (asignacion && asignacion[p.id] === p.correcto) correctos += 1;
    });
    var calidad, puntaje, voz = null;
    var efectos = { resentimiento: {} };
    var porque;
    var eleccion = "Organigrama con " + correctos + " de 5 puestos en su lugar.";
    if (correctos === 5) {
      calidad = "bien"; puntaje = 10;
      efectos.moral = 8; efectos.calidad = 6;
      efectos.resentimiento.theo = -4;
      porque = "Cada persona quedó en el oficio que ya sabe hacer. Organizar es asignar roles claros para que el trabajo no se estorbe.";
    } else if (correctos >= 3) {
      calidad = "regular"; puntaje = 6;
      efectos.moral = -4; efectos.calidad = -2;
      efectos.resentimiento.theo = 10;
      porque = "Parte del equipo está en su puesto y parte no. La organización quedó a medias y Theo ya no sabe a quién sigue.";
    } else {
      calidad = "mal"; puntaje = 2; voz = "I07";
      efectos.moral = -10; efectos.calidad = -8; efectos.tiempo = -2;
      efectos.resentimiento.theo = 26;
      efectos.resentimiento.monica = 8;
      porque = "Los roles quedaron cruzados. Sin una estructura clara, todos creen que el error es de otro.";
    }
    return { calidad: calidad, puntaje: puntaje, efectos: efectos, voz: voz, porque: porque, eleccion: eleccion };
  }

  function evaluarPresupuesto(p) {
    p = p || { pre: 0, rodaje: 0, post: 0, impre: 0 };
    var bien = p.impre >= 10 && p.impre <= 18 && p.rodaje >= 38 && p.rodaje <= 52 && p.pre >= 15 && p.pre <= 28 && p.post >= 18 && p.post <= 30;
    var mal = p.impre < 10 || p.rodaje > 65 || p.pre < 10 || p.post < 10;
    var calidad, puntaje, porque;
    var efectos = { resentimiento: {} };
    if (bien) {
      calidad = "bien"; puntaje = 10;
      efectos.moral = 4; efectos.calidad = 4;
      efectos.resentimiento.rey = -4;
      porque = "Dejaste colchón para imprevistos y no cargaste todo el dinero al rodaje. Gestionar recursos es repartirlos en el ciclo completo.";
    } else if (mal) {
      calidad = "mal"; puntaje = 2;
      efectos.calidad = -6;
      efectos.resentimiento.rey = 28;
      if (p.impre < 10) efectos.sinColchon = true;
      porque = "Sin colchón, o con casi todo en el rodaje, cualquier imprevisto se come la película. Así se malgasta un recurso escaso.";
    } else {
      calidad = "regular"; puntaje = 6;
      efectos.resentimiento.rey = 8;
      porque = "El dinero alcanza, pero el reparto no cubre parejo las etapas. La gestión de recursos quedó vulnerable.";
    }
    var eleccion = "Pre " + p.pre + "%, rodaje " + p.rodaje + "%, post " + p.post + "%, imprevistos " + p.impre + "%.";
    return { calidad: calidad, puntaje: puntaje, efectos: efectos, voz: null, porque: porque, eleccion: eleccion };
  }

  function violacionesOrden(orden) {
    var pos = {};
    (orden || []).forEach(function (id, i) { pos[id] = i; });
    var malas = 0;
    EM.TAREAS.forEach(function (t) {
      var ok = t.deps.every(function (d) { return pos[d] != null && pos[d] < pos[t.id]; });
      if (!ok) malas += 1;
    });
    return malas;
  }

  function evaluarDependencias(orden) {
    var malas = violacionesOrden(orden);
    var calidad, puntaje, voz = null;
    var efectos = { resentimiento: {} };
    var porque;
    if (malas === 0) {
      calidad = "bien"; puntaje = 10; voz = "I20";
      efectos.moral = 6; efectos.calidad = 6;
      efectos.resentimiento.theo = -4;
      porque = "Ninguna tarea quedó antes de lo que necesita. Coordinar dependencias es la base del trabajo en equipo.";
    } else if (malas === 1) {
      calidad = "regular"; puntaje = 6;
      efectos.tiempo = -2; efectos.calidad = -2;
      efectos.resentimiento.theo = 10;
      porque = "Hay un cruce: alguien empieza sin el insumo anterior. El equipo se espera y se pierde tiempo.";
    } else {
      calidad = "mal"; puntaje = 2;
      efectos.tiempo = -4; efectos.calidad = -8; efectos.moral = -4;
      efectos.resentimiento.theo = 22;
      porque = "El orden ignora las dependencias. El equipo trabaja en falso y quien está al final de la cadena paga el desorden.";
    }
    return { calidad: calidad, puntaje: puntaje, efectos: efectos, voz: voz, porque: porque, eleccion: "Orden de tareas con " + malas + " dependencia" + (malas === 1 ? "" : "s") + " rota" + (malas === 1 ? "" : "s") + "." };
  }

  function evaluarKpis(accion) {
    var acierto = accion && accion.linea === "luz-norte";
    var seg = accion && typeof accion.segundos === "number" ? accion.segundos : 0;
    var calidad, puntaje, voz = null;
    var efectos = { resentimiento: {} };
    var porque;
    if (acierto && seg >= 8) {
      calidad = "bien"; puntaje = 10;
      efectos.calidad = 6;
      efectos.resentimiento.rey = -4;
      porque = "Encontraste la línea que no está en el plan. Control es comparar lo real contra lo planeado y señalar la desviación.";
    } else if (acierto && seg > 0) {
      calidad = "regular"; puntaje = 6;
      efectos.resentimiento.rey = 6;
      porque = "La encontraste, pero tarde. El control sirvió a medias: la desviación ya se estaba yendo.";
    } else {
      calidad = "mal"; puntaje = 2; voz = "I23";
      efectos.presupuesto = -40000; efectos.calidad = -4;
      efectos.resentimiento.rey = 26;
      porque = "La desviación siguió en la hoja. Sin control, el dinero que no cuadra encuentra quién lo empuje.";
    }
    return { calidad: calidad, puntaje: puntaje, efectos: efectos, voz: voz, porque: porque, eleccion: acierto ? "Señalaste al proveedor Luz Norte." : "La línea sospechosa siguió sin marcar." };
  }

  function resolver(id, accion) {
    var d = decisionPorId(id);
    accion = accion || {};
    if (d.tipo === "opciones" || d.tipo === "gantt") {
      var op = null;
      for (var i = 0; i < d.opciones.length; i++) if (d.opciones[i].id === accion.opcion) op = d.opciones[i];
      if (!op) op = d.opciones[d.opciones.length - 1];
      return resultadoDeOpcion(d, op);
    }
    if (d.tipo === "reloj") {
      var crisis = d.crisis[0];
      for (var c = 0; c < d.crisis.length; c++) if (d.crisis[c].id === accion.crisis) crisis = d.crisis[c];
      var elegida = null;
      if (accion.tiempoAgotado) {
        for (var k = 0; k < crisis.opciones.length; k++) if (crisis.opciones[k].peor) elegida = crisis.opciones[k];
        var res = resultadoDeOpcion(d, elegida);
        res.voz = "I17";
        res.eleccion = "Se agotó el tiempo. Quedó: " + elegida.texto;
        return res;
      }
      for (var j = 0; j < crisis.opciones.length; j++) if (crisis.opciones[j].id === accion.opcion) elegida = crisis.opciones[j];
      if (!elegida) elegida = crisis.opciones[crisis.opciones.length - 1];
      return resultadoDeOpcion(d, elegida);
    }
    if (d.tipo === "organigrama") return evaluarOrganigrama(accion.asignacion);
    if (d.tipo === "presupuesto") return evaluarPresupuesto(accion.porcentajes);
    if (d.tipo === "dependencias") return evaluarDependencias(accion.orden);
    if (d.tipo === "kpis") return evaluarKpis(accion);
    throw new Error("Tipo de decisión desconocido: " + d.tipo);
  }

  function resolverEvento(id, accion) {
    var ev = eventoPorId(id);
    var op = ev.opciones[0];
    for (var i = 0; i < ev.opciones.length; i++) if (ev.opciones[i].id === accion.opcion) op = ev.opciones[i];
    return resultadoDeOpcion(ev, op);
  }

  function asignacionCorrecta() {
    var o = {};
    EM.PUESTOS.forEach(function (p) { o[p.id] = p.correcto; });
    return o;
  }

  function asignacionParcial() {
    return { arte: "maria", edicion: "luis", produccion: "rey", guion: "theo", camara: "monica" };
  }

  function asignacionCruzada() {
    return { arte: "luis", edicion: "maria", produccion: "theo", guion: "rey", camara: "monica" };
  }

  function ordenValido() {
    return ["guion", "arte", "casting", "rodaje", "edicion", "color", "entrega"];
  }

  function ordenUnError() {
    return ["guion", "arte", "rodaje", "casting", "edicion", "color", "entrega"];
  }

  function ordenRoto() {
    return ["entrega", "color", "edicion", "rodaje", "casting", "arte", "guion"];
  }

  function accionPorCalidad(decision, calidad, rng) {
    if (decision.tipo === "opciones" || decision.tipo === "gantt") {
      var ops = decision.opciones.filter(function (o) { return o.calidad === calidad; });
      return { opcion: ops[0].id };
    }
    if (decision.tipo === "reloj") {
      var crisis = decision.crisis[Math.floor(rng() * decision.crisis.length)];
      var cops = crisis.opciones.filter(function (o) { return o.calidad === calidad; });
      return { crisis: crisis.id, opcion: cops[0].id, tiempoAgotado: false, segundos: 6 };
    }
    if (decision.tipo === "organigrama") {
      if (calidad === "bien") return { asignacion: asignacionCorrecta() };
      if (calidad === "regular") return { asignacion: asignacionParcial() };
      return { asignacion: asignacionCruzada() };
    }
    if (decision.tipo === "presupuesto") {
      if (calidad === "bien") return { porcentajes: { pre: 22, rodaje: 45, post: 23, impre: 10 } };
      if (calidad === "regular") return { porcentajes: { pre: 18, rodaje: 55, post: 15, impre: 12 } };
      return { porcentajes: { pre: 15, rodaje: 70, post: 15, impre: 0 } };
    }
    if (decision.tipo === "dependencias") {
      if (calidad === "bien") return { orden: ordenValido() };
      if (calidad === "regular") return { orden: ordenUnError() };
      return { orden: ordenRoto() };
    }
    if (decision.tipo === "kpis") {
      if (calidad === "bien") return { linea: "luz-norte", segundos: 12 };
      if (calidad === "regular") return { linea: "luz-norte", segundos: 3 };
      return { linea: "renta", segundos: 0 };
    }
    throw new Error("Sin acción para " + decision.id);
  }

  var PEGA = {
    maria: { D4: "micro", D5: "auto" },
    luis: { D6: "uno" },
    rey: { D3: "sin-colchon", D9: "fallo" },
    monica: { D1: "vago" },
    theo: { D2: "cruzado", D8: "roto" }
  };

  function accionEspecial(decision, clave) {
    if (clave === "micro" || clave === "auto" || clave === "uno" || clave === "vago") return { opcion: clave };
    if (clave === "sin-colchon") return { porcentajes: { pre: 15, rodaje: 70, post: 15, impre: 0 } };
    if (clave === "cruzado") return { asignacion: asignacionCruzada() };
    if (clave === "roto") return { orden: ordenRoto() };
    if (clave === "fallo") return { linea: "renta", segundos: 0 };
    return accionPorCalidad(decision, "mal", Math.random);
  }

  function accionParaEstilo(decision, estilo, rng, indice) {
    if (estilo.modo === "culpar" && PEGA[estilo.quien] && PEGA[estilo.quien][decision.id]) {
      return accionEspecial(decision, PEGA[estilo.quien][decision.id]);
    }
    if (estilo.modo === "todo-bien" || estilo.modo === "culpar") return accionPorCalidad(decision, "bien", rng);
    if (estilo.modo === "regular") return accionPorCalidad(decision, "regular", rng);
    if (estilo.modo === "todo-mal") return accionPorCalidad(decision, "mal", rng);
    if (estilo.modo === "mayoria-bien") return accionPorCalidad(decision, indice < 3 ? "regular" : "bien", rng);
    if (estilo.modo === "mal-gerente") return accionPorCalidad(decision, indice < 4 ? "mal" : "regular", rng);
    var cal = ["bien", "regular", "mal"][Math.floor(rng() * 3)];
    return accionPorCalidad(decision, cal, rng);
  }

  function accionEvento(evento, estilo, rng) {
    var calidad = "regular";
    if (estilo.modo === "todo-bien" || estilo.modo === "culpar" || estilo.modo === "mayoria-bien") calidad = "bien";
    else if (estilo.modo === "todo-mal") calidad = "mal";
    else if (estilo.modo === "azar") calidad = ["bien", "regular", "mal"][Math.floor(rng() * 3)];
    var ops = evento.opciones.filter(function (o) { return o.calidad === calidad; });
    return { opcion: ops[0].id };
  }

  function prepararEventos(estado, rng) {
    estado.eventos = barajar(EM.EVENTOS.map(function (e) { return e.id; }), rng || estado.azar);
  }

  function leerFinales() {
    try {
      var crudo = global.localStorage && global.localStorage.getItem("em_finales");
      var lista = crudo ? JSON.parse(crudo) : [];
      if (!Array.isArray(lista)) return [];
      return lista;
    } catch (e) {
      return [];
    }
  }

  function guardarFinal(id) {
    try {
      var lista = leerFinales();
      if (lista.indexOf(id) < 0) lista.push(id);
      if (global.localStorage) global.localStorage.setItem("em_finales", JSON.stringify(lista));
      return lista;
    } catch (e2) {
      return [];
    }
  }

  function mxn(n) {
    var neg = n < 0;
    var v = Math.abs(Math.round(n));
    var s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-$" : "$") + s + " MXN";
  }

  function decisionCulpa(estado, quien) {
    var mejor = null;
    var mejorDelta = 0;
    estado.historial.forEach(function (h) {
      if (!h.cuentaConcepto) return;
      var d = (h.deltaResentimiento && h.deltaResentimiento[quien]) || 0;
      if (d > mejorDelta) {
        mejorDelta = d;
        mejor = h;
      }
    });
    return mejor;
  }

  EM.util = { clamp: clamp, barajar: barajar, mxn: mxn, clonarEfectos: clonarEfectos };
  EM.decisionPorId = decisionPorId;
  EM.eventoPorId = eventoPorId;
  EM.conceptoPorId = conceptoPorId;
  EM.pistaPorId = pistaPorId;
  EM.estado = {
    crear: crear,
    aplicarEfectos: aplicarEfectos,
    aplicarResultado: aplicarResultado,
    crisisPendiente: crisisPendiente,
    aplicarCrisis: aplicarCrisis,
    abrirRonda: abrirRonda,
    ordenarSospechosos: ordenarSospechosos,
    fijarFalso: fijarFalso,
    fijarSaboteador: fijarSaboteador,
    otorgarPista: otorgarPista,
    otorgarFalsas: otorgarFalsas,
    pistaReal: pistaReal,
    pistasDe: pistasDe,
    aplicarSabotaje: aplicarSabotaje,
    puntajeTotal: puntajeTotal,
    clasificarFinal: clasificarFinal,
    cercaDelSiguiente: cercaDelSiguiente,
    expresionDe: expresionDe,
    calcularTension: calcularTension,
    tomarReaccion: tomarReaccion,
    accionParaEstilo: accionParaEstilo,
    accionEvento: accionEvento,
    prepararEventos: prepararEventos,
    leerFinales: leerFinales,
    guardarFinal: guardarFinal,
    decisionCulpa: decisionCulpa,
    asignacionCorrecta: asignacionCorrecta,
    ordenValido: ordenValido
  };
  EM.reglas = {
    resolver: resolver,
    resolverEvento: resolverEvento,
    violacionesOrden: violacionesOrden
  };
})(typeof window !== "undefined" ? window : globalThis);
