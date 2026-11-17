# Estudio Maestro: Sabotaje en Producción

Partida web de Administración Interactiva. Se abre sin servidor, sin internet y sin instalar nada.

## Cómo jugarla

1. Abre `index.html` con doble clic (o arrástrala al navegador).
2. Pulsa la claqueta. Ese clic enciende el audio.
3. Enter o Espacio avanzan. Si el texto sigue escribiéndose, el primer clic lo completa y el segundo sigue.
4. Las teclas 1, 2 y 3 eligen opciones. En el organigrama, 1 a 5 eligen a la persona.
5. `M` silencia música y efectos. El volumen de voz y de música está en Sonido.

En el celular se puede jugar en horizontal. El diseño está pensado para laptop (1366×768) y proyector (1920×1080).

## Arte y audio

No hace falta tocar el código. Se sueltan los archivos y, al recargar, el juego los usa. Si no están, hay siluetas y la voz del navegador (`es-MX`, o `es` si no hay voz mexicana).

Retratos, en `assets/personajes/`, PNG con fondo transparente:

- `isabel_neutral.png`
- `claudia_neutral.png`, `claudia_contenta.png`, `claudia_molesta.png`
- `maria_neutral.png`, `maria_contento.png`, `maria_molesto.png`, `maria_culpable.png`
- `luis_neutral.png`, `luis_contento.png`, `luis_molesto.png`, `luis_culpable.png`
- `rey_neutral.png`, `rey_contento.png`, `rey_molesto.png`, `rey_culpable.png`
- `monica_neutral.png`, `monica_contento.png`, `monica_molesto.png`, `monica_culpable.png`
- `theo_neutral.png`, `theo_contento.png`, `theo_molesto.png`, `theo_culpable.png`

Voces de Isabel, en `assets/audio/voz/`. El texto de cada código está en `guion_isabel.txt` y no se reescribe:

- `I01.mp3` … `I44.mp3`
- `R01.mp3` … `R33.mp3`
- También se acepta `.wav` con el mismo nombre.

Efectos opcionales, en `assets/audio/sfx/`: `acierto.mp3`, `error.mp3`, `sting.mp3`, `claqueta.mp3`, `latido.mp3`.

Música opcional, en `assets/audio/musica/`: `ambiente.mp3`, `tension.mp3`.

Si esos archivos no están, el sonido se genera con Web Audio.

## Modo de exposición

En la pantalla de título, la tecla `D` abre un salto a cualquier ronda. No se muestra durante la partida.

## Autoprueba

`index.html?autoprueba=1` simula 1000 partidas sin dibujar la interfaz y escribe el resultado en la consola: que no haya errores, que existan los 77 códigos de voz y que se puedan alcanzar los 5 saboteadores y los 5 finales.

## Créditos

Proyecto en equipo de la materia Administración. Integrantes: María Isabel Ceballos Girón (239290), Luz Aida Zamorano Muñiz (239300), Danna Kristell Rosas Jiménez (239266), Daniela Paulina Noriega Carmona (239215) y Jimena Castellanos Solis (239071). Voz de Isabel: María Isabel Ceballos Girón. La pantalla Créditos ya lleva estos datos.
