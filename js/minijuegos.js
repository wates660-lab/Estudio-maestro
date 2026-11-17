(function (global) {
  var EM = global.EM = global.EM || {};

  function conservar(panel) {
    var decision = panel.querySelector(".decision");
    panel.textContent = "";
    if (decision) panel.appendChild(decision);
  }

  function boton(texto, clase) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = clase || "btn";
    b.textContent = texto;
    return b;
  }

  function repartir(vals, indice, nuevo) {
    nuevo = EM.util.clamp(Math.round(nuevo), 0, 100);
    var otros = [0, 1, 2, 3].filter(function (j) { return j !== indice; });
    var resto = 100 - nuevo;
    var suma = otros.reduce(function (s, j) { return s + vals[j]; }, 0);
    var acc = 0;
    otros.forEach(function (j, k) {
      if (k === otros.length - 1) vals[j] = resto - acc;
      else {
        vals[j] = suma ? Math.round(resto * vals[j] / suma) : Math.round(resto / otros.length);
        acc += vals[j];
      }
    });
    vals[indice] = nuevo;
    var ajuste = 100 - vals.reduce(function (s, n) { return s + n; }, 0);
    vals[otros[otros.length - 1]] += ajuste;
    if (vals[otros[otros.length - 1]] < 0) {
      vals[indice] += vals[otros[otros.length - 1]];
      vals[otros[otros.length - 1]] = 0;
    }
  }

  function organigrama() {
    return new Promise(function (resolve) {
      var panel = EM.ui.panel();
      var asig = {};
      EM.PUESTOS.forEach(function (p) { asig[p.id] = null; });
      var tomado = null;
      var orden = EM.util.barajar(EM.SOSPECHOSOS.slice(), Math.random);
      conservar(panel);
      var ayuda = document.createElement("p");
      ayuda.className = "ayuda";
      ayuda.textContent = EM.tactil ? "Toca a una persona y luego toca el puesto donde va. Si te equivocas, toca el puesto otra vez para soltarla." : "Arrastra a cada persona a un puesto, o selecciónala y luego el puesto. Las teclas 1 a 5 eligen a la persona si no hay otra captura.";
      var rejilla = document.createElement("div");
      rejilla.className = "org";
      var gente = document.createElement("div");
      gente.className = "org-gente";
      var puestos = document.createElement("div");
      puestos.className = "org-puestos";
      panel.appendChild(ayuda);
      panel.appendChild(rejilla);
      rejilla.appendChild(gente);
      rejilla.appendChild(puestos);

      function pintar() {
        gente.textContent = "";
        puestos.textContent = "";
        orden.forEach(function (id, indice) {
          if (Object.keys(asig).some(function (k) { return asig[k] === id; })) return;
          var ficha = document.createElement("button");
          ficha.type = "button";
          ficha.className = "ficha" + (tomado === id ? " sel" : "");
          ficha.textContent = (indice + 1) + ". " + EM.PERSONAJES[id].nombre;
          ficha.draggable = !EM.tactil;
          ficha.addEventListener("click", function () {
            tomado = tomado === id ? null : id;
            pintar();
          });
          ficha.addEventListener("dragstart", function (e) {
            e.dataTransfer.setData("text/plain", id);
            tomado = id;
          });
          gente.appendChild(ficha);
        });
        EM.PUESTOS.forEach(function (p) {
          var slot = document.createElement("button");
          slot.type = "button";
          slot.className = "slot";
          var tit = document.createElement("strong");
          tit.textContent = p.nombre;
          slot.appendChild(tit);
          var quien = document.createElement("span");
          quien.textContent = asig[p.id] ? EM.PERSONAJES[asig[p.id]].nombre : "Vacío";
          slot.appendChild(quien);
          slot.addEventListener("click", function () {
            if (tomado) {
              EM.PUESTOS.forEach(function (q) { if (asig[q.id] === tomado) asig[q.id] = null; });
              asig[p.id] = tomado;
              tomado = null;
              EM.audio.clic();
              pintar();
            } else if (asig[p.id]) {
              tomado = asig[p.id];
              asig[p.id] = null;
              pintar();
            }
          });
          slot.addEventListener("dragover", function (e) { e.preventDefault(); });
          slot.addEventListener("drop", function (e) {
            e.preventDefault();
            var id = e.dataTransfer.getData("text/plain");
            if (!id) return;
            EM.PUESTOS.forEach(function (q) { if (asig[q.id] === id) asig[q.id] = null; });
            asig[p.id] = id;
            tomado = null;
            EM.audio.clic();
            pintar();
          });
          puestos.appendChild(slot);
        });
        var listo = EM.PUESTOS.every(function (p) { return asig[p.id]; });
        var conf = boton("Cerrar organigrama", "btn continuar");
        conf.disabled = !listo;
        conf.addEventListener("click", function () {
          EM.ui._paso = null;
          EM.ui._numeros = null;
          resolve({ asignacion: Object.assign({}, asig) });
        });
        panel.appendChild(conf);
        var viejo = panel.querySelectorAll(".continuar");
        if (viejo.length > 1) viejo[0].remove();
      }

      EM.ui._numeros = function (n) {
        if (n >= 1 && n <= 5) {
          tomado = orden[n - 1];
          pintar();
        }
      };
      pintar();
    });
  }

  function presupuesto() {
    return new Promise(function (resolve) {
      var panel = EM.ui.panel();
      var vals = [15, 60, 25, 0];
      var nombres = ["Preproducción", "Rodaje", "Postproducción", "Imprevistos"];
      var claves = ["pre", "rodaje", "post", "impre"];
      conservar(panel);
      var caja = document.createElement("div");
      caja.className = "sliders";
      panel.appendChild(caja);
      var entradas = [];

      function pintarNumeros() {
        entradas.forEach(function (input, i) {
          input.value = String(vals[i]);
          input.parentElement.querySelector(".pct").textContent = vals[i] + "%";
        });
      }

      nombres.forEach(function (nombre, i) {
        var fila = document.createElement("label");
        fila.className = "slider";
        var et = document.createElement("span");
        et.textContent = nombre;
        var pct = document.createElement("span");
        pct.className = "pct";
        var input = document.createElement("input");
        input.type = "range";
        input.min = "0";
        input.max = "100";
        input.value = String(vals[i]);
        input.addEventListener("input", function () {
          repartir(vals, i, Number(input.value));
          pintarNumeros();
        });
        fila.appendChild(et);
        fila.appendChild(pct);
        fila.appendChild(input);
        caja.appendChild(fila);
        entradas.push(input);
      });
      pintarNumeros();
      var conf = boton("Cerrar presupuesto", "btn continuar");
      conf.addEventListener("click", function () {
        var o = {};
        claves.forEach(function (k, i) { o[k] = vals[i]; });
        resolve({ porcentajes: o });
      });
      panel.appendChild(conf);
    });
  }

  function reloj(crisis) {
    return new Promise(function (resolve) {
      var panel = EM.ui.panel();
      conservar(panel);
      var cerrado = false;
      var inicio = performance.now();
      var total = 10000;
      var dicho = {};
      var caja = document.createElement("div");
      caja.className = "reloj-caja";
      var num = document.createElement("p");
      num.className = "reloj-num";
      num.setAttribute("aria-live", "assertive");
      var texto = document.createElement("p");
      texto.className = "crisis-texto";
      texto.textContent = crisis.texto;
      caja.appendChild(num);
      caja.appendChild(texto);
      var barraT = document.createElement("div");
      barraT.className = "reloj-barra";
      var relleno = document.createElement("i");
      barraT.appendChild(relleno);
      caja.appendChild(barraT);
      panel.appendChild(caja);
      var ops = document.createElement("div");
      ops.className = "opciones";
      panel.appendChild(ops);
      EM.audio.setReloj(true);

      function segundos() {
        return Math.max(0, Math.ceil((total - (performance.now() - inicio)) / 1000));
      }

      function terminar(accion) {
        if (cerrado) return;
        cerrado = true;
        EM.audio.setReloj(false);
        EM.ui._numeros = null;
        EM.ui._paso = null;
        document.body.classList.remove("temblor");
        resolve(accion);
      }

      crisis.opciones.forEach(function (op, i) {
        var b = EM.ui.opcion(i, op.texto);
        b.addEventListener("click", function () {
          EM.audio.clic();
          terminar({ opcion: op.id, tiempoAgotado: false, segundos: segundos() });
        });
        ops.appendChild(b);
      });
      EM.ui._numeros = function (n) {
        var op = crisis.opciones[n - 1];
        if (op) terminar({ opcion: op.id, tiempoAgotado: false, segundos: segundos() });
      };

      function tick() {
        if (cerrado) return;
        var s = segundos();
        num.textContent = String(s);
        relleno.style.width = Math.max(0, 100 - (performance.now() - inicio) / total * 100) + "%";
        caja.classList.toggle("urgente", s <= 3);
        if (EM.RELOJ_VOZ[s] && !dicho[s]) {
          dicho[s] = true;
          EM.narradora.flash(EM.RELOJ_VOZ[s]);
          EM.audio.tictac();
        }
        if (s <= 3 && s > 0 && !EM.audio.poca()) document.body.classList.add("temblor");
        if (s <= 0) {
          var peor = crisis.opciones.filter(function (o) { return o.peor; })[0];
          terminar({ opcion: peor.id, tiempoAgotado: true, segundos: 0 });
          return;
        }
        requestAnimationFrame(tick);
      }
      tick();
    });
  }

  function dependencias() {
    return new Promise(function (resolve) {
      var panel = EM.ui.panel();
      var orden = EM.util.barajar(EM.TAREAS.map(function (t) { return t.id; }), Math.random);
      conservar(panel);
      var lista = document.createElement("ol");
      lista.className = "tareas";
      panel.appendChild(lista);
      var arrastre = null;

      function nombre(id) {
        for (var i = 0; i < EM.TAREAS.length; i++) if (EM.TAREAS[i].id === id) return EM.TAREAS[i];
        return null;
      }

      function mover(i, dir) {
        var j = i + dir;
        if (j < 0 || j >= orden.length) return;
        var t = orden[i];
        orden[i] = orden[j];
        orden[j] = t;
        pintar();
      }

      function pintar() {
        lista.textContent = "";
        orden.forEach(function (id, i) {
          var t = nombre(id);
          var li = document.createElement("li");
          li.draggable = !EM.tactil;
          li.addEventListener("dragstart", function () { arrastre = i; });
          li.addEventListener("dragover", function (e) { e.preventDefault(); });
          li.addEventListener("drop", function (e) {
            e.preventDefault();
            if (arrastre == null || arrastre === i) return;
            var item = orden.splice(arrastre, 1)[0];
            orden.splice(i, 0, item);
            arrastre = null;
            pintar();
          });
          var txt = document.createElement("div");
          var fuerte = document.createElement("strong");
          fuerte.textContent = t.nombre;
          txt.appendChild(fuerte);
          if (t.deps.length) {
            var dep = document.createElement("small");
            dep.textContent = "Después de: " + t.deps.map(function (d) { return nombre(d).nombre; }).join(", ");
            txt.appendChild(dep);
          }
          var controles = document.createElement("div");
          controles.className = "sube-baja";
          var up = boton("Subir", "btn mini");
          var down = boton("Bajar", "btn mini");
          up.addEventListener("click", function () { mover(i, -1); });
          down.addEventListener("click", function () { mover(i, 1); });
          controles.appendChild(up);
          controles.appendChild(down);
          li.appendChild(txt);
          li.appendChild(controles);
          lista.appendChild(li);
        });
      }
      pintar();
      var conf = boton("Cerrar el orden", "btn continuar");
      conf.addEventListener("click", function () { resolve({ orden: orden.slice() }); });
      panel.appendChild(conf);
    });
  }

  function kpis() {
    return new Promise(function (resolve) {
      var panel = EM.ui.panel();
      conservar(panel);
      var cerrado = false;
      var inicio = performance.now();
      var total = 18000;
      var tabla = document.createElement("table");
      tabla.className = "kpis";
      var head = document.createElement("tr");
      ["Concepto", "Planeado", "Real", "Nota"].forEach(function (h) {
        var th = document.createElement("th");
        th.textContent = h;
        head.appendChild(th);
      });
      tabla.appendChild(head);
      var reloj = document.createElement("p");
      reloj.className = "reloj-num chico";
      panel.appendChild(reloj);
      panel.appendChild(tabla);
      EM.audio.setReloj(true);

      function terminar(linea) {
        if (cerrado) return;
        cerrado = true;
        EM.audio.setReloj(false);
        var seg = Math.max(0, Math.ceil((total - (performance.now() - inicio)) / 1000));
        resolve({ linea: linea, segundos: linea ? seg : 0 });
      }

      EM.LINEAS_GASTO.forEach(function (linea) {
        var tr = document.createElement("tr");
        [linea.concepto, EM.util.mxn(linea.planeado), EM.util.mxn(linea.real), linea.nota].forEach(function (valor) {
          var td = document.createElement("td");
          td.textContent = valor;
          tr.appendChild(td);
        });
        tr.tabIndex = 0;
        tr.addEventListener("click", function () {
          EM.audio.clic();
          terminar(linea.id);
        });
        tr.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            terminar(linea.id);
          }
        });
        tabla.appendChild(tr);
      });

      function tick() {
        if (cerrado) return;
        var s = Math.max(0, Math.ceil((total - (performance.now() - inicio)) / 1000));
        reloj.textContent = String(s);
        if (s <= 0) terminar(null);
        else requestAnimationFrame(tick);
      }
      tick();
    });
  }

  function dibujarGantt(panel) {
    var caja = document.createElement("div");
    caja.className = "gantt";
    var tope = 70;
    EM.GANTT.forEach(function (fila) {
      var row = document.createElement("div");
      row.className = "gantt-fila" + (fila.critica ? " critica" : "") + (fila.atraso ? " atraso" : "");
      var nom = document.createElement("span");
      nom.textContent = fila.nombre + (fila.critica ? " · crítica" : "");
      var pista = document.createElement("div");
      pista.className = "pista-gantt";
      var barra = document.createElement("i");
      barra.style.left = (fila.inicio / tope * 100) + "%";
      barra.style.width = ((fila.fin - fila.inicio) / tope * 100) + "%";
      pista.appendChild(barra);
      var meta = document.createElement("b");
      meta.className = "meta-gantt";
      meta.style.left = (60 / tope * 100) + "%";
      pista.appendChild(meta);
      row.appendChild(nom);
      row.appendChild(pista);
      caja.appendChild(row);
    });
    var ley = document.createElement("p");
    ley.className = "ayuda";
    ley.textContent = "La línea vertical es la fecha de Claudia. Lo que la cruza ya va tarde.";
    panel.appendChild(caja);
    panel.appendChild(ley);
  }

  EM.minijuegos = {
    organigrama: organigrama,
    presupuesto: presupuesto,
    reloj: reloj,
    dependencias: dependencias,
    kpis: kpis,
    dibujarGantt: dibujarGantt
  };
})(typeof window !== "undefined" ? window : globalThis);
