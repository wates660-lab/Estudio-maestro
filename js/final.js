(function (global) {
  var EM = global.EM = global.EM || {};

  function vivo(token) {
    return token === EM.juego.token;
  }

  function esperar() {
    return new Promise(function (resolve) {
      EM.ui._paso = function () {
        EM.ui._paso = null;
        resolve();
      };
    });
  }

  function acusar(estado) {
    return new Promise(function (resolve) {
      var p = EM.ui.panel();
      p.textContent = "";
      var caja = document.createElement("div");
      caja.className = "acusacion";
      var h = document.createElement("h3");
      h.textContent = "¿A quién acusas?";
      var ayuda = document.createElement("p");
      ayuda.className = "ayuda";
      ayuda.textContent = "Elige a una persona y hasta tres pistas. Los hilos del corcho ya vienen marcados.";
      caja.appendChild(h);
      caja.appendChild(ayuda);
      var gente = document.createElement("div");
      gente.className = "acusar-gente";
      var elegido = null;
      var marcas = {};
      var usados = 0;
      estado.hilos.forEach(function (hilo) {
        if (usados < 3 && !marcas[hilo.pistaId]) {
          marcas[hilo.pistaId] = true;
          usados += 1;
        }
      });
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "btn continuar";
      boton.textContent = "Acusar";
      boton.disabled = true;

      function pintarGente() {
        gente.textContent = "";
        EM.SOSPECHOSOS.forEach(function (id, i) {
          if (estado.ausentes[id] === "permanente") {
            var vacio = document.createElement("div");
            vacio.className = "opcion-acusa vacia";
            vacio.textContent = EM.PERSONAJES[id].nombre.split(" ")[0] + " no está. La silla sigue contando.";
          }
          var b = document.createElement("button");
          b.type = "button";
          b.className = "opcion-acusa" + (elegido === id ? " sel" : "");
          b.appendChild(EM.escenas.obtenerRetrato(id, EM.estado.expresionDe(estado, id)));
          var nom = document.createElement("span");
          nom.textContent = (i + 1) + ". " + EM.PERSONAJES[id].nombre;
          b.appendChild(nom);
          b.addEventListener("click", function () {
            elegido = id;
            boton.disabled = false;
            EM.audio.acusado();
            pintarGente();
          });
          gente.appendChild(b);
        });
      }
      pintarGente();
      caja.appendChild(gente);
      EM.ui._numeros = function (n) {
        if (EM.SOSPECHOSOS[n - 1]) {
          elegido = EM.SOSPECHOSOS[n - 1];
          boton.disabled = false;
          EM.audio.acusado();
          pintarGente();
        }
      };

      if (estado.pistas.length) {
        var lista = document.createElement("div");
        lista.className = "acusar-pistas";
        estado.pistas.forEach(function (pista) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "pista-toggle" + (marcas[pista.id] ? " sel" : "");
          b.textContent = pista.titulo;
          b.addEventListener("click", function () {
            if (marcas[pista.id]) {
              delete marcas[pista.id];
            } else if (Object.keys(marcas).length < 3) {
              marcas[pista.id] = true;
            }
            b.classList.toggle("sel", !!marcas[pista.id]);
            EM.audio.clic();
          });
          lista.appendChild(b);
        });
        caja.appendChild(document.createElement("p")).className = "ayuda";
        caja.lastChild.textContent = "Evidencia, máximo tres.";
        caja.appendChild(lista);
      }

      boton.addEventListener("click", function () {
        if (!elegido) return;
        EM.ui._numeros = null;
        EM.ui._paso = null;
        resolve({
          quien: elegido,
          pistas: Object.keys(marcas)
        });
      });
      caja.appendChild(boton);
      p.appendChild(caja);
    });
  }

  function motivo(estado) {
    var quien = estado.saboteador;
    var culpa = EM.estado.decisionCulpa(estado, quien);
    var conceptos = EM.CONCEPTO_DE[quien];
    var peorId = conceptos[0];
    conceptos.forEach(function (id) {
      var actual = estado.puntajeConcepto[peorId];
      var candidato = estado.puntajeConcepto[id];
      if (actual == null) actual = 10;
      if (candidato == null) candidato = 10;
      if (candidato < actual) peorId = id;
    });
    return { culpa: culpa, concepto: EM.conceptoPorId(peorId) };
  }

  function bloqueTexto(kicker, titulo, parrafos) {
    var p = EM.ui.panel();
    p.textContent = "";
    var card = document.createElement("article");
    card.className = "cartel en-panel";
    var k = document.createElement("p");
    k.className = "kicker";
    k.textContent = kicker;
    var h = document.createElement("h2");
    h.textContent = titulo;
    card.appendChild(k);
    card.appendChild(h);
    parrafos.forEach(function (texto) {
      var par = document.createElement("p");
      par.textContent = texto;
      card.appendChild(par);
    });
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn continuar";
    btn.textContent = "Continuar";
    btn.addEventListener("click", function () { if (EM.ui._paso) EM.ui._paso(); });
    card.appendChild(btn);
    p.appendChild(card);
    return esperar();
  }

  function lineaTiempo(estado) {
    var p = EM.ui.panel();
    p.textContent = "";
    var card = document.createElement("article");
    card.className = "cartel en-panel";
    var h = document.createElement("h2");
    h.textContent = "Tu propia línea de tiempo";
    var intro = document.createElement("p");
    var nombre = EM.PERSONAJES[estado.saboteador].nombre.split(" ")[0];
    intro.textContent = "El sabotaje no llegó hecho. Estas son tus decisiones. Las marcadas empujaron a " + nombre + ".";
    card.appendChild(h);
    card.appendChild(intro);
    var ol = document.createElement("ol");
    ol.className = "linea-tiempo";
    var n = 0;
    estado.historial.forEach(function (hito) {
      if (!hito.cuentaConcepto) return;
      n += 1;
      var li = document.createElement("li");
      var empuje = hito.deltaResentimiento && hito.deltaResentimiento[estado.saboteador] > 0;
      if (hito.calidad === "mal" || empuje) li.className = "falla";
      li.style.animationDelay = (n * 0.08) + "s";
      var concepto = EM.conceptoPorId(hito.concepto);
      var fuerte = document.createElement("strong");
      fuerte.textContent = (concepto ? concepto.nombre : hito.concepto) + " · " + (hito.calidad === "bien" ? "Bien" : hito.calidad === "mal" ? "Mal" : "Regular");
      var span = document.createElement("span");
      span.textContent = hito.eleccion;
      li.appendChild(fuerte);
      li.appendChild(span);
      ol.appendChild(li);
    });
    card.appendChild(ol);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn continuar";
    btn.textContent = "Continuar";
    btn.addEventListener("click", function () { if (EM.ui._paso) EM.ui._paso(); });
    card.appendChild(btn);
    EM.ui.pantallaCompleta(card);
    return esperar();
  }

  function informe(estado, fin) {
    var p = EM.ui.panel();
    p.textContent = "";
    var doc = document.createElement("article");
    doc.className = "informe";
    var cabeza = document.createElement("header");
    cabeza.appendChild(document.createElement("p")).textContent = "Expediente de auditoría";
    cabeza.lastChild.className = "kicker";
    var h = document.createElement("h2");
    h.textContent = "Informe final";
    cabeza.appendChild(h);
    var sello = document.createElement("p");
    sello.className = "sello-final sello-" + (fin.id === "anio" || fin.id === "bueno" ? "bien" : fin.id === "regular" ? "regular" : "mal");
    sello.textContent = fin.nombre;
    cabeza.appendChild(sello);
    doc.appendChild(cabeza);
    doc.appendChild(EM.extras.radar(estado));
    EM.CONCEPTOS.forEach(function (concepto) {
      var hito = null;
      estado.historial.forEach(function (item) {
        if (item.cuentaConcepto && item.concepto === concepto.id) hito = item;
      });
      var nota = document.createElement("section");
      nota.className = "ficha-concepto";
      var titulo = document.createElement("h3");
      var pts = estado.puntajeConcepto[concepto.id];
      if (pts == null) pts = 0;
      titulo.textContent = concepto.nombre + "  ·  " + pts + "/10";
      var def = document.createElement("p");
      def.textContent = concepto.definicion;
      var hecho = document.createElement("p");
      hecho.textContent = hito
        ? "En esta partida: " + hito.eleccion
        : "En esta partida no quedó registrada la decisión.";
      var porque = document.createElement("p");
      porque.textContent = hito ? hito.porque : "";
      var consejo = document.createElement("p");
      consejo.className = "consejo";
      consejo.textContent = "Consejo: " + concepto.consejo;
      nota.appendChild(titulo);
      nota.appendChild(def);
      nota.appendChild(hecho);
      if (hito) nota.appendChild(porque);
      nota.appendChild(consejo);
      doc.appendChild(nota);
    });
    var cierre = document.createElement("p");
    cierre.className = "total-informe";
    cierre.textContent = "Calificación " + estado.puntajeFinal + "/100" + (estado.acierto ? ". La acusación sumó 5 puntos." : ". La acusación no sumó puntos.");
    doc.appendChild(cierre);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn continuar";
    btn.textContent = "Ver el final";
    btn.addEventListener("click", function () { if (EM.ui._paso) EM.ui._paso(); });
    doc.appendChild(btn);
    EM.ui.pantallaCompleta(doc);
    return esperar();
  }

  function cierre(estado, fin) {
    var p = EM.ui.panel();
    p.textContent = "";
    var card = document.createElement("article");
    card.className = "cartel en-panel final-cierre";
    var h = document.createElement("h2");
    h.textContent = fin.nombre;
    var pts = document.createElement("p");
    pts.className = "puntaje-grande";
    pts.textContent = estado.puntajeFinal + " / 100";
    var cuenta = document.createElement("p");
    cuenta.textContent = "Finales descubiertos: " + EM.estado.leerFinales().length + "/5";
    var otra = document.createElement("button");
    otra.type = "button";
    otra.className = "btn continuar";
    otra.textContent = "Jugar de nuevo";
    otra.addEventListener("click", function () {
      EM.juego.token += 1;
      EM.ui._paso = null;
      EM.ui._numeros = null;
      document.body.classList.remove("temblor", "silencio-dramatico");
      try { if (EM.audio.setReloj) EM.audio.setReloj(false); } catch (e) {}
      try { if (EM.audio.detenerVoz) EM.audio.detenerVoz(); } catch (e) {}
      document.getElementById("capa-evidencias").hidden = true;
      document.getElementById("capa-demo").hidden = true;
      document.getElementById("popover-sonido").hidden = true;
      EM.ui.mostrarTitulo();
    });
    card.appendChild(h);
    card.appendChild(pts);
    card.appendChild(cuenta);
    card.appendChild(otra);
    p.appendChild(card);
  }

  async function correr(estado, token) {
    estado.expTemp = null;
    EM.extras.guardarPartida(estado, 5);
    EM.estado.abrirRonda(estado, 5);
    EM.juego.sincronizar(estado);
    await EM.ui.corte();
    if (!vivo(token)) return;
    EM.ui.asegurarPantalla();
    EM.ui.ponerEscena(estado);
    await EM.narradora.decir("I27");
    if (!vivo(token)) return;
    var ev = EM.eventoPorId(estado.eventos[4]);
    if (ev) await EM.juego.jugarEvento(estado, ev, token);
    if (!vivo(token)) return;
    EM.ui.ponerEscena(estado);
    await EM.narradora.decir("I28");
    if (!vivo(token)) return;
    EM.audio.susurro();
    var acusacion = await acusar(estado);
    if (!vivo(token)) return;
    estado.acusado = acusacion.quien;
    estado.pistasUsadas = acusacion.pistas;
    estado.acierto = acusacion.quien === estado.saboteador;
    EM.extras.trasAcusar(estado);
    await EM.narradora.silencio();
    if (!vivo(token)) return;
    await EM.narradora.decir(estado.acierto ? "I30" : "I31");
    if (!vivo(token)) return;
    await EM.narradora.decir("R31");
    if (!vivo(token)) return;
    estado.revelado = estado.saboteador;
    delete estado.ausentes[estado.saboteador];
    estado.habla = estado.saboteador;
    EM.ui.ponerEscena(estado);
    EM.audio.sting();
    var porQue = motivo(estado);
    var nombre = EM.PERSONAJES[estado.saboteador].nombre;
    var parrafos = [
      EM.SABOTAJES[estado.saboteador].texto,
      "El concepto que se le vino encima fue " + porQue.concepto.nombre + ": " + porQue.concepto.definicion
    ];
    if (porQue.culpa) parrafos.push("La decisión que más lo empujó: " + porQue.culpa.eleccion);
    if (estado.falsoCulpable && estado.falsoCulpable !== estado.saboteador) {
      parrafos.push("En la ronda tres el expediente señalaba a " + EM.PERSONAJES[estado.falsoCulpable].nombre.split(" ")[0] + ". No era.");
    }
    await bloqueTexto("Revelación", "Fue " + nombre, parrafos);
    if (!vivo(token)) return;
    await EM.narradora.decir(EM.VOZ_SABOTEADOR[estado.saboteador]);
    if (!vivo(token)) return;
    await EM.narradora.decir("R32");
    if (!vivo(token)) return;
    await lineaTiempo(estado);
    if (!vivo(token)) return;
    estado.habla = "isabel";
    EM.ui.ponerEscena(estado);
    var esc = document.getElementById("escenario");
    if (esc) {
      var foco = document.createElement("div");
      foco.className = "isabel-revelada";
      foco.appendChild(EM.escenas.obtenerRetrato("isabel", "neutral"));
      esc.appendChild(foco);
    }
    await EM.narradora.decir("I37");
    if (!vivo(token)) return;
    await EM.narradora.decir("I38");
    if (!vivo(token)) return;
    await EM.narradora.decir("I39");
    if (!vivo(token)) return;
    var total = EM.estado.puntajeTotal(estado, estado.acierto);
    estado.puntajeFinal = total;
    var fin = EM.estado.clasificarFinal(total);
    estado.finalId = fin.id;
    EM.extras.alFinalizar(estado, fin);
    await informe(estado, fin);
    if (!vivo(token)) return;
    await EM.narradora.decir(fin.voz);
    if (!vivo(token)) return;
    if (EM.estado.cercaDelSiguiente(total)) await EM.narradora.decir("R33");
    EM.estado.guardarFinal(fin.id);
    await EM.extras.epilogo(estado, fin);
    if (!vivo(token)) return;
    EM.ui.ponerEscena(estado);
    cierre(estado, fin);
  }

  EM.final = { correr: correr };
})(typeof window !== "undefined" ? window : globalThis);
