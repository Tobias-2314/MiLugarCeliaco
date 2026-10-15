# Web de Mi Lugar Celíaco

Web estática de una sola página para **milugarceliaco.store**. Sin cookies, sin analítica, sin formularios.

## Cómo funciona
- `contenido.json`: **todos los textos y datos** (nombre, teléfono, productos, titular...). Es lo único que normalmente tendrás que tocar.
- `public/`: diseño (`style.css`), imágenes (`img/`), icono.
- `build.mjs`: genera la web final en la carpeta `dist/` a partir de lo anterior.

Los textos que empiezan por `[COMPLETAR` salen resaltados en amarillo en la web. Cuando los sustituyas por texto real, desaparece el amarillo solo.

## Ver la web en tu ordenador
Necesitas [Node.js](https://nodejs.org) (versión 18 o superior). En una terminal, dentro de esta carpeta:

```
npm start
```

Abre http://localhost:8080 en el navegador. Para parar, pulsa `Ctrl + C`.

## Cambiar textos
1. Abre `contenido.json` con cualquier editor de texto.
2. Cambia el texto entre comillas (no borres las comillas ni las comas).
3. Guarda y ejecuta `npm start` otra vez para verlo.

Para quitar el botón de WhatsApp: `"whatsappActivo": false`. Cuando confirmes que lo usan: `"whatsappConfirmado": true`.
Para el enlace de reseñas: pega la URL de su ficha en `"resenasGoogle"`.

## Cambiar fotos
1. Copia la foto a `public/img/` (mejor JPG, de unos 1200 px de ancho y menos de 300 KB).
2. En `contenido.json`, en la tarjeta correspondiente, cambia `foto`, `alt` (descripción de lo que se ve), `ancho` y `alto`.

Las fotos actuales son de poca resolución; conviene sustituirlas por fotos propias de mayor calidad.

## Publicar cambios
La web se publica en Cloudflare Pages conectada a este repositorio. Cada vez que subes cambios a la rama `main`, se publica sola:

```
git add .
git commit -m "Actualizo textos"
git push
```

Configuración en Cloudflare Pages: comando de build `node build.mjs`, carpeta de salida `dist`.
