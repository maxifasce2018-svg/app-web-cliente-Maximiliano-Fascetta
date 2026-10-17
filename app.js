/*
 * ============================================================
 *  app.js - El Centro Pokécard
 * ============================================================
 *  Archivo principal de JavaScript del sitio.
 *  Se vincula en TODAS las páginas HTML con:
 *      <script src="app.js" defer></script>
 *  El atributo "defer" hace que el script se ejecute recién
 *  cuando el HTML terminó de cargarse, así los elementos ya
 *  existen cuando el JS los busca.
 *
 *  Cada página tiene en su <body> un atributo data-pagina
 *  (index, cart, producto, login, registro, recuperar, contacto)
 *  para que el JS sepa en qué página está y ejecute solo
 *  el código que corresponde.
 *
 *  REGLAS DEL CÓDIGO:
 *   - Usar const por defecto y let solo si la variable se reasigna.
 *   - NO usar var (es la forma antigua y causa bugs por el hoisting).
 *   - Comparar siempre con === y !== (nunca == ni !=).
 *   - Terminar cada línea con punto y coma ;
 *   - Preferir arrow functions para los callbacks.
 *   - Solo HTML, CSS y JS básico visto en clase
 *     (sin localStorage, Date, toFixed ni librerías).
 * ============================================================
 */

// Leemos en qué página estamos usando el atributo data-pagina del <body>
const paginaActual = document.body.dataset.pagina;

// Confirmación en consola de que el archivo cargó correctamente
console.log(`app.js cargado correctamente en la página: ${paginaActual}`);

