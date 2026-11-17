(function (global) {
  var EM = global.EM = global.EM || {};
  var cacheNo = {};
  var sinArte = {};

  function R(x, y, w, h, f, ex) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '" ' + (ex || "") + "/>";
  }
  function C(cx, cy, r, f, ex) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '" ' + (ex || "") + "/>";
  }
  function P(d, f, ex) {
    return '<path d="' + d + '" fill="' + f + '" ' + (ex || "") + "/>";
  }
  function L(x1, y1, x2, y2, s, w, ex) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + s + '" stroke-width="' + (w || 2) + '" ' + (ex || "") + "/>";
  }
  function T(x, y, txt, size, fill, ex) {
    return '<text x="' + x + '" y="' + y + '" font-family="Special Elite, Courier New, monospace" font-size="' + size + '" fill="' + fill + '" ' + (ex || "") + ">" + txt + "</text>";
  }
  function grad(id, c1, o1, c2, o2, horizontal) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (horizontal ? 1 : 0) + '" y2="' + (horizontal ? 0 : 1) + '">' +
      '<stop offset="0" stop-color="' + c1 + '" stop-opacity="' + o1 + '"/><stop offset="1" stop-color="' + c2 + '" stop-opacity="' + o2 + '"/></linearGradient>';
  }
  function envolver(defs, cuerpo) {
    return '<svg class="fondo" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' + defs + "</defs>" + cuerpo + "</svg>";
  }
  function envolverFrente(defs, cuerpo) {
    return '<svg class="frente" viewBox="0 0 1200 640" preserveAspectRatio="none" aria-hidden="true"><defs>' + defs + "</defs>" + cuerpo + "</svg>";
  }
  function manecilla(cx, cy, grados, largo, ancho) {
    var a = (grados - 90) * Math.PI / 180;
    return L(cx, cy, (cx + Math.cos(a) * largo).toFixed(1), (cy + Math.sin(a) * largo).toFixed(1), "#ece3d0", ancho, 'stroke-linecap="round"');
  }

  function archivoExpresion(personaje, expresion) {
    if (personaje === "isabel") return "neutral";
    if (personaje === "claudia") {
      if (expresion === "contento" || expresion === "contenta") return "contenta";
      if (expresion === "molesto" || expresion === "molesta" || expresion === "culpable") return "molesta";
      return "neutral";
    }
    if (["neutral", "contento", "molesto", "culpable"].indexOf(expresion) < 0) return "neutral";
    return expresion;
  }

  var ARTE = {
    isabel: {
      piel: "#d2b093", cuello: "#a9876c", ceja: "#14100d", labio: "#6a2a24",
      atras: P("M80 150 Q74 76 150 72 Q226 76 220 150 L232 340 L68 340 Z", "#14100d"),
      ropaExtra:
        P("M96 242 L124 214 L150 262 L176 214 L204 242 L150 330 Z", "#1b1714") +
        P("M126 214 L150 262 L174 214 L150 232 Z", "#e8dfce", 'opacity=".9"') +
        L(150, 262, 150, 420, "rgba(0,0,0,.35)", 3),
      frente:
        P("M150 80 Q98 88 98 154 Q104 118 150 102 Q196 118 202 154 Q202 88 150 80 Z", "#14100d"),
      acc:
        P("M96 144 Q150 34 204 144", "none", 'stroke="#14110e" stroke-width="7" stroke-linecap="round"') +
        '<rect x="84" y="136" width="18" height="34" rx="7" fill="#1b1917" stroke="#f2a33a" stroke-width="2"/>' +
        P("M92 168 Q96 200 126 204", "none", 'stroke="#14110e" stroke-width="4" stroke-linecap="round"') +
        C(128, 204, 6, "#1b1917", 'stroke="#f2a33a" stroke-width="2"')
    },
    claudia: {
      piel: "#e5bf9f", cuello: "#bf9577", ceja: "#2a1a12", labio: "#b03a2e",
      atras: P("M80 152 Q78 84 150 76 Q222 84 220 152 L226 232 L186 232 L186 156 L114 156 L114 232 L74 232 Z", "#2a1a12"),
      ropaExtra:
        P("M104 240 L150 316 L126 420 L82 420 Z", "rgba(0,0,0,.28)") +
        P("M196 240 L150 316 L174 420 L218 420 Z", "rgba(0,0,0,.28)") +
        P("M124 240 L150 308 L176 240 Z", "#14110e") +
        [0, 1, 2, 3, 4, 5, 6].map(function (i) { return C(112 + i * 12.7, 262 + Math.sin(i / 6 * Math.PI) * 24, 4.2, "#f4ede0"); }).join(""),
      frente:
        P("M98 132 Q150 78 204 132 Q176 108 150 110 Q124 108 98 132 Z", "#2a1a12"),
      acc:
        '<ellipse cx="128" cy="96" rx="22" ry="11" fill="#14110e" stroke="#3a342c" stroke-width="2"/>' +
        '<ellipse cx="172" cy="96" rx="22" ry="11" fill="#14110e" stroke="#3a342c" stroke-width="2"/>' +
        L(150, 96, 150, 96, "#3a342c", 3) + L(148, 94, 152, 94, "#3a342c", 3) +
        P("M114 92 Q124 88 136 92", "none", 'stroke="rgba(255,255,255,.3)" stroke-width="2"')
    },
    maria: {
      piel: "#c58b66", cuello: "#9b6a4c", ceja: "#1c1411", labio: "#6f2218",
      atras:
        P("M82 150 Q66 250 60 340 L112 340 L112 200 Z", "#1c1411") +
        P("M218 150 Q234 250 240 340 L188 340 L188 200 Z", "#1c1411") +
        '<ellipse cx="150" cy="142" rx="66" ry="76" fill="#1c1411"/>',
      ropaExtra:
        P("M104 238 L150 330 L130 420 L88 420 Z", "rgba(0,0,0,.34)") +
        P("M196 238 L150 330 L170 420 L212 420 Z", "rgba(0,0,0,.34)") +
        P("M124 242 Q150 266 176 242 L172 268 Q150 284 128 268 Z", "#1b1411"),
      frente:
        P("M98 140 Q102 84 150 80 Q202 84 204 140 Q188 110 158 108 Q128 108 98 140 Z", "#1c1411") +
        "",
      acc:
        C(99, 178, 4.5, "#f2a33a") + C(201, 178, 4.5, "#f2a33a") +
        L(196, 112, 242, 64, "#c4a574", 5, 'stroke-linecap="round"') +
        L(236, 70, 244, 62, "#a3271f", 6, 'stroke-linecap="round"')
    },
    luis: {
      piel: "#b27a58", cuello: "#8a5b3e", ceja: "#2d2016", labio: "#5a2a1e",
      atras: "",
      ropaExtra:
        P("M64 286 Q150 226 236 286 L236 306 Q150 262 64 306 Z", "#a98a5c") +
        L(142, 268, 140, 340, "#ece3d0", 3, 'stroke-linecap="round"') +
        L(158, 268, 160, 340, "#ece3d0", 3, 'stroke-linecap="round"') +
        P("M92 234 Q150 304 208 234", "none", 'stroke="#14110e" stroke-width="10" stroke-linecap="round"') +
        '<rect x="78" y="224" width="24" height="38" rx="8" fill="#1b1917" stroke="#f2a33a" stroke-width="2"/>' +
        '<rect x="198" y="224" width="24" height="38" rx="8" fill="#1b1917" stroke="#f2a33a" stroke-width="2"/>',
      frente:
        P("M98 132 Q96 82 150 78 Q206 82 204 132 Q190 104 150 102 Q112 104 98 132 Z", "#3a2a1c") +
        P("M118 92 L130 68 L144 92 Z", "#3a2a1c") + P("M150 86 L166 64 L176 92 Z", "#3a2a1c"),
      acc:
        P("M102 172 Q150 234 198 172 Q190 214 150 216 Q110 214 102 172 Z", "rgba(0,0,0,.2)") +
        '<rect x="106" y="139" width="40" height="27" rx="7" fill="rgba(255,255,255,.06)" stroke="#14110e" stroke-width="3.5"/>' +
        '<rect x="154" y="139" width="40" height="27" rx="7" fill="rgba(255,255,255,.06)" stroke="#14110e" stroke-width="3.5"/>' +
        L(146, 150, 154, 150, "#14110e", 3.5)
    },
    rey: {
      piel: "#8a5a40", cuello: "#6a4330", ceja: "#100d0b", labio: "#44211a",
      atras: "",
      ropaExtra:
        P("M126 238 L150 300 L174 238 Z", "#ece3d0") +
        P("M126 238 L146 258 L132 272 Z", "#d9cfb9") + P("M174 238 L154 258 L168 272 Z", "#d9cfb9") +
        P("M146 262 L154 262 L158 330 L150 346 L142 330 Z", "#a3271f") +
        L(100, 244, 144, 340, "rgba(0,0,0,.4)", 3) + L(200, 244, 156, 340, "rgba(0,0,0,.4)", 3) +
        C(118, 302, 5, "#f2a33a") + R(214, 318, 18, 44, "#14110e", 'rx="2"') + R(218, 312, 3, 12, "#f2a33a"),
      frente:
        P("M98 134 Q100 80 152 80 Q204 82 204 134 Q192 98 150 98 Q116 98 98 134 Z", "#141010") +
        P("M112 94 Q150 84 190 96", "none", 'stroke="rgba(255,255,255,.16)" stroke-width="3"'),
      acc:
        P("M102 176 Q150 236 198 176 Q192 212 150 214 Q108 212 102 176 Z", "rgba(0,0,0,.14)")
    },
    monica: {
      piel: "#e1b899", cuello: "#b98f72", ceja: "#4a2f1c", labio: "#8a3a30",
      atras: C(150, 66, 28, "#5a3b24"),
      ropaExtra:
        P("M120 240 Q150 272 180 240 L176 264 Q150 286 124 264 Z", "#f4ede0") +
        L(150, 292, 150, 420, "rgba(0,0,0,.25)", 3) +
        C(150, 318, 4.5, "#8a7550") + C(150, 356, 4.5, "#8a7550") + C(150, 394, 4.5, "#8a7550"),
      frente:
        P("M98 128 Q96 82 150 80 Q204 82 202 128 Q190 108 150 106 Q110 108 98 128 Z", "#5a3b24"),
      acc:
        L(170, 62, 216, 34, "#f2a33a", 6, 'stroke-linecap="round"') + L(212, 36, 220, 31, "#14110e", 5, 'stroke-linecap="round"') +
        '<circle cx="128" cy="152" r="17" fill="rgba(255,255,255,.05)" stroke="#c4973a" stroke-width="3.2"/>' +
        '<circle cx="172" cy="152" r="17" fill="rgba(255,255,255,.05)" stroke="#c4973a" stroke-width="3.2"/>' +
        L(145, 150, 155, 150, "#c4973a", 3)
    },
    theo: {
      piel: "#d09a76", cuello: "#a67553", ceja: "#2a1d14", labio: "#6a3226",
      atras: "",
      ropaExtra:
        L(96, 248, 214, 404, "rgba(20,17,14,.62)", 14, 'stroke-linecap="round"') +
        P("M130 238 L150 332 L170 238", "none", 'stroke="#a3271f" stroke-width="5" stroke-linejoin="round"') +
        R(136, 326, 28, 38, "#ece3d0", 'rx="4"') + R(142, 334, 16, 4, "#14110e") + R(142, 342, 12, 3, "rgba(0,0,0,.4)"),
      frente:
        P("M92 130 Q94 68 150 64 Q206 68 208 130 Q150 116 92 130 Z", "#2b2f2c") +
        R(92, 112, 116, 22, "#3a403c", 'rx="9"') +
        P("M94 134 Q92 150 99 160 Q104 148 106 134 Z", "#2a1d14") +
        P("M206 134 Q208 150 201 160 Q196 148 194 134 Z", "#2a1d14"),
      acc:
        C(132, 176, 1.8, "rgba(0,0,0,.28)") + C(140, 180, 1.8, "rgba(0,0,0,.28)") + C(168, 180, 1.8, "rgba(0,0,0,.28)") + C(176, 176, 1.8, "rgba(0,0,0,.28)")
    }
  };

  function silueta(personaje, expresion) {
    var p = EM.PERSONAJES[personaje];
    var a = ARTE[personaje] || ARTE.isabel;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 300 420");
    svg.setAttribute("class", "silueta");
    svg.setAttribute("aria-hidden", "true");
    var lab = a.labio;
    svg.innerHTML =
      (a.atras || "") +
      P("M18 420 L24 322 Q34 258 104 238 L196 238 Q266 258 276 322 L282 420 Z", p.color) +
      P("M150 238 L276 322 L282 420 L150 420 Z", "rgba(0,0,0,.22)") +
      (a.ropaExtra || "") +
      P("M18 420 L24 322 Q34 258 104 238", "none", 'stroke="rgba(255,255,255,.22)" stroke-width="2.5"') +
      P("M126 196 L126 246 Q150 266 174 246 L174 196 Z", a.cuello) +
      '<ellipse cx="98" cy="158" rx="9" ry="15" fill="' + a.piel + '"/><ellipse cx="202" cy="158" rx="9" ry="15" fill="' + a.piel + '"/>' +
      '<g class="cabeza">' +
      '<ellipse cx="150" cy="150" rx="52" ry="62" fill="' + a.piel + '"/>' +
      P("M150 88 C190 88 204 130 202 156 C200 186 180 212 150 212 C170 180 172 120 150 88 Z", "rgba(0,0,0,.2)") +
      '<ellipse class="tinte" cx="150" cy="150" rx="52" ry="62" fill="rgba(163,39,31,.2)"/>' +
      '<g class="ojos">' +
      '<g class="ojo-normal"><ellipse cx="128" cy="153" rx="9" ry="6.5" fill="#f4ede0"/><ellipse cx="172" cy="153" rx="9" ry="6.5" fill="#f4ede0"/>' +
      '<g class="pupilas"><circle cx="128" cy="153" r="4.4" fill="#1b1411"/><circle cx="172" cy="153" r="4.4" fill="#1b1411"/>' +
      '<circle cx="130" cy="151" r="1.4" fill="#fff"/><circle cx="174" cy="151" r="1.4" fill="#fff"/></g></g>' +
      '<g class="ojo-feliz"><path d="M118 155 Q128 143 138 155" fill="none" stroke="#1b1411" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M162 155 Q172 143 182 155" fill="none" stroke="#1b1411" stroke-width="3.4" stroke-linecap="round"/></g>' +
      "</g>" +
      '<rect class="ceja ceja-izq" x="111" y="131" width="31" height="6" rx="3" fill="' + a.ceja + '"/>' +
      '<rect class="ceja ceja-der" x="158" y="131" width="31" height="6" rx="3" fill="' + a.ceja + '"/>' +
      '<path d="M150 158 Q145 174 153 176" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path class="boca boca-neutral" d="M135 192 Q150 195 165 192" fill="none" stroke="' + lab + '" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path class="boca boca-feliz" d="M131 188 Q150 208 169 188 Z" fill="#f4ede0" stroke="' + lab + '" stroke-width="3.6" stroke-linejoin="round"/>' +
      '<path class="boca boca-enojo" d="M135 199 Q150 186 165 199" fill="none" stroke="' + lab + '" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path class="boca boca-culpa" d="M138 197 Q146 190 154 197 T166 195" fill="none" stroke="' + lab + '" stroke-width="3.6" stroke-linecap="round"/>' +
      (a.acc || "") +
      (a.frente || "") +
      P("M204 112 Q214 128 204 138 Q196 126 204 112 Z", "#7fc4e8", 'class="sudor" opacity=".9"') +
      "</g>";
    svg.setAttribute("data-exp", expresion);
    return svg;
  }

  function obtenerRetrato(personaje, expresion) {
    var exp = archivoExpresion(personaje, expresion);
    var wrap = document.createElement("div");
    wrap.className = "retrato exp-" + exp + " pj-" + personaje;
    wrap.appendChild(silueta(personaje, exp));
    var p = EM.PERSONAJES[personaje];
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", p.nombre + ", " + p.rol);
    if (sinArte[personaje]) return wrap;
    var url = "assets/personajes/" + personaje + "_" + exp + ".png";
    if (cacheNo[url]) return wrap;
    var img = new Image();
    img.alt = p.nombre;
    img.onload = function () {
      wrap.textContent = "";
      wrap.classList.add("con-arte");
      wrap.appendChild(img);
    };
    img.onerror = function () {
      cacheNo[url] = true;
      if (exp === "neutral") sinArte[personaje] = true;
    };
    img.src = url;
    return wrap;
  }

  function lampara(x, enc) {
    return L(x, 0, x, 70, "#050403", 2) +
      P("M" + (x - 34) + " 96 L" + (x - 14) + " 70 L" + (x + 14) + " 70 L" + (x + 34) + " 96 Z", "#1d1713", 'stroke="#3a2c1e" stroke-width="2"') +
      (enc ? C(x, 100, 7, "#ffe1ae") + C(x, 100, 18, "rgba(255,210,140,.25)") : C(x, 100, 6, "#2a241c"));
  }

  function fondoJuntas(n) {
    var defs = grad("j-pared", n ? "#0c0b0d" : "#241c14", 1, n ? "#050405" : "#0d0a08", 1) +
      grad("j-cielo", n ? "#18284a" : "#dcb877", 1, n ? "#080c16" : "#6e5638", 1) +
      grad("j-cono", "#ffc977", n ? 0.55 : 0.3, "#ffc977", 0);
    var s = R(0, 0, 1200, 640, "url(#j-pared)");
    var i;
    for (i = 0; i < 12; i++) s += R(i * 100, 0, 2, 450, "rgba(255,255,255,.03)");
    s += R(0, 372, 1200, 8, "#3a2c1e") + R(0, 380, 1200, 110, "rgba(0,0,0,.38)");

    s += R(70, 60, 300, 210, "url(#j-cielo)", 'stroke="#3a2c1e" stroke-width="8"');
    if (n) {
      var alt = [50, 92, 62, 124, 72, 102, 56, 84];
      for (i = 0; i < alt.length; i++) {
        s += R(78 + i * 36, 262 - alt[i], 30, alt[i], "#080c16");
        for (var k = 0; k < Math.floor(alt[i] / 18); k++) if ((i + k) % 3 !== 0) s += R(84 + i * 36 + (k % 2) * 12, 252 - k * 17, 4, 5, "#f2a33a", 'opacity=".75"');
      }
      s += C(330, 104, 16, "rgba(236,227,208,.85)") + C(324, 100, 14, "#16233d");
    } else {
      s += C(300, 120, 46, "rgba(255,230,170,.35)");
      for (i = 0; i < 14; i++) s += R(72, 70 + i * 14, 296, 6, "rgba(20,14,8,.5)");
    }
    s += R(168, 60, 6, 210, "#3a2c1e") + R(268, 60, 6, 210, "#3a2c1e") + R(70, 163, 300, 6, "#3a2c1e");

    s += R(820, 70, 300, 180, "#0b0a09", 'stroke="#2a241c" stroke-width="6"');
    if (n) {
      s += T(970, 166, "SIN SEÑAL", 16, "rgba(236,227,208,.22)", 'text-anchor="middle"');
    } else {
      for (var f = 0; f < 6; f++) {
        var cx = 836 + (f % 3) * 96, cy = 86 + Math.floor(f / 3) * 74;
        s += R(cx, cy, 88, 64, "rgba(242,163,58,.12)", 'stroke="rgba(236,227,208,.28)"');
        s += C(cx + 44, cy + 28, 10, "rgba(242,163,58,.55)") + R(cx + 12, cy + 46, 64, 4, "rgba(236,227,208,.3)");
      }
      s += T(970, 62, "STORYBOARD · ESC 12", 13, "rgba(236,227,208,.45)", 'text-anchor="middle"');
    }

    s += R(470, 70, 64, 92, "#2a1c14", 'stroke="#3a2c1e" stroke-width="3"') + R(480, 84, 44, 6, "rgba(242,163,58,.7)") + R(480, 98, 30, 4, "rgba(236,227,208,.35)") + C(502, 130, 14, "rgba(163,39,31,.7)");
    s += R(666, 70, 64, 92, "#1c2420", 'stroke="#3a2c1e" stroke-width="3"') + R(676, 84, 44, 6, "rgba(236,227,208,.5)") + R(676, 98, 36, 4, "rgba(242,163,58,.5)") + C(698, 130, 14, "rgba(111,143,114,.7)");
    s += C(600, 112, 32, "#14110e", 'stroke="#f2a33a" stroke-width="3"');
    for (i = 0; i < 12; i++) {
      var ang = i * 30 * Math.PI / 180;
      s += L((600 + Math.sin(ang) * 26).toFixed(1), (112 - Math.cos(ang) * 26).toFixed(1), (600 + Math.sin(ang) * 29).toFixed(1), (112 - Math.cos(ang) * 29).toFixed(1), "rgba(236,227,208,.6)", 1.5);
    }
    s += n ? manecilla(600, 112, 358, 24, 2) + manecilla(600, 112, 2, 17, 3.2) : manecilla(600, 112, 60, 24, 2) + manecilla(600, 112, 95, 17, 3.2);
    s += C(600, 112, 3, "#f2a33a");

    [400, 600, 800].forEach(function (x) {
      var enc = !n || x === 600;
      s += lampara(x, enc);
      if (enc) s += P("M" + (x - 24) + " 102 L" + (x + 24) + " 102 L" + (x + 190) + " 462 L" + (x - 190) + " 462 Z", "url(#j-cono)");
    });
    s += R(0, 470, 1200, 170, "#0d0a08");
    return envolver(defs, s);
  }

  function mesaJuntas(n) {
    var defs = grad("m-madera", "#43321f", 1, "#1b130d", 1) + grad("m-brillo", "#ffd9a0", n ? 0.2 : 0.1, "#ffd9a0", 0);
    var s = P("M60 448 L1140 448 L1230 640 L-30 640 Z", "url(#m-madera)") +
      L(60, 448, 1140, 448, "#7a5636", 3) +
      P("M230 470 L970 470 L1050 530 L150 530 Z", "url(#m-brillo)") +
      '<ellipse cx="600" cy="520" rx="300" ry="34" fill="rgba(242,163,58,' + (n ? ".22" : ".1") + ')"/>';

    [[130, 470], [940, 470]].forEach(function (p) {
      s += P("M" + p[0] + " " + p[1] + " L" + (p[0] + 120) + " " + p[1] + " L" + (p[0] + 128) + " " + (p[1] + 56) + " L" + (p[0] - 8) + " " + (p[1] + 56) + " Z", "#1b1917", 'stroke="#4a4036" stroke-width="2"') +
        C(p[0] + 60, p[1] + 26, 6, "rgba(242,163,58,.7)");
    });

    s += R(300, 548, 86, 56, "#e7dec4", 'transform="rotate(-7 343 576)" opacity=".92"') + R(318, 560, 56, 4, "rgba(0,0,0,.25)", 'transform="rotate(-7 343 576)"') +
      R(780, 552, 80, 52, "#d6c7a2", 'transform="rotate(5 820 578)" opacity=".92"') +
      '<ellipse cx="900" cy="560" rx="22" ry="9" fill="#ece3d0"/><ellipse cx="900" cy="558" rx="16" ry="6" fill="#3a1d12"/>' +
      R(690, 566, 70, 40, "#a3271f", 'rx="3" transform="rotate(-3 725 586)"') + T(725, 592, "GUION", 12, "#ece3d0", 'text-anchor="middle" transform="rotate(-3 725 586)"');

    s += P("M500 640 L500 596 Q500 548 548 548 L652 548 Q700 548 700 596 L700 640 Z", "#120e0b", 'stroke="#2e251c" stroke-width="3"') +
      P("M520 640 L520 600 Q520 566 552 566 L648 566 Q680 566 680 600 L680 640 Z", "rgba(255,255,255,.04)") +
      L(540, 556, 660, 556, "rgba(255,220,170,.18)", 3);
    return envolverFrente(defs, s);
  }

  function fondoSet() {
    var defs = '<radialGradient id="s-cicl" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#4a3c2c"/><stop offset=".6" stop-color="#211a14"/><stop offset="1" stop-color="#0c0a08"/></radialGradient>' +
      grad("s-c1", "#ffc977", 0.34, "#ffc977", 0) + grad("s-c2", "#a8c2d6", 0.22, "#a8c2d6", 0) + grad("s-c3", "#ff7a5a", 0.2, "#ff7a5a", 0);
    var s = R(0, 0, 1200, 640, "url(#s-cicl)");
    s += R(0, 44, 1200, 14, "#16130f") + R(0, 58, 1200, 4, "#2a241c");
    for (var i = 0; i < 24; i++) s += L(i * 52, 46, i * 52 + 26, 58, "#2a241c", 2) + L(i * 52 + 26, 58, i * 52 + 52, 46, "#2a241c", 2);
    [[170, "s-c1"], [450, "s-c2"], [760, "s-c1"], [1040, "s-c3"]].forEach(function (l) {
      s += R(l[0] - 26, 62, 52, 36, "#1b1917", 'stroke="#4a4036" stroke-width="2"') + R(l[0] - 18, 98, 36, 8, "#ffe1ae") +
        P("M" + (l[0] - 18) + " 104 L" + (l[0] + 18) + " 104 L" + (l[0] + 220) + " 560 L" + (l[0] - 220) + " 560 Z", "url(#" + l[1] + ")");
    });

    s += '<g transform="translate(980,270)">' + R(0, 0, 96, 58, "#14110e", 'rx="6" stroke="#6a5e4f" stroke-width="2"') + R(-18, 14, 20, 28, "#0a0908", 'rx="3"') +
      P("M96 14 L136 0 L136 58 L96 44 Z", "#1b1917", 'stroke="#6a5e4f" stroke-width="2"') + C(112, 30, 8, "#2a3a46") +
      L(48, 58, 20, 200, "#3a342c", 5) + L(48, 58, 78, 200, "#3a342c", 5) + L(48, 58, 48, 200, "#3a342c", 5) + "</g>";

    s += R(70, 380, 120, 70, "#2a2118", 'stroke="#4a3a28" stroke-width="2"') + R(86, 346, 88, 34, "#14110e", 'stroke="#ece3d0" stroke-width="2"') +
      P("M86 346 L174 332 L174 346 L86 360 Z", "#ece3d0") + [0, 1, 2, 3].map(function (k) { return P("M" + (92 + k * 20) + " 345 L" + (104 + k * 20) + " 343 L" + (96 + k * 20) + " 357 L" + (88 + k * 20) + " 358 Z", "#14110e"); }).join("");

    s += R(1070, 160, 84, 30, "#100d0b", 'rx="3" stroke="#a3271f" stroke-width="2"') + '<circle class="rec" cx="1090" cy="175" r="7" fill="#d8402f"/>' + T(1106, 181, "REC", 16, "#d8402f");
    s += R(0, 490, 1200, 150, "#0b0907");
    return envolver(defs, s);
  }

  function frenteSet() {
    var s = P("M-20 572 C 200 540, 420 600, 700 556 S 1120 580, 1230 548", "none", 'stroke="#050403" stroke-width="18" stroke-linecap="round"') +
      P("M-20 570 C 200 538, 420 598, 700 554 S 1120 578, 1230 546", "none", 'stroke="#2a241c" stroke-width="3" stroke-linecap="round"') +
      R(0, 612, 1200, 28, "rgba(0,0,0,.6)");
    return envolverFrente("", s);
  }

  function fondoEdicion() {
    var defs = grad("e-fondo", "#0a0e14", 1, "#06080b", 1) +
      '<radialGradient id="e-glow" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#6f9fc0" stop-opacity=".28"/><stop offset="1" stop-color="#6f9fc0" stop-opacity="0"/></radialGradient>';
    var s = R(0, 0, 1200, 640, "url(#e-fondo)") + R(0, 0, 1200, 640, "url(#e-glow)");

    s += R(70, 70, 360, 230, "#0d141b", 'stroke="#2a3a46" stroke-width="5" rx="6"');
    var cols = ["#f2a33a", "#6f8f72", "#a3271f", "#6f9fc0"];
    for (var r = 0; r < 5; r++) {
      for (var k = 0; k < 4; k++) {
        var w = 40 + ((r * 37 + k * 53) % 70);
        var x = 90 + ((k * 83 + r * 29) % 180);
        s += R(x, 100 + r * 34, w, 22, cols[(r + k) % 4], 'opacity=".72" rx="2"');
      }
    }
    s += R(262, 90, 3, 200, "#ff5a48") + T(90, 88, "V1 V2 A1 A2 A3", 11, "rgba(236,227,208,.5)");

    s += R(470, 60, 360, 250, "#0d141b", 'stroke="#2a3a46" stroke-width="5" rx="6"') + R(486, 92, 328, 184, "#171f27") +
      P("M486 92 H814 V276 H486 Z", "rgba(111,159,192,.12)") + R(486, 92, 328, 20, "#000") + R(486, 256, 328, 20, "#000") +
      C(650, 190, 30, "rgba(242,163,58,.55)") + P("M620 232 Q650 196 680 232 Z", "rgba(236,227,208,.4)") +
      T(500, 80, "01:12:08:14", 15, "#6f9fc0") + C(800, 76, 5, "#ff5a48");

    s += R(870, 70, 260, 230, "#0d141b", 'stroke="#2a3a46" stroke-width="5" rx="6"') +
      P("M884 150 L900 120 L916 176 L932 110 L948 190 L964 130 L980 168 L996 118 L1012 184 L1028 126 L1044 160 L1060 124 L1076 170 L1092 140 L1116 150", "none", 'stroke="#6f8f72" stroke-width="2.5"');
    for (var b = 0; b < 12; b++) s += R(890 + b * 18, 280 - (20 + (b * 17) % 60), 12, 20 + (b * 17) % 60, b % 3 === 0 ? "#a3271f" : b % 3 === 1 ? "#6f8f72" : "#6f9fc0", 'opacity=".75"');

    s += C(60, 380, 26, "#10151b", 'stroke="#2a3a46" stroke-width="3"') + C(60, 380, 9, "#2a3a46") + C(1140, 380, 26, "#10151b", 'stroke="#2a3a46" stroke-width="3"') + C(1140, 380, 9, "#2a3a46");
    s += R(0, 470, 1200, 170, "#06080b");
    return envolver(defs, s);
  }

  function mesaEdicion() {
    var defs = grad("c-cons", "#18202a", 1, "#0a0e13", 1);
    var s = P("M40 452 L1160 452 L1240 640 L-40 640 Z", "url(#c-cons)") + L(40, 452, 1160, 452, "#3a4a58", 3) +
      '<ellipse cx="600" cy="520" rx="420" ry="46" fill="rgba(111,159,192,.1)"/>';
    for (var g = 0; g < 18; g++) {
      var x = 150 + g * 52;
      s += R(x, 478, 6, 52, "#05070a") + R(x - 4, 486 + (g * 13) % 30, 14, 9, g % 4 === 0 ? "#f2a33a" : "#8fa7b8");
    }
    for (var k = 0; k < 8; k++) s += C(180 + k * 120, 566, 9, "#0a0e13", 'stroke="#4a5a68" stroke-width="2"') + L(180 + k * 120, 566, 184 + k * 120, 558, "#f2a33a", 2);
    s += R(300, 592, 160, 34, "#10151b", 'rx="4" stroke="#2a3a46"') + R(760, 588, 34, 22, "#14181e", 'rx="8" stroke="#3a4a58"');
    s += P("M500 640 L500 600 Q500 556 548 556 L652 556 Q700 556 700 600 L700 640 Z", "#0d1014", 'stroke="#27323d" stroke-width="3"');
    return envolverFrente(defs, s);
  }

  function fondoOficina() {
    var defs = grad("o-fondo", "#1c1510", 1, "#0d0a08", 1) +
      '<radialGradient id="o-lampara" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb55a" stop-opacity=".35"/><stop offset="1" stop-color="#ffb55a" stop-opacity="0"/></radialGradient>';
    var s = R(0, 0, 1200, 640, "url(#o-fondo)") + R(0, 372, 1200, 8, "#3a2c1e") + R(0, 380, 1200, 110, "rgba(0,0,0,.35)");

    s += R(60, 50, 560, 290, "#e9dfc4", 'rx="3" stroke="#3a2c1e" stroke-width="6" opacity=".93"') + T(80, 80, "CRONOGRAMA · FECHA DE CLAUDIA", 15, "#1b1917");
    var filas = [[0, 12, 0], [8, 22, 0], [20, 40, 0], [36, 66, 1], [54, 64, 1]];
    for (var i = 0; i < filas.length; i++) {
      var f = filas[i];
      s += R(80, 104 + i * 42, 480, 2, "rgba(0,0,0,.12)") + R(80 + f[0] * 6.4, 112 + i * 42, (f[1] - f[0]) * 6.4, 20, f[2] ? "#a3271f" : "#f2a33a", 'rx="2"');
    }
    s += L(80 + 60 * 6.4, 90, 80 + 60 * 6.4, 322, "#1b1917", 3, 'stroke-dasharray="8 6"');

    s += R(700, 50, 440, 290, "#14110e", 'rx="3" stroke="#3a2c1e" stroke-width="6"') + T(720, 82, "PRESUPUESTO · PLAN VS REAL", 15, "#f2a33a");
    var vals = [[80, 80], [15, 16.2], [20, 19.8], [0, 45], [60, 60], [10, 14]];
    for (var k = 0; k < vals.length; k++) {
      var bx = 730 + k * 66;
      s += R(bx, 316 - vals[k][0] * 2.4, 22, vals[k][0] * 2.4, "rgba(236,227,208,.35)") + R(bx + 24, 316 - vals[k][1] * 2.4, 22, vals[k][1] * 2.4, k === 3 ? "#d8402f" : "#f2a33a", k === 3 ? 'opacity="1"' : 'opacity=".8"');
    }
    s += L(715, 316, 1125, 316, "rgba(236,227,208,.3)", 2);

    s += C(660, 120, 22, "#14110e", 'stroke="#f2a33a" stroke-width="3"') + manecilla(660, 120, 300, 16, 2) + manecilla(660, 120, 40, 11, 3);
    s += '<ellipse cx="930" cy="430" rx="320" ry="210" fill="url(#o-lampara)"/>';
    s += R(0, 470, 1200, 170, "#0d0a08");
    return envolver(defs, s);
  }

  function mesaOficina() {
    var defs = grad("d-mesa", "#3a2a1c", 1, "#17110c", 1);
    var s = P("M50 450 L1150 450 L1240 640 L-40 640 Z", "url(#d-mesa)") + L(50, 450, 1150, 450, "#7a5636", 3) +
      '<ellipse cx="900" cy="520" rx="280" ry="40" fill="rgba(255,181,90,.16)"/>';
    for (var i = 0; i < 4; i++) s += R(210 + i * 8, 546 - i * 7, 110, 62, i % 2 ? "#e2d6b6" : "#efe6c9", 'rx="2" stroke="rgba(0,0,0,.25)" transform="rotate(' + (i * 3 - 5) + ' 260 580)"');
    s += R(520, 560, 78, 52, "#1b1917", 'rx="4" stroke="#4a4036" stroke-width="2"') + R(530, 568, 58, 14, "#6f8f72") + [0, 1, 2].map(function (r) { return [0, 1, 2].map(function (c) { return R(532 + c * 20, 588 + r * 8, 14, 5, "#3a342c"); }).join(""); }).join("") +
      P("M598 586 C640 582 640 628 610 632", "none", 'stroke="#e7dec4" stroke-width="10" stroke-linecap="round"');
    s += '<ellipse cx="860" cy="566" rx="26" ry="10" fill="#ece3d0"/><ellipse cx="860" cy="563" rx="19" ry="7" fill="#3a1d12"/>' +
      L(1010, 600, 1040, 520, "#14110e", 6) + P("M1000 520 L1088 520 L1070 490 L1018 490 Z", "#2a2118", 'stroke="#14110e" stroke-width="3"') + C(1044, 526, 12, "#ffe1ae");
    s += P("M500 640 L500 600 Q500 556 548 556 L652 556 Q700 556 700 600 L700 640 Z", "#120e0b", 'stroke="#2e251c" stroke-width="3"');
    return envolverFrente(defs, s);
  }

  function fondo(modo) {
    if (modo === "noche") return fondoJuntas(true);
    if (modo === "set") return fondoSet();
    if (modo === "edicion") return fondoEdicion();
    if (modo === "oficina") return fondoOficina();
    return fondoJuntas(false);
  }

  function frente(modo) {
    if (modo === "noche") return mesaJuntas(true);
    if (modo === "set") return frenteSet();
    if (modo === "edicion") return mesaEdicion();
    if (modo === "oficina") return mesaOficina();
    return mesaJuntas(false);
  }

  var POS_MESA = [
    { x: 13, b: 22, h: 54 }, { x: 31.5, b: 22, h: 57 }, { x: 50, b: 22, h: 60 }, { x: 68.5, b: 22, h: 57 }, { x: 87, b: 22, h: 54 }
  ];
  var POS_SET = [
    { x: 12, b: 10, h: 62 }, { x: 31, b: 7, h: 68 }, { x: 50, b: 4, h: 72 }, { x: 69, b: 7, h: 68 }, { x: 88, b: 10, h: 62 }
  ];

  function capasPersonas(estado, modo) {
    var mesa = modo !== "set";
    var pos = mesa ? POS_MESA : POS_SET;
    var capa = document.createElement("div");
    capa.className = "capa-personas modo-" + modo;
    var placas = document.createElement("div");
    placas.className = "capa-placas modo-" + modo;
    var sentados = EM.SOSPECHOSOS.slice();
    if (estado.ocultarRoles && estado.ordenAsientos) sentados = estado.ordenAsientos;
    sentados.forEach(function (id, i) {
      var pp = pos[i];
      var fig = document.createElement("figure");
      fig.className = "persona";
      fig.dataset.quien = id;
      fig.style.left = pp.x + "%";
      fig.style.bottom = pp.b + "%";
      fig.style.height = pp.h + "%";
      fig.style.setProperty("--i", String(i));
      var placa = document.createElement("div");
      placa.className = "placa";
      placa.style.left = pp.x + "%";
      placa.style.top = mesa ? "75%" : "91%";
      var nom = document.createElement("strong");
      nom.textContent = EM.PERSONAJES[id].nombre.split(" ")[0];
      var rol = document.createElement("span");
      rol.textContent = EM.PERSONAJES[id].rol;
      placa.appendChild(nom);
      if (!estado.ocultarRoles) placa.appendChild(rol);
      if (estado.habla && estado.habla !== id) { fig.classList.add("en-sombra"); placa.classList.add("en-sombra"); }
      if (estado.habla === id) { fig.classList.add("habla"); placa.classList.add("habla"); }
      if (estado.ausentes[id]) {
        fig.classList.add("vacio");
        var silla = document.createElement("div");
        silla.className = "silla-vacia";
        var et = document.createElement("span");
        et.textContent = "Silla vacía";
        silla.appendChild(et);
        fig.appendChild(silla);
        placa.classList.add("ausente");
      } else {
        fig.appendChild(obtenerRetrato(id, EM.estado.expresionDe(estado, id)));
      }
      capa.appendChild(fig);
      placas.appendChild(placa);
    });
    if (mesa) {
      var tu = document.createElement("div");
      tu.className = "placa placa-tu";
      tu.style.left = "50%";
      tu.style.top = "89%";
      var t1 = document.createElement("strong");
      t1.textContent = "Gerencia";
      var t2 = document.createElement("span");
      t2.textContent = "Tu lugar";
      tu.appendChild(t1);
      tu.title = "Tu lugar";
      placas.appendChild(tu);
    }
    return { capa: capa, placas: placas };
  }

  function dibujar(contenedor, estado, modo) {
    if (!contenedor) return;
    contenedor.className = "escenario escena-" + modo;
    contenedor.textContent = "";
    var bg = document.createElement("div");
    bg.className = "fondo-wrap";
    bg.innerHTML = fondo(modo);
    contenedor.appendChild(bg);
    var polvo = document.createElement("div");
    polvo.className = "polvo";
    polvo.setAttribute("aria-hidden", "true");
    contenedor.appendChild(polvo);
    var parts = capasPersonas(estado, modo);
    contenedor.appendChild(parts.capa);
    var fr = document.createElement("div");
    fr.className = "capa-frente";
    fr.innerHTML = frente(modo);
    contenedor.appendChild(fr);
    contenedor.appendChild(parts.placas);
    if (modo === "noche") {
      var luz = document.createElement("div");
      luz.className = "sombra-noche";
      contenedor.appendChild(luz);
    }
    if (estado.ronda) {
      var rot = document.createElement("div");
      rot.className = "rotulo-ronda";
      var k = document.createElement("p");
      var info = EM.RONDAS[estado.ronda - 1];
      k.textContent = "Ronda " + estado.ronda + " de 5" + (info && info.subtitulo ? " · " + info.subtitulo : "");
      var h = document.createElement("h2");
      h.textContent = info ? info.titulo : "";
      rot.appendChild(k);
      rot.appendChild(h);
      contenedor.appendChild(rot);
    }
  }

  EM.escenas = {
    obtenerRetrato: obtenerRetrato,
    dibujar: dibujar,
    archivoExpresion: archivoExpresion
  };
})(typeof window !== "undefined" ? window : globalThis);
