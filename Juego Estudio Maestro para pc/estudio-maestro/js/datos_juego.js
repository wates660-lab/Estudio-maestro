(function (global) {
  var EM = global.EM = global.EM || {};

  EM.CONCEPTOS = [
    { id: "planeacion", nombre: "Planeación", definicion: "Definir objetivos, acciones y plazos antes de ejecutar.", consejo: "Escribe la meta con número y fecha antes de mover al equipo." },
    { id: "organizacion", nombre: "Organización", definicion: "Asignar roles y tareas para que el trabajo tenga estructura.", consejo: "Cada quien en el oficio que ya sabe hacer, por escrito." },
    { id: "direccion", nombre: "Dirección", definicion: "Guiar y supervisar la ejecución sin sustituir al equipo.", consejo: "Mira la toma, di qué sirve y deja que el área corrija." },
    { id: "control", nombre: "Control", definicion: "Comparar lo real contra lo planeado y corregir la desviación.", consejo: "Revisa la hoja antes de que el dinero cambie de bolsillo." },
    { id: "liderazgo", nombre: "Liderazgo", definicion: "Influir en las personas con un estilo consciente, no por impulso.", consejo: "En un conflicto, el estilo que eliges es parte de la decisión." },
    { id: "decisiones", nombre: "Toma de decisiones", definicion: "Elegir entre alternativas con información y tiempo limitados.", consejo: "Aunque el reloj apriete, decide con un criterio y no por pánico." },
    { id: "gestion", nombre: "Gestión de recursos", definicion: "Repartir dinero, tiempo y personas donde el proyecto los necesita.", consejo: "Deja un colchón: el rodaje no es la única etapa que cobra." },
    { id: "trabajo", nombre: "Trabajo en equipo", definicion: "Coordinar esfuerzos que dependen unos de otros.", consejo: "Nadie empieza una tarea si su insumo todavía no existe." },
    { id: "comunicacion", nombre: "Comunicación organizacional", definicion: "Hacer llegar el mensaje correcto por el canal adecuado.", consejo: "Una sola versión, dicha a todos, al mismo tiempo." },
    { id: "proyectos", nombre: "Administración de proyectos", definicion: "Cuidar alcance, tiempo y costo, y ajustar cuando la ruta crítica se atrasa.", consejo: "Si una tarea crítica se atora, mueve recursos o recorta alcance a tiempo." }
  ];

  EM.PERSONAJES = {
    isabel: { nombre: "Isabel", rol: "Narradora", color: "#c4b8a5", inicial: "I" },
    claudia: { nombre: "Claudia", rol: "Clienta", color: "#f2a33a", inicial: "C" },
    maria: { nombre: "María", rol: "Directora de arte", color: "#a3271f", inicial: "M" },
    luis: { nombre: "Luis", rol: "Editor", color: "#c4a574", inicial: "L" },
    rey: { nombre: "Rey", rol: "Productor", color: "#3d5c4a", inicial: "R" },
    monica: { nombre: "Mónica", rol: "Guionista", color: "#d9c7a2", inicial: "M" },
    theo: { nombre: "Theo", rol: "Camarógrafo becario", color: "#6f8f72", inicial: "T" }
  };

  EM.SOSPECHOSOS = ["maria", "luis", "rey", "monica", "theo"];

  EM.PUESTOS = [
    { id: "arte", nombre: "Dirección de arte", correcto: "maria" },
    { id: "edicion", nombre: "Edición", correcto: "luis" },
    { id: "produccion", nombre: "Producción", correcto: "rey" },
    { id: "guion", nombre: "Guion", correcto: "monica" },
    { id: "camara", nombre: "Cámara", correcto: "theo" }
  ];

  EM.TAREAS = [
    { id: "guion", nombre: "Cerrar el guion", deps: [] },
    { id: "arte", nombre: "Diseño de arte", deps: ["guion"] },
    { id: "casting", nombre: "Casting", deps: ["guion"] },
    { id: "rodaje", nombre: "Rodaje", deps: ["arte", "casting"] },
    { id: "edicion", nombre: "Edición del corte", deps: ["rodaje"] },
    { id: "color", nombre: "Color y mezcla", deps: ["edicion"] },
    { id: "entrega", nombre: "Entrega a Claudia", deps: ["color"] }
  ];

  EM.LINEAS_GASTO = [
    { id: "renta", concepto: "Renta de foro", planeado: 80000, real: 80000, nota: "Contrato firmado." },
    { id: "medios", concepto: "Medios y discos", planeado: 15000, real: 16200, nota: "Incluye IVA." },
    { id: "catering", concepto: "Catering semana 2", planeado: 20000, real: 19800, nota: "Cierra con los tickets." },
    { id: "luz-norte", concepto: "Proveedor Luz Norte", planeado: 0, real: 45000, nota: "No está en el plan. Nadie lo autorizó.", sospechosa: true },
    { id: "nomina", concepto: "Nómina de semana", planeado: 60000, real: 60000, nota: "Lista de raya." },
    { id: "transporte", concepto: "Transporte", planeado: 10000, real: 14000, nota: "Segunda unidad, autorizada por gerencia." }
  ];

  EM.GANTT = [
    { id: "guion", nombre: "Guion", inicio: 0, fin: 12, critica: true },
    { id: "arte", nombre: "Arte", inicio: 8, fin: 22, critica: true },
    { id: "rodaje", nombre: "Rodaje", inicio: 20, fin: 40, critica: true },
    { id: "edicion", nombre: "Edición", inicio: 36, fin: 66, critica: true, atraso: true },
    { id: "entrega", nombre: "Entrega", inicio: 54, fin: 64, critica: true, atraso: true }
  ];

  EM.RONDAS = [
    { id: 1, escenario: "juntas", titulo: "Sala de juntas", subtitulo: "Día uno", voz: "I04", cliff: "I08", decisiones: ["D1", "D2", "D3"] },
    { id: 2, escenario: "set", titulo: "Set de grabación", subtitulo: "Luces y cables", voz: "I09", cliff: "I15", decisiones: ["D4", "D5", "D6"] },
    { id: 3, escenario: "edicion", titulo: "Sala de edición", subtitulo: "La teoría fácil", voz: "I16", cliff: "I21", decisiones: ["D7", "D8"] },
    { id: 4, escenario: "oficina", titulo: "Oficina de producción", subtitulo: "Números y cronograma", voz: "I22", cliff: null, decisiones: ["D9", "D10"] },
    { id: 5, escenario: "noche", titulo: "Sala de juntas", subtitulo: "De noche", voz: "I27", decisiones: [] }
  ];

  EM.INTRO = [
    { titulo: "Toma uno", texto: "Te acaban de sentar en la gerencia de Estudio Maestro, una casa chica que vive de comerciales y, desde hoy, de una película. Claudia puso el dinero y la prisa. El rodaje dura cinco rondas. Alguien del equipo no quiere que termines." },
    { titulo: "El equipo", texto: "María dirige el arte. Luis edita y se entera de todo. Rey cuida el dinero. Mónica escribe. Theo opera la cámara y apenas empieza. Isabel te habla al oído. Dice que solo narra.", equipo: true },
    { titulo: "Cómo se juega", texto: "Cada decisión mueve el presupuesto, la moral, los días y la calidad. Lo que no ves también se mueve: el resentimiento. Junta pistas en el corcho, conéctalas con hilo y, al final, acusa. Si un medidor llega a cero, hay crisis, pero la película sigue." }
  ];

  EM.DECISIONES = [
    {
      id: "D1", ronda: 1, tipo: "opciones", concepto: "planeacion", cuentaConcepto: true,
      titulo: "Qué película van a hacer",
      contexto: "Claudia pide una película que la haga llorar. El equipo espera una meta. Mónica tiene el cuaderno cerrado.",
      opciones: [
        { id: "vago", calidad: "mal", puntaje: 2, voz: "I06", texto: "Les dices que van a hacer una gran película, de las que se recuerdan.", porque: "Sin número ni fecha nadie puede planear. Mónica escribe a ciegas y el proyecto no tiene norte.", efectos: { moral: -6, calidad: -8, tiempo: -3, resentimiento: { monica: 28 } } },
        { id: "medible", calidad: "bien", puntaje: 10, voz: "I05", texto: "Cierras por escrito: corte de 12 minutos, tres locaciones, entrega en lo que queda de los 60 días y presupuesto tope.", porque: "La planeación convierte un deseo en objetivos con medida y plazo. El equipo ya puede organizarse.", efectos: { moral: 6, calidad: 8, tiempo: 2, resentimiento: { monica: -6 } } },
        { id: "copiar", calidad: "regular", puntaje: 6, texto: "Tomas el plan del comercial del año pasado y le cambias el nombre del cliente.", porque: "Reutilizar un plan ahorra días, pero ese trabajo no era una película. La planeación queda prestada.", efectos: { tiempo: 3, calidad: -3, resentimiento: { monica: 10 } } }
      ]
    },
    {
      id: "D2", ronda: 1, tipo: "organigrama", concepto: "organizacion", cuentaConcepto: true,
      titulo: "El organigrama del rodaje",
      contexto: "Cinco sillas, cinco oficios. Arrastra a cada persona a su puesto, o tócala y luego elige el lugar."
    },
    {
      id: "D3", ronda: 1, tipo: "presupuesto", concepto: "gestion", cuentaConcepto: true,
      titulo: "Repartir el medio millón",
      contexto: "El presupuesto son $500,000 MXN. Reparte el porcentaje entre preproducción, rodaje, postproducción e imprevistos. Los cuatro deben sumar 100."
    },
    {
      id: "D4", ronda: 2, tipo: "opciones", concepto: "direccion", cuentaConcepto: true,
      titulo: "Cómo diriges el set",
      contexto: "María arma el encuadre, Theo opera y Luis mira el monitor. El día ya empezó.",
      opciones: [
        { id: "micro", calidad: "regular", puntaje: 6, texto: "Te metes en cada toma y corriges tú la marca del piso.", porque: "Hay supervisión, pero sustituyes al equipo. Dirigir no es hacer el trabajo de todos. María deja de proponer.", efectos: { calidad: 3, moral: -10, tiempo: -2, resentimiento: { maria: 24 } } },
        { id: "feedback", calidad: "bien", puntaje: 10, texto: "Ves la toma, dices qué sirve y qué no, y dejas que María ajuste con su gente.", porque: "La dirección orienta la ejecución. El criterio es tuyo; el oficio sigue siendo de ellos.", efectos: { calidad: 8, moral: 6, resentimiento: { maria: -6 } } },
        { id: "ausente", calidad: "mal", puntaje: 2, texto: "Te vas a la camioneta a contestar mensajes. Ellos ya saben filmar.", porque: "Sin dirección el plan no se ejecuta. El set se queda sin criterio y la calidad se cae.", efectos: { calidad: -14, moral: -6, tiempo: 1, resentimiento: { maria: 12, theo: 6 } } }
      ]
    },
    {
      id: "D5", ronda: 2, tipo: "opciones", concepto: "liderazgo", cuentaConcepto: true,
      titulo: "María contra Luis",
      contexto: "María quiere un color más sucio. Luis dice que eso rompe la continuidad del corte. Los dos te miran.",
      opciones: [
        { id: "auto", calidad: "regular", puntaje: 6, voz: "I10", texto: "Cierras el pleito en treinta segundos: se respeta el cronograma y se acabó la junta.", porque: "El estilo autocrático resuelve rápido y no escucha. María se queda con la frase a medias y el conflicto sigue vivo.", efectos: { tiempo: 3, moral: -10, calidad: 2, resentimiento: { maria: 28 } } },
        { id: "demo", calidad: "bien", puntaje: 10, voz: "I11", texto: "Cada quien expone un minuto. Acuerdan un corte de prueba y lo revisan al cerrar el día.", porque: "El liderazgo democrático usa el conflicto para una decisión compartida. Cuesta tiempo y sube la moral.", efectos: { tiempo: -4, moral: 12, calidad: 4, resentimiento: { maria: -4, luis: -4 } } },
        { id: "libre", calidad: "mal", puntaje: 2, voz: "I12", texto: "Les dices que lo resuelvan entre ellos: tú tienes que marcarle a Claudia.", porque: "El estilo liberal los deja sin marco. Alguien improvisa, la calidad baja y el rol de Theo se diluye.", efectos: { tiempo: 1, calidad: -12, moral: -2, resentimiento: { theo: 26 } } }
      ]
    },
    {
      id: "D6", ronda: 2, tipo: "opciones", concepto: "comunicacion", cuentaConcepto: true,
      titulo: "Claudia cambió el final",
      contexto: "El personaje ya no perdona. Hay que bajar el cambio al equipo antes de la siguiente toma.",
      opciones: [
        { id: "correo", calidad: "mal", puntaje: 2, voz: "I13", texto: "Mandas un correo largo a todo el estudio, con el guion pegado y sin resumen.", porque: "El canal llegó a todos y el mensaje a nadie. El hueco lo llena el pasillo, y Luis lleva la voz.", efectos: { moral: -8, calidad: -5, tiempo: 1, resentimiento: { luis: 18 } } },
        { id: "reunion", calidad: "bien", puntaje: 10, voz: "I14", texto: "Paras el set doce minutos y explicas el cambio, quién lo ejecuta y para cuándo.", porque: "Comunicación organizacional: un mensaje claro, por el canal correcto, oído por todos a la vez.", efectos: { moral: 7, calidad: 6, tiempo: -2, resentimiento: { luis: -6 } } },
        { id: "uno", calidad: "regular", puntaje: 6, texto: "Se lo cuentas a Luis para que él se lo pase a los demás entre toma y toma.", porque: "Delegar el recado en quien más habla ahorra la junta y deforma la información. El rumor ya tiene dueño.", efectos: { tiempo: 2, moral: -4, calidad: -2, resentimiento: { luis: 30 } } }
      ]
    },
    {
      id: "D7", ronda: 3, tipo: "reloj", concepto: "decisiones", cuentaConcepto: true,
      titulo: "Diez segundos",
      contexto: "No hay tiempo para una junta. Elige antes de que el reloj llegue a cero.",
      crisis: [
        {
          id: "reflector",
          texto: "Un reflector se soltó y quedó colgando sobre el set.",
          opciones: [
            { id: "asegurar", calidad: "bien", puntaje: 10, voz: "I18", texto: "Evacúas, aseguras la lámpara y retomas con un plan de una hora.", porque: "Decidiste con el reloj encima y aun así protegiste a la gente y al día. Criterio antes que pánico.", efectos: { tiempo: -2, calidad: 3, moral: 4 } },
            { id: "guardar", calidad: "regular", puntaje: 6, texto: "Ruedas lejos de la lámpara y dejas a Theo de guardia.", porque: "La decisión evita el paro, pero carga el riesgo en el becario. Sirve a medias.", efectos: { calidad: -2, moral: -4, resentimiento: { theo: 8 } } },
            { id: "ignorar", calidad: "mal", puntaje: 2, peor: true, voz: "I19", texto: "Sigues la toma. Si paras, Claudia se entera de que perdiste el día.", porque: "Decidir solo para que no se note el problema ignora la información que sí tenías: había un riesgo real.", efectos: { calidad: -10, moral: -10, resentimiento: { theo: 6 } } }
          ]
        },
        {
          id: "claudia",
          texto: "Claudia entra al set y exige cambiar el final hoy mismo.",
          opciones: [
            { id: "dos-finales", calidad: "bien", puntaje: 10, voz: "I18", texto: "Le ofreces dos finales filmados y que elija en edición, no en el set.", porque: "Acotaste la decisión: la clienta elige, el rodaje no se desarma. Eso es decidir con límite de tiempo.", efectos: { tiempo: -1, moral: 3, calidad: 4 } },
            { id: "parcial", calidad: "regular", puntaje: 6, texto: "Aceptas el cambio solo en las escenas que aún no se ruedan.", porque: "Contienes el daño, pero el final queda partido. La decisión es defendible y floja.", efectos: { calidad: -3, tiempo: -2, moral: -2 } },
            { id: "echar", calidad: "mal", puntaje: 2, peor: true, voz: "I19", texto: "Le pides que salga: el set no es lugar para la clienta.", porque: "Cortaste el problema por el lado más ruidoso. Perdiste información y la relación en la misma frase.", efectos: { moral: -12, calidad: -4, resentimiento: { monica: 6 } } }
          ]
        },
        {
          id: "tarjetas",
          texto: "No aparecen las tarjetas de ayer. El monitor está en negro.",
          opciones: [
            { id: "inventario", calidad: "bien", puntaje: 10, voz: "I18", texto: "Paras, haces inventario y regrabas solo lo que no aparece.", porque: "Usaste el poco tiempo en saber qué faltaba. Decidir no es reaccionar: es elegir con el dato que alcanzas.", efectos: { tiempo: -3, calidad: 4, moral: 2 } },
            { id: "todo", calidad: "regular", puntaje: 6, texto: "Regrabas el día completo para no discutir.", porque: "Aseguras el material a cambio de días que no sobran. Funciona, y es caro.", efectos: { tiempo: -6, calidad: 2, moral: -2 } },
            { id: "culpar", calidad: "mal", puntaje: 2, peor: true, voz: "I19", texto: "Dices, delante del equipo, que Theo extravió las tarjetas.", porque: "Señalaste un culpable sin inventario. La decisión castiga a alguien y no recupera el material.", efectos: { moral: -12, calidad: -6, resentimiento: { theo: 18 } } }
          ]
        }
      ]
    },
    {
      id: "D8", ronda: 3, tipo: "dependencias", concepto: "trabajo", cuentaConcepto: true,
      titulo: "El orden del trabajo",
      contexto: "Ordena las tareas. Ninguna puede quedar antes de aquello que necesita para existir."
    },
    {
      id: "D9", ronda: 4, tipo: "kpis", concepto: "control", cuentaConcepto: true,
      titulo: "Lo planeado contra lo real",
      contexto: "Seis líneas de gasto. Una no cuadra con el plan. Encuéntrala antes de que se acabe el tiempo."
    },
    {
      id: "D10", ronda: 4, tipo: "gantt", concepto: "proyectos", cuentaConcepto: true,
      titulo: "La ruta crítica se atoró",
      contexto: "La edición se salió de la fecha. Todo lo que depende de ella se cae detrás. El cronograma está en la pared.",
      opciones: [
        { id: "reasignar", calidad: "bien", puntaje: 10, texto: "Pasas a Luis medio día de otra escena para recuperar la edición, que es la tarea crítica.", porque: "Reasignaste el recurso a lo que detiene el proyecto. Administrar es mover tiempo y gente cuando la ruta se rompe.", efectos: { presupuesto: -35000, tiempo: 5, calidad: 4, moral: 2 } },
        { id: "recortar", calidad: "regular", puntaje: 6, texto: "Sacas del corte la escena del puente para ganar dos días.", porque: "Recortar alcance salva la fecha y cobra en calidad. Es una palanca válida, no la más fina.", efectos: { tiempo: 4, calidad: -8, moral: -3 } },
        { id: "nada", calidad: "mal", puntaje: 2, voz: "I24", texto: "Dejas el atraso: en postproducción se recupera con cafés.", porque: "Ignorar la ruta crítica no la congela. Una tarea atorada arrastra a las demás.", efectos: { tiempo: -8, calidad: -6, moral: -4 } }
      ]
    }
  ];

  EM.EVENTOS = [
    {
      id: "E21", voz: "R21", concepto: "gestion", cuentaConcepto: false, tipo: "evento",
      titulo: "Recorte",
      contexto: "Producción llama: bajan $100,000. Claudia dice que es temporal.",
      efectoBase: { presupuesto: -100000 },
      opciones: [
        { id: "repartir", calidad: "bien", puntaje: 0, texto: "Repartes el golpe entre rodaje y post, y enseñas la hoja en la junta.", porque: "Gestionar el recorte es volver a repartir con números, no esconder la cifra.", efectos: { moral: 3, resentimiento: { rey: -2 } } },
        { id: "imprevistos", calidad: "regular", puntaje: 0, texto: "Te comes el colchón de imprevistos y dejas el rodaje intacto.", porque: "Salvas la semana de cámara y te quedas sin margen. El recurso queda rígido.", efectos: { calidad: -2, sinColchon: true, resentimiento: { rey: 8 } } },
        { id: "rey-solo", calidad: "mal", puntaje: 0, texto: "Le dices a Rey que lo resuelva y que no quieres ver la hoja.", porque: "Soltar el recurso sin vigilancia es justo lo que alimenta un desvío.", efectos: { moral: -4, calidad: -3, resentimiento: { rey: 10 } } }
      ]
    },
    {
      id: "E22", voz: "R22", concepto: "planeacion", cuentaConcepto: false, tipo: "evento",
      titulo: "Claudia cambia de idea",
      contexto: "Ahora la historia es en invierno. El jardín de verano ya está rentado.",
      opciones: [
        { id: "adaptar", calidad: "bien", puntaje: 0, texto: "Juntas a Mónica y a María: qué se puede cambiar sin romper la fecha.", porque: "Ajustas el plan con quien ejecuta. La meta sigue teniendo plazo.", efectos: { moral: 4, tiempo: -2, resentimiento: { monica: -3 } } },
        { id: "negociar", calidad: "regular", puntaje: 0, texto: "Le dices que el invierno se simula en edición, no en el set.", porque: "Proteges el plan a cambio de una promesa que la postproducción tendrá que pagar.", efectos: { calidad: -2 } },
        { id: "imponer", calidad: "mal", puntaje: 0, texto: "Cambias todo y dejas que el equipo se entere en la primera toma.", porque: "Moviste los objetivos sin decirlos. La planeación dejó de ser un acuerdo.", efectos: { moral: -6, calidad: -4, resentimiento: { monica: 8, luis: 6 } } }
      ]
    },
    {
      id: "E23", voz: "R23", concepto: "liderazgo", cuentaConcepto: false, tipo: "evento",
      titulo: "Rumores de renuncia",
      contexto: "Theo dejó el estuche junto a la puerta. Alguien dijo que mañana no vuelve.",
      opciones: [
        { id: "hablar", calidad: "bien", puntaje: 0, texto: "Hablas con él a solas y le dejas su rol por escrito.", porque: "Atajaste la renuncia aclarando el papel. El liderazgo también es dar marco a quien empieza.", efectos: { moral: 4, resentimiento: { theo: -8 } } },
        { id: "esperar", calidad: "regular", puntaje: 0, texto: "Le pides que se quede hasta el viernes y luego lo revisan.", porque: "Ganas unos días y no resuelves el motivo. La amenaza sigue en la puerta.", efectos: { moral: -2, resentimiento: { theo: 6 } } },
        { id: "ignorar", calidad: "mal", puntaje: 0, texto: "Lo dejas ir. Dices que los becarios siempre amenazan. Su silla se queda vacía esta ronda.", porque: "Ignoraste a la persona. La silla se vacía y el mensaje para el resto es peor.", efectos: { moral: -8, tiempo: -3, ausente: { id: "theo", modo: "ronda" }, resentimiento: { theo: 10 } } }
      ]
    },
    {
      id: "E24", voz: "R24", concepto: "trabajo", cuentaConcepto: false, tipo: "evento",
      titulo: "El equipo se enoja",
      contexto: "En la comida nadie habla. María empuja la charola. Luis suelta una risa sin gracia.",
      opciones: [
        { id: "escuchar", calidad: "bien", puntaje: 0, texto: "Paras veinte minutos y escuchas una queja por persona.", porque: "El equipo no coordina si no puede decir qué lo traba. Escuchar también es trabajo.", efectos: { moral: 10, tiempo: -2, resentimiento: { maria: -4 } } },
        { id: "discurso", calidad: "regular", puntaje: 0, texto: "Das un discurso sobre el sacrificio que pide el cine.", porque: "Ocupaste el silencio con tu voz. La moral no se compone con una arenga.", efectos: { moral: -3 } },
        { id: "amenaza", calidad: "mal", puntaje: 0, texto: "Amenazas con reemplazar al que siga con esa cara.", porque: "El miedo no coordina. El equipo obedece un rato y trabaja peor.", efectos: { moral: -14, resentimiento: { maria: 8, theo: 4 } } }
      ]
    },
    {
      id: "E25", voz: "R25", concepto: "control", cuentaConcepto: false, tipo: "evento",
      titulo: "Hoja en la impresora",
      contexto: "Quedó una hoja que nadie reclamó. Alcanzas a leer el primer renglón.",
      opciones: [
        { id: "guardar", calidad: "bien", puntaje: 0, texto: "La lees, la guardas en el expediente y no la comentas en el pasillo.", porque: "Control también es conservar la evidencia sin contaminarla.", efectos: { pista: "limpia" } },
        { id: "dejar", calidad: "regular", puntaje: 0, texto: "La dejas donde está. Si importaba, la van a buscar.", porque: "Viste la desviación y no la registraste. La pista sigue suelta.", efectos: {} },
        { id: "leer", calidad: "mal", puntaje: 0, texto: "La lees en voz alta para ver quién se pone nervioso.", porque: "Convertiste el hallazgo en espectáculo. El dato se ensucia y Luis toma nota.", efectos: { moral: -6, pista: "sucia", resentimiento: { luis: 6 } } }
      ]
    }
  ];

  EM.CRISIS = {
    presupuesto: {
      titulo: "Sin fondos",
      texto: "La cuenta llegó a cero. No hay para la siguiente jornada.",
      concepto: "gestion",
      opciones: [
        { id: "anticipo", texto: "Le pides a Claudia un anticipo con fecha de entrega inamovible.", efectos: { presupuesto: 140000, tiempo: -4, moral: -2 } },
        { id: "cortometraje", texto: "Recortas la película a la mitad y renegocias el alcance.", efectos: { presupuesto: 90000, calidad: -8, moral: -4 } },
        { id: "fiado", texto: "Sigues a fiado y le dices a Rey que ya verán cómo cerrar.", efectos: { presupuesto: 60000, resentimiento: { rey: 8 } } }
      ]
    },
    moral: {
      titulo: "El equipo se niega",
      texto: "Nadie levanta la cámara. Dicen que así no siguen.",
      concepto: "liderazgo",
      opciones: [
        { id: "franca", texto: "Paras el día y tienes una conversación franca, sin discurso.", efectos: { moral: 36, tiempo: -2 } },
        { id: "bono", texto: "Ofreces un bono pequeño al cierre, por escrito.", efectos: { moral: 30, presupuesto: -25000 } },
        { id: "reemplazo", texto: "Amenazas con traer un equipo nuevo el lunes.", efectos: { moral: 18, resentimiento: { maria: 8, theo: 6 } } }
      ]
    },
    tiempo: {
      titulo: "La fecha ya pasó",
      texto: "El calendario de Claudia está en rojo. El corte no existe.",
      concepto: "proyectos",
      opciones: [
        { id: "prorroga", texto: "Negocias cinco días más y enseñas qué se entrega en cada uno.", efectos: { tiempo: 12, moral: -2 } },
        { id: "incompleto", texto: "Entregas un corte incompleto y pides nota de cambios.", efectos: { tiempo: 6, calidad: -8 } },
        { id: "noche", texto: "Ruedas de noche, sin turno de descanso.", efectos: { tiempo: 8, moral: -12, calidad: -4 } }
      ]
    },
    calidad: {
      titulo: "El corte no se puede enseñar",
      texto: "Lo que hay en el monitor no se le puede poner a Claudia.",
      concepto: "control",
      opciones: [
        { id: "regrabar", texto: "Regrabas la escena clave y tiras el resto del día.", efectos: { calidad: 34, tiempo: -3, presupuesto: -20000 } },
        { id: "editar", texto: "Maquillas en edición lo que el set no dio.", efectos: { calidad: 24, moral: -2 } },
        { id: "entregar", texto: "La entregas así y dices que es estilo.", efectos: { calidad: 16, moral: -6, resentimiento: { maria: 6 } } }
      ]
    }
  };

  EM.CATALOGO_PISTAS = [
    { id: "a-servidor", tipo: "ambigua", senala: null, titulo: "Bitácora del servidor", texto: "Alguien borró un archivo a las 22:10. El usuario aparece como «producción».", variantes: [
      "Alguien borró un archivo a las 22:10. El usuario aparece como «producción».",
      "El servidor anotó un borrado a las 21:48 desde una cuenta compartida del estudio.",
      "La carpeta del corte perdió un archivo esta noche. El registro se limpió justo después.",
      "Hay un archivo eliminado y una sesión abierta sin nombre. Nadie reconoce haberla usado."
    ] },
    { id: "a-objetivos", tipo: "ambigua", senala: null, titulo: "Hoja de objetivos", texto: "Los objetivos siguen pegados. Alguien los tachó con lápiz, sin firmar." },
    { id: "a-minuta", tipo: "ambigua", senala: null, titulo: "Minuta de doce minutos", texto: "Todos firmaron el cambio de Claudia. Falta una firma al calce." },
    { id: "a-pasillo", tipo: "ambigua", senala: null, titulo: "Foto del pasillo", texto: "Una sombra sale de edición a la 1:14. No se alcanza a ver la cara." },

    { id: "f-maria-1", tipo: "falsa", senala: "maria", titulo: "Correo de arte", texto: "María escribió: «voy a quitar lo que estorbe». Hablaba de un sillón del set." },
    { id: "f-maria-2", tipo: "falsa", senala: "maria", titulo: "Ticket de solvente", texto: "Compró solvente a las 23:00. Sirve para borrar, y también para pintar." },
    { id: "f-maria-3", tipo: "falsa", senala: "maria", titulo: "Llamada nocturna", texto: "María habló con edición de madrugada. Quedaron de revisar la escena doce." },

    { id: "f-luis-1", tipo: "falsa", senala: "luis", titulo: "Chat a medias", texto: "Luis escribió «no se lo digan todavía». El resto del mensaje no está." },
    { id: "f-luis-2", tipo: "falsa", senala: "luis", titulo: "Reenvío", texto: "Reenvió el cambio de Claudia solo a dos personas." },
    { id: "f-luis-3", tipo: "falsa", senala: "luis", titulo: "Archivo de audio", texto: "En su consola hay un audio llamado rumor_final. Puede ser un corte de sonido." },

    { id: "f-rey-1", tipo: "falsa", senala: "rey", titulo: "Salida sin folio", texto: "Una salida de $12,000 sin concepto. Rey dice que es caja chica." },
    { id: "f-rey-2", tipo: "falsa", senala: "rey", titulo: "Cotización", texto: "Aparece Luz Norte en una cotización. Todavía no hay factura." },
    { id: "f-rey-3", tipo: "falsa", senala: "rey", titulo: "Resta en un papel", texto: "En su escritorio: 500,000 − 90,000. Sin explicación al margen." },

    { id: "f-monica-1", tipo: "falsa", senala: "monica", titulo: "Márgenes", texto: "Mónica reescribió el final en los márgenes. La hoja está fechada ayer." },
    { id: "f-monica-2", tipo: "falsa", senala: "monica", titulo: "Correo a Claudia", texto: "Le mandó una versión distinta a la que leíste tú." },
    { id: "f-monica-3", tipo: "falsa", senala: "monica", titulo: "Pizarra", texto: "Borró los objetivos y dejó una pregunta: ¿de qué trata esto?" },

    { id: "f-theo-1", tipo: "falsa", senala: "theo", titulo: "Bitácora de cámara", texto: "Theo no registró las tomas del jueves. El hueco es de tres horas." },
    { id: "f-theo-2", tipo: "falsa", senala: "theo", titulo: "Mensaje a un amigo", texto: "Escribió: si mañana no me explican mi rol, me voy." },
    { id: "f-theo-3", tipo: "falsa", senala: "theo", titulo: "Tarjeta en la mochila", texto: "Apareció una tarjeta de memoria en su mochila. Nadie la reclamó." },

    { id: "r-maria-1", tipo: "real", senala: "maria", titulo: "Papelera de edición", texto: "La escena doce se borró con la sesión de María a las 23:40." },
    { id: "r-maria-2", tipo: "real", senala: "maria", titulo: "Historial del proyecto", texto: "El archivo guarda el nombre MARIA-LAP. Ella vació la papelera." },
    { id: "r-maria-3", tipo: "real", senala: "maria", titulo: "Recado", texto: "En un papel: «si no me escuchan, la escena sobra». La letra es de María." },
    { id: "r-maria-4", tipo: "real", senala: "maria", titulo: "Testigo de noche", texto: "El guardia la vio salir de edición con el disco duro bajo el brazo." },

    { id: "r-luis-1", tipo: "real", senala: "luis", titulo: "Captura del chat", texto: "Luis le escribió a Claudia que el equipo no va a cobrar. Lo inventó." },
    { id: "r-luis-2", tipo: "real", senala: "luis", titulo: "Registro de reenvío", texto: "El rumor salió de su consola a las 18:02, a tres grupos." },
    { id: "r-luis-3", tipo: "real", senala: "luis", titulo: "Audio cortado", texto: "Grabó la junta y circuló solo la frase donde dudas del pago." },
    { id: "r-luis-4", tipo: "real", senala: "luis", titulo: "Respuesta de Claudia", texto: "Claudia contestó: «me lo dijo tu editor». El correo está en su bandeja." },

    { id: "r-rey-1", tipo: "real", senala: "rey", titulo: "Factura fantasma", texto: "Luz Norte no existe. La cuenta recibe a nombre de Rey." },
    { id: "r-rey-2", tipo: "real", senala: "rey", titulo: "Estado de cuenta", texto: "Faltan $150,000 y el movimiento sale de la caja que solo Rey firma." },
    { id: "r-rey-3", tipo: "real", senala: "rey", titulo: "Dos presupuestos", texto: "Hay dos hojas. La de Claudia no incluye el desvío." },
    { id: "r-rey-4", tipo: "real", senala: "rey", titulo: "Proveedor fantasma", texto: "El RFC de Luz Norte no aparece en el registro. Rey lo dio de alta." },

    { id: "r-monica-1", tipo: "real", senala: "monica", titulo: "Archivo de madrugada", texto: "Guion_final_v7 se guardó a las 03:12 en la computadora de Mónica." },
    { id: "r-monica-2", tipo: "real", senala: "monica", titulo: "Continuidad rota", texto: "El final nuevo contradice la escena 4, que ya se rodó. Ella lo sabía." },
    { id: "r-monica-3", tipo: "real", senala: "monica", titulo: "Borrador no enviado", texto: "Iba a avisarte y lo borró. El borrador sigue en su carpeta." },
    { id: "r-monica-4", tipo: "real", senala: "monica", titulo: "Versión paralela", texto: "Claudia tiene un PDF que tú no autorizaste. Lo mandó Mónica." },

    { id: "r-theo-1", tipo: "real", senala: "theo", titulo: "Nota de dos líneas", texto: "«Me voy. Nadie me dijo qué hacía aquí.» Está firmada por Theo." },
    { id: "r-theo-2", tipo: "real", senala: "theo", titulo: "Cámara en recepción", texto: "Dejó el equipo a las 6:40. El guardia lo anotó en la bitácora." },
    { id: "r-theo-3", tipo: "real", senala: "theo", titulo: "Mensaje al grupo", texto: "Escribió al grupo del set: «improvisen, yo ya no»." },
    { id: "r-theo-4", tipo: "real", senala: "theo", titulo: "Hueco de tres horas", texto: "La escena doce cae en el hueco en el que Theo no registró tomas." }
  ];

  EM.SABOTAJES = {
    maria: {
      titulo: "La escena doce no está",
      texto: "En el monitor, la escena doce desapareció. Se borró con la sesión de María y la papelera quedó vacía. No hay copia en el servidor.",
      efectos: { calidad: -22, tiempo: -4, moral: -4 },
      pista: "r-maria-1",
      renuncia: true
    },
    luis: {
      titulo: "El rumor y la escena",
      texto: "La escena doce desapareció del corte. Al mismo tiempo Claudia recibió un mensaje: el equipo dice que no va a cobrar. Salió de la consola de Luis.",
      efectos: { moral: -18, calidad: -8 },
      pista: "r-luis-1",
      renuncia: true
    },
    rey: {
      titulo: "El dinero no cuadra",
      texto: "La escena doce ya no está en el proyecto, y con ella se esfumó una parte del presupuesto. El estado de cuenta habla de un proveedor que no existe. La firma es de Rey.",
      efectos: { presupuesto: -160000, calidad: -8 },
      pista: "r-rey-1",
      renuncia: true
    },
    monica: {
      titulo: "El guion ya no es el de ayer",
      texto: "La escena doce desapareció porque ya no empata con nada. Mónica reescribió el guion de madrugada y la continuidad se rompió.",
      efectos: { calidad: -18, tiempo: -2, moral: -4 },
      pista: "r-monica-1",
      renuncia: true
    },
    theo: {
      titulo: "La silla vacía",
      texto: "La escena doce se perdió en un hueco sin cámara. Theo dejó el equipo en recepción y una nota de dos líneas. No va a volver.",
      efectos: { calidad: -10, tiempo: -5, moral: -8 },
      pista: "r-theo-1",
      renuncia: true
    }
  };

  EM.NOTAS_SALIDA = {
    maria: "No voy a seguir pidiendo que me escuchen. Ya lo pedí demasiado. — María",
    luis: "Ya no me entero de nada hasta que todos lo saben. Prefiero no enterarme desde afuera. — Luis",
    rey: "Cuadré lo que pude. Lo demás ya no es asunto mío. — Rey",
    monica: "Nunca supe hacia dónde íbamos. Ya no pregunto. — Mónica",
    theo: "Me voy. Nadie me dijo qué hacía aquí. — Theo"
  };

  EM.FINALES = [
    { id: "anio", nombre: "Gerente del año", min: 90, voz: "I40" },
    { id: "bueno", nombre: "Buen gerente", min: 75, voz: "I41" },
    { id: "regular", nombre: "Regular", min: 60, voz: "I42" },
    { id: "mal", nombre: "Mal gerente", min: 40, voz: "I43" },
    { id: "despedido", nombre: "Despedido", min: 0, voz: "I44" }
  ];

  EM.VOZ_SABOTEADOR = { maria: "I32", luis: "I33", rey: "I34", monica: "I35", theo: "I36" };

  EM.GRUPOS_REACCION = {
    shock: ["R01", "R02", "R03", "R04", "R05", "R06"],
    mal: ["R07", "R08", "R09", "R10", "R11"],
    bien: ["R12", "R13", "R14", "R15", "R16"],
    sospecha: ["R26", "R27", "R28", "R29", "R30"],
    regular: ["R04", "R05", "R06"],
    alerta: ["R11"],
    golpe: ["R03"],
    pista: ["R25"],
    rachaBien: ["R16"],
    rachaMal: ["R10"],
    prisa: ["R17", "R18"]
  };

  EM.RELOJ_VOZ = { 7: "R17", 5: "R18", 3: "R19", 1: "R20" };

  EM.CONCEPTO_DE = {
    maria: ["liderazgo", "direccion"],
    luis: ["comunicacion"],
    rey: ["control", "gestion"],
    monica: ["planeacion"],
    theo: ["organizacion", "trabajo"]
  };
})(typeof window !== "undefined" ? window : globalThis);
