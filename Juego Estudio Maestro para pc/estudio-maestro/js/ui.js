(function (global) {
  var EM = global.EM = global.EM || {};

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function vista() {
    return document.getElementById("vista");
  }

  function asegurarPantalla() {
    if (document.getElementById("escenario")) return;
    vista().textContent = "";
    var pantalla = el("div", "pantalla");
    pantalla.appendChild(el("div", "escenario"));
    pantalla.lastChild.id = "escenario";
    var panel = el("section", "panel");
    panel.id = "panel";
    pantalla.appendChild(panel);
    vista().appendChild(pantalla);
  }

  function panel() {
    var completa = document.querySelector(".pantalla-completa");
    if (completa) completa.remove();
    asegurarPantalla();
    return document.getElementById("panel");
  }

  function hudVisible(on) {
    document.getElementById("hud").hidden = !on;
    document.body.classList.toggle("sin-hud", !on);
  }

  function barra(valor, max) {
    if (max <= 0) return 0;
    return EM.util.clamp(Math.round(valor / max * 100), 0, 100);
  }

  var ultimoHud = {};

  function actualizarHud(estado) {
    var mapa = {
      presupuesto: { n: estado.presupuesto, max: 500000, texto: EM.util.mxn(estado.presupuesto) },
      moral: { n: estado.moral, max: 100, texto: estado.moral + "/100" },
      tiempo: { n: estado.tiempo, max: 60, texto: estado.tiempo + " días" },
      calidad: { n: estado.calidad, max: 100, texto: estado.calidad + "/100" }
    };
    Object.keys(mapa).forEach(function (id) {
      var nodo = document.querySelector('.medidor[data-m="' + id + '"]');
      if (!nodo) return;
      var previo = ultimoHud[id];
      nodo.querySelector(".lleno").style.width = barra(Math.max(0, mapa[id].n), mapa[id].max) + "%";
      nodo.querySelector(".val").textContent = mapa[id].texto;
      if (previo != null && previo !== mapa[id].n) {
        var clase = mapa[id].n > previo ? "sube" : "baja";
        nodo.classList.remove("sube", "baja");
        void nodo.offsetWidth;
        nodo.classList.add(clase);
        setTimeout(function () { nodo.classList.remove(clase); }, 1000);
      }
      ultimoHud[id] = mapa[id].n;
      nodo.classList.toggle("bajo", mapa[id].n <= (id === "presupuesto" ? 80000 : 25));
    });
    var r = document.getElementById("hud-ronda");
    if (r) r.textContent = estado && estado.ronda ? "Ronda " + estado.ronda : "";
  }

  function refrescarSonido() {
    var btn = document.getElementById("btn-sonido");
    if (!btn) return;
    var mudo = EM.audio.estado.mudo;
    btn.textContent = mudo ? "Silencio" : "Sonido";
    btn.setAttribute("aria-pressed", mudo ? "true" : "false");
    var mv = document.getElementById("vol-musica");
    var vv = document.getElementById("vol-voz");
    if (mv) mv.value = String(Math.round(EM.audio.estado.volMusica * 100));
    if (vv) vv.value = String(Math.round(EM.audio.estado.volVoz * 100));
  }

  function temblor() {
    if (EM.audio.poca()) return;
    document.body.classList.add("temblor");
    setTimeout(function () { document.body.classList.remove("temblor"); }, 700);
  }

  function corte() {
    return new Promise(function (resolve) {
      if (EM.audio.poca()) { resolve(); return; }
      var c = document.getElementById("corte");
      c.classList.remove("activa");
      void c.offsetWidth;
      c.classList.add("activa");
      setTimeout(resolve, 200);
      setTimeout(function () { c.classList.remove("activa"); }, 520);
    });
  }

  function ponerEscena(estado) {
    asegurarPantalla();
    var ronda = EM.RONDAS[(estado.ronda || 1) - 1];
    var modo = ronda ? ronda.escenario : "juntas";
    EM.escenas.dibujar(document.getElementById("escenario"), estado, modo);
  }

  function montarDialogo(etiqueta) {
    var p = panel();
    p.textContent = "";
    var caja = el("div", "dialogo");
    var retrato = el("div", "retrato-hablante");
    retrato.appendChild(EM.escenas.obtenerRetrato("isabel", "neutral"));
    var guion = el("div", "guion");
    guion.appendChild(el("p", "hablante", "Isabel"));
    var linea = el("p", "linea");
    linea.setAttribute("aria-live", "polite");
    guion.appendChild(linea);
    var btn = el("button", "btn continuar", etiqueta || "Continuar");
    btn.type = "button";
    btn.addEventListener("click", function () {
      if (EM.ui._paso) EM.ui._paso();
    });
    caja.appendChild(retrato);
    caja.appendChild(guion);
    caja.appendChild(btn);
    p.appendChild(caja);
    return caja;
  }

  function encabezadoDecision(decision) {
    var p = panel();
    p.textContent = "";
    var concepto = EM.conceptoPorId(decision.concepto);
    var caja = el("div", "decision");
    var prefijo = decision.tipo === "evento" ? "Evento sorpresa" : decision.tipo === "crisis" ? "Crisis" : "Concepto";
    var kicker = el("p", "kicker" + (decision.tipo === "evento" || decision.tipo === "crisis" ? " es-evento" : ""), prefijo + " · " + (concepto ? concepto.nombre : ""));
    var h = el("h3", null, decision.titulo);
    var c = el("p", "contexto", decision.contexto || "");
    caja.appendChild(kicker);
    caja.appendChild(h);
    caja.appendChild(c);
    p.appendChild(caja);
    return caja;
  }

  function pantallaCompleta(contenido) {
    var vieja = document.querySelector(".pantalla-completa");
    if (vieja) vieja.remove();
    var capa = el("div", "pantalla-completa");
    capa.appendChild(contenido);
    vista().appendChild(capa);
    capa.scrollTop = 0;
    return capa;
  }

  function opcion(i, texto) {
    var b = el("button", "opcion");
    b.type = "button";
    b.style.setProperty("--i", String(i));
    b.appendChild(el("span", "num", String(i + 1)));
    b.appendChild(el("span", "txt", texto));
    return b;
  }

  function elegir(opciones) {
    return new Promise(function (resolve) {
      var p = panel();
      var cont = el("div", "opciones");
      var cerrado = false;
      function tomar(id) {
        if (cerrado) return;
        cerrado = true;
        EM.ui._numeros = null;
        EM.audio.clic();
        resolve(id);
      }
      opciones.forEach(function (op, i) {
        var b = opcion(i, op.texto);
        b.addEventListener("click", function () { tomar(op.id); });
        cont.appendChild(b);
      });
      p.appendChild(cont);
      EM.ui._numeros = function (n) {
        if (opciones[n - 1]) tomar(opciones[n - 1].id);
      };
    });
  }

  function textoDiffs(diffs) {
    if (!diffs) return "";
    var partes = [];
    if (diffs.presupuesto) partes.push("Presupuesto " + (diffs.presupuesto > 0 ? "+" : "") + EM.util.mxn(diffs.presupuesto).replace(" MXN", ""));
    if (diffs.moral) partes.push("Moral " + (diffs.moral > 0 ? "+" : "") + diffs.moral);
    if (diffs.tiempo) partes.push("Tiempo " + (diffs.tiempo > 0 ? "+" : "") + diffs.tiempo + " días");
    if (diffs.calidad) partes.push("Calidad " + (diffs.calidad > 0 ? "+" : "") + diffs.calidad);
    return partes.join("   ·   ");
  }

  function chipsDiffs(diffs) {
    if (!diffs) return null;
    var cont = el("div", "diffs");
    function chip(nombre, n, texto) {
      if (!n) return;
      cont.appendChild(el("span", "chip " + (n > 0 ? "sube" : "baja"), nombre + " " + (n > 0 ? "+" : "") + texto));
    }
    chip("Presupuesto", diffs.presupuesto, EM.util.mxn(diffs.presupuesto).replace(" MXN", ""));
    chip("Moral", diffs.moral, diffs.moral);
    chip("Tiempo", diffs.tiempo, diffs.tiempo + " días");
    chip("Calidad", diffs.calidad, diffs.calidad);
    return cont.childNodes.length ? cont : null;
  }

  function pintarRetro(datos) {
    var p = panel();
    p.textContent = "";
    var calidad = datos.calidad || "regular";
    var nombres = { bien: "Bien", regular: "Regular", mal: "Mal" };
    var card = el("article", "retro sello-" + calidad);
    card.appendChild(el("p", "resultado", nombres[calidad] || "Regular"));
    card.appendChild(el("h3", null, datos.concepto ? datos.concepto.nombre : ""));
    if (datos.concepto) card.appendChild(el("p", "def", datos.concepto.definicion));
    card.appendChild(el("p", "porque", datos.porque || ""));
    var chips = chipsDiffs(datos.diffs);
    if (chips) card.appendChild(chips);
    var linea = el("p", "linea retro-linea");
    linea.id = "retro-linea";
    card.appendChild(linea);
    var btn = el("button", "btn continuar", "Continuar");
    btn.type = "button";
    btn.addEventListener("click", function () { if (EM.ui._paso) EM.ui._paso(); });
    card.appendChild(btn);
    p.appendChild(card);
    return linea;
  }

  function cartel(datos, estado) {
    return new Promise(function (resolve) {
      vista().textContent = "";
      hudVisible(true);
      var pantalla = el("div", "pantalla cartel-pantalla");
      var card = el("article", "cartel");
      card.appendChild(el("p", "kicker", datos.kicker || "Estudio Maestro"));
      card.appendChild(el("h2", null, datos.titulo));
      card.appendChild(el("p", null, datos.texto));
      if (datos.nota) card.appendChild(el("p", "nota-salida", datos.nota));
      if (datos.equipo) {
        var fila = el("div", "fila-equipo");
        EM.SOSPECHOSOS.forEach(function (id) {
          var f = el("figure", "mini-persona");
          f.appendChild(EM.escenas.obtenerRetrato(id, "neutral"));
          f.appendChild(el("figcaption", null, EM.PERSONAJES[id].nombre));
          f.appendChild(el("small", null, EM.PERSONAJES[id].rol));
          fila.appendChild(f);
        });
        card.appendChild(fila);
      }
      var btn = el("button", "btn continuar", datos.boton || "Continuar");
      btn.type = "button";
      btn.addEventListener("click", function () { resolve(); });
      card.appendChild(btn);
      pantalla.appendChild(card);
      vista().appendChild(pantalla);
      EM.ui._paso = function () { EM.ui._paso = null; resolve(); };
      btn.focus();
    });
  }

  function esperarBoton(etiqueta) {
    return new Promise(function (resolve) {
      var p = panel();
      var btn = el("button", "btn continuar", etiqueta);
      btn.type = "button";
      btn.addEventListener("click", function () {
        EM.ui._paso = null;
        resolve();
      });
      p.appendChild(btn);
      EM.ui._paso = function () { EM.ui._paso = null; resolve(); };
    });
  }

  function avisoPista(pista) {
    var n = document.getElementById("aviso-pista");
    if (!n) {
      n = el("p", "aviso-pista");
      n.id = "aviso-pista";
      document.body.appendChild(n);
    }
    n.textContent = "Nueva pista: " + (pista ? pista.titulo : "en el corcho");
    n.classList.add("visible");
    setTimeout(function () { n.classList.remove("visible"); }, 2400);
  }

  function finalesTexto() {
    var lista = EM.estado.leerFinales();
    return "Finales descubiertos: " + lista.length + "/5";
  }

  function mostrarTitulo() {
    EM.ui._paso = null;
    EM.ui._numeros = null;
    hudVisible(false);
    EM.juego.fase = "titulo";
    vista().textContent = "";
    var pantalla = el("div", "titulo-pantalla");
    var bloque = el("div", "titulo-bloque");
    bloque.appendChild(el("h1", null, "Estudio Maestro"));
    var claqueta = el("button", "claqueta");
    claqueta.type = "button";
    claqueta.id = "btn-claqueta";
    claqueta.setAttribute("aria-label", "Empezar la película");
    claqueta.innerHTML =
      '<span class="claqueta-brazo" aria-hidden="true"><span></span></span>' +
      '<span class="claqueta-pizarra"><span>PROD · ESTUDIO MAESTRO</span><span>ESC 01 · TOMA 01</span><strong>ACCIÓN</strong></span>';
    claqueta.addEventListener("click", function () {
      if (EM.juego.fase !== "titulo") return;
      EM.audio.habilitar();
      EM.audio.claqueta();
      claqueta.classList.add("cierra");
      claqueta.disabled = true;
      setTimeout(function () { EM.juego.empezar(false); }, EM.audio.poca() ? 40 : 520);
    });
    bloque.appendChild(claqueta);
    bloque.appendChild(el("p", "subtitulo", "Sabotaje en producción"));
    bloque.appendChild(el("p", "finales-contador", finalesTexto()));
    var fila = el("div", "titulo-acciones");
    var cred = el("button", "btn ghost", "Créditos");
    cred.type = "button";
    cred.addEventListener("click", function () {
      EM.audio.habilitar();
      mostrarCreditos();
    });
    var son = el("button", "btn ghost", "Sonido");
    son.type = "button";
    son.addEventListener("click", function () {
      EM.audio.habilitar();
      document.getElementById("popover-sonido").hidden = !document.getElementById("popover-sonido").hidden;
    });
    fila.appendChild(cred);
    fila.appendChild(son);
    EM.extras.decorarTitulo(fila);
    bloque.appendChild(fila);
    pantalla.appendChild(bloque);
    vista().appendChild(pantalla);
    claqueta.focus();
  }

  function mostrarCreditos() {
    EM.juego.fase = "creditos";
    vista().textContent = "";
    var pantalla = el("div", "titulo-pantalla");
    var card = el("article", "cartel creditos");
    card.appendChild(el("p", "kicker", "Créditos"));
    card.appendChild(el("h2", null, "Estudio Maestro"));
    card.appendChild(el("p", "dato", "Proyecto Final"));
    card.appendChild(el("p", "dato", "Materia: Administración"));
    card.appendChild(el("p", "kicker equipo-t", "Integrantes del equipo"));
    var lista = el("ul", "equipo");
    [
      ["María Isabel Ceballos Girón", "239290"],
      ["Luz Aida Zamorano Muñiz", "239300"],
      ["Danna Kristell Rosas Jiménez", "239266"],
      ["Daniela Paulina Noriega Carmona", "239215"],
      ["Jimena Castellanos Solis", "239071"]
    ].forEach(function (m) {
      var li = el("li", null);
      li.appendChild(el("span", "eq-nombre", m[0]));
      li.appendChild(el("span", "eq-mat", m[1]));
      lista.appendChild(li);
    });
    card.appendChild(lista);
    card.appendChild(el("p", "dato voz-isabel", "Voz de Isabel: María Isabel Ceballos Girón"));
    var btn = el("button", "btn continuar", "Volver");
    btn.type = "button";
    btn.addEventListener("click", mostrarTitulo);
    card.appendChild(btn);
    pantalla.appendChild(card);
    vista().appendChild(pantalla);
    EM.ui._paso = mostrarTitulo;
  }

  function abrirDemo() {
    if (EM.juego.fase !== "titulo" && EM.juego.fase !== "demo") return;
    EM.juego.fase = "demo";
    var capa = document.getElementById("capa-demo");
    capa.hidden = false;
    capa.textContent = "";
    var caja = el("div", "demo-caja");
    caja.appendChild(el("h2", null, "Modo de exposición"));
    caja.appendChild(el("p", null, "Salta a una ronda con un estado ya armado. No aparece durante la partida."));
    var fila = el("div", "demo-rondas");
    [1, 2, 3, 4, 5].forEach(function (n) {
      var b = el("button", "btn", "Ronda " + n);
      b.type = "button";
      b.addEventListener("click", function () {
        capa.hidden = true;
        EM.audio.habilitar();
        EM.juego.saltar(n);
      });
      fila.appendChild(b);
    });
    var cerrar = el("button", "btn ghost", "Cerrar");
    cerrar.type = "button";
    cerrar.addEventListener("click", function () {
      capa.hidden = true;
      EM.juego.fase = "titulo";
    });
    caja.appendChild(fila);
    caja.appendChild(cerrar);
    capa.appendChild(caja);
  }

  function centro(nodo, raiz) {
    var a = nodo.getBoundingClientRect();
    var b = raiz.getBoundingClientRect();
    return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2 };
  }

  function abrirEvidencias() {
    var estado = EM.juego.estado;
    if (!estado) return;
    var capa = document.getElementById("capa-evidencias");
    capa.hidden = false;
    capa.textContent = "";
    if (estado.evidRonda !== estado.ronda && estado.pistas && estado.pistas.length) {
      estado.evidRonda = estado.ronda;
      setTimeout(function () { EM.narradora.flash(EM.estado.tomarReaccion(estado, "sospecha")); }, 500);
    }
    var tablero = el("div", "corcho");
    var cabeza = el("header", "corcho-cabeza");
    cabeza.appendChild(el("h2", null, "Tablero de evidencias"));
    var cerrar = el("button", "btn", "Cerrar");
    cerrar.type = "button";
    cerrar.addEventListener("click", function () { capa.hidden = true; });
    cabeza.appendChild(cerrar);
    tablero.appendChild(cabeza);
    var fotos = el("div", "fotos-sospechosos");
    EM.SOSPECHOSOS.forEach(function (id) {
      var f = el("button", "foto-sospecha");
      f.type = "button";
      f.dataset.sospecha = id;
      f.appendChild(EM.escenas.obtenerRetrato(id, EM.estado.expresionDe(estado, id)));
      f.appendChild(el("span", null, EM.PERSONAJES[id].nombre.split(" ")[0]));
      fotos.appendChild(f);
    });
    tablero.appendChild(fotos);
    var muro = el("div", "muro");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "hilos");
    muro.appendChild(svg);
    if (!estado.pistas.length) {
      muro.appendChild(el("p", "corcho-vacio", "El corcho está vacío. Las pruebas llegan cuando miras con cuidado."));
    }
    estado.pistas.forEach(function (pista, i) {
      var nota = el("article", "nota" + (pista.nueva ? " cae" : ""));
      nota.dataset.pista = pista.id;
      nota.style.transform = "rotate(" + ((i % 5) - 2) + "deg)";
      var cinta = el("span", "cinta");
      var pin = el("button", "pin");
      pin.type = "button";
      pin.setAttribute("aria-label", "Unir " + pista.titulo); pin.title = "Toca y luego elige una foto (o arrástralo). Toca un hilo para borrarlo.";
      nota.appendChild(cinta);
      nota.appendChild(pin);
      nota.appendChild(el("h3", null, pista.titulo));
      nota.appendChild(el("p", null, pista.texto));
      if (pista.senala) nota.appendChild(el("small", null, "Parece señalar a " + EM.PERSONAJES[pista.senala].nombre.split(" ")[0]));
      muro.appendChild(nota);
      pista.nueva = false;
      pin.addEventListener("click", function () {
        tablero.dataset.origen = tablero.dataset.origen === pista.id ? "" : pista.id;
        muro.querySelectorAll(".nota").forEach(function (n) {
          n.classList.toggle("origen", n.dataset.pista === tablero.dataset.origen);
        });
      });
    });
    fotos.querySelectorAll(".foto-sospecha").forEach(function (f) {
      f.addEventListener("click", function () {
        if (!tablero.dataset.origen) return;
        unir(estado, tablero.dataset.origen, f.dataset.sospecha);
        tablero.dataset.origen = "";
        dibujarHilos();
      });
    });
    tablero.appendChild(muro);
    capa.appendChild(tablero);

    function dibujarHilos() {
      svg.setAttribute("width", muro.clientWidth);
      svg.setAttribute("height", muro.clientHeight);
      svg.textContent = "";
      estado.hilos.forEach(function (h) {
        var a = muro.querySelector('[data-pista="' + h.pistaId + '"] .pin');
        var b = tablero.querySelector('[data-sospecha="' + h.quien + '"]');
        if (!a || !b) return;
        var pa = centro(a, muro);
        var pb = centro(b, muro);
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", pa.x);
        line.setAttribute("y1", pa.y);
        line.setAttribute("x2", pb.x);
        line.setAttribute("y2", pb.y);
        line.setAttribute("stroke", "#a3271f");
        line.setAttribute("stroke-width", "2");
        svg.appendChild(line);
        var golpe = document.createElementNS("http://www.w3.org/2000/svg", "line");
        ["x1", "y1", "x2", "y2"].forEach(function (k) { golpe.setAttribute(k, line.getAttribute(k)); });
        golpe.setAttribute("stroke", "transparent");
        golpe.setAttribute("stroke-width", "14");
        golpe.setAttribute("class", "hilo-golpe");
        golpe.addEventListener("click", function () {
          estado.hilos = estado.hilos.filter(function (x) { return !(x.pistaId === h.pistaId && x.quien === h.quien); });
          EM.audio.clic();
          dibujarHilos();
        });
        svg.appendChild(golpe);
      });
    }

    var moviendo = null;
    if (EM.ui._soltarHilo) window.removeEventListener("pointerup", EM.ui._soltarHilo);
    muro.addEventListener("pointerdown", function (e) {
      var pin = e.target.closest(".pin");
      if (!pin) return;
      moviendo = pin.parentElement.dataset.pista;
    });
    EM.ui._soltarHilo = function (e) {
      if (!moviendo || capa.hidden) return;
      var destino = document.elementFromPoint(e.clientX, e.clientY);
      var foto = destino && destino.closest ? destino.closest(".foto-sospecha") : null;
      if (foto) unir(estado, moviendo, foto.dataset.sospecha);
      moviendo = null;
      dibujarHilos();
    };
    window.addEventListener("pointerup", EM.ui._soltarHilo);
    requestAnimationFrame(dibujarHilos);
  }

  function unir(estado, pistaId, quien) {
    var antes = estado.hilos.length;
    estado.hilos = estado.hilos.filter(function (h) { return !(h.pistaId === pistaId && h.quien === quien); });
    if (estado.hilos.length === antes) estado.hilos.push({ pistaId: pistaId, quien: quien });
    EM.audio.clic();
  }

  function teoria(estado) {
    var quien = EM.PERSONAJES[estado.falsoCulpable];
    var pistas = estado.pistas.filter(function (p) { return p.senala === estado.falsoCulpable; });
    return new Promise(function (resolve) {
      var p = panel();
      p.textContent = "";
      var card = el("article", "retro sello-regular");
      card.appendChild(el("p", "resultado", "El expediente"));
      card.appendChild(el("h3", null, "Todo apunta a " + quien.nombre.split(" ")[0]));
      card.appendChild(el("p", "porque", "Tres papeles, recién pegados en el corcho, cuentan la misma historia. Conviene no creérsela entera."));
      pistas.forEach(function (pista) {
        card.appendChild(el("p", "diffs", pista.titulo + " — " + pista.texto));
      });
      var btn = el("button", "btn continuar", "Seguir");
      btn.type = "button";
      btn.addEventListener("click", function () { EM.ui._paso = null; resolve(); });
      card.appendChild(btn);
      p.appendChild(card);
      EM.ui._paso = function () { EM.ui._paso = null; resolve(); };
      EM.audio.susurro();
    });
  }

  function sabotajeCartel(s) {
    return cartel({
      kicker: "Sabotaje",
      titulo: s.titulo,
      texto: s.texto,
      boton: "Escuchar a Isabel"
    });
  }

  function salidaCartel(estado) {
    var id = estado.seFue;
    var nombre = EM.PERSONAJES[id].nombre;
    return cartel({
      kicker: "Silla vacía",
      titulo: nombre + " se fue",
      texto: "Dejó su lugar sin avisar. Sobre la mesa quedó una nota doblada.",
      nota: "«" + EM.NOTAS_SALIDA[id] + "»",
      boton: "Entrar a la sala"
    });
  }

  function iniciar() {
    EM.extras.iniciar();
    document.addEventListener("keydown", function (e) {
      if (e.key === "m" || e.key === "M") {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        e.preventDefault();
        EM.audio.alternarMudo();
        return;
      }
      if ((e.key === "d" || e.key === "D") && (EM.juego.fase === "titulo" || EM.juego.fase === "demo")) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        abrirDemo();
        return;
      }
      if ((e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5") && EM.ui._numeros) {
        if (e.target && e.target.tagName === "INPUT") return;
        e.preventDefault();
        EM.ui._numeros(Number(e.key));
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        if (e.target && e.target.classList && e.target.classList.contains("claqueta")) return;
        if (EM.ui._paso) {
          e.preventDefault();
          EM.ui._paso();
        }
      }
    });

    document.getElementById("btn-evidencias").addEventListener("click", function () {
      EM.audio.clic();
      abrirEvidencias();
    });
    document.getElementById("btn-sonido").addEventListener("click", function () {
      if (!EM.audio.estado.iniciado) EM.audio.habilitar();
      var pop = document.getElementById("popover-sonido");
      pop.hidden = !pop.hidden;
      refrescarSonido();
    });
    document.getElementById("btn-mudo").addEventListener("click", function () {
      EM.audio.alternarMudo();
    });
    document.getElementById("vol-musica").addEventListener("input", function (e) {
      EM.audio.setVolumen("musica", Number(e.target.value) / 100);
    });
    document.getElementById("vol-voz").addEventListener("input", function (e) {
      EM.audio.setVolumen("voz", Number(e.target.value) / 100);
    });
    document.addEventListener("click", function (e) {
      var pop = document.getElementById("popover-sonido");
      if (pop.hidden) return;
      if (pop.contains(e.target) || e.target.closest("#btn-sonido") || e.target.closest(".titulo-acciones")) return;
      pop.hidden = true;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") document.getElementById("popover-sonido").hidden = true;
    });
    refrescarSonido();
  }

  EM.ui = {
    iniciar: iniciar,
    vista: vista,
    panel: panel,
    asegurarPantalla: asegurarPantalla,
    hudVisible: hudVisible,
    actualizarHud: actualizarHud,
    refrescarSonido: refrescarSonido,
    temblor: temblor,
    corte: corte,
    ponerEscena: ponerEscena,
    montarDialogo: montarDialogo,
    pantallaCompleta: pantallaCompleta,
    encabezadoDecision: encabezadoDecision,
    opcion: opcion,
    elegir: elegir,
    pintarRetro: pintarRetro,
    cartel: cartel,
    esperarBoton: esperarBoton,
    avisoPista: avisoPista,
    mostrarTitulo: mostrarTitulo,
    mostrarCreditos: mostrarCreditos,
    abrirDemo: abrirDemo,
    abrirEvidencias: abrirEvidencias,
    teoria: teoria,
    sabotajeCartel: sabotajeCartel,
    salidaCartel: salidaCartel,
    _paso: null,
    _numeros: null
  };
})(typeof window !== "undefined" ? window : globalThis);
