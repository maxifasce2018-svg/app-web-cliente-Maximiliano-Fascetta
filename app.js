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

/*
 * ============================================================
 *  CATÁLOGO: LECTURA DE DATOS DE LAS TARJETAS (data-*)
 * ============================================================
 *  Cada .product-card del index.html tiene atributos data-*:
 *      data-categoria -> mismo valor que los checkboxes del filtro
 *      data-coleccion -> mismo valor que las opciones del select
 *      data-precio    -> solo el número (sin "$" ni "USD")
 *      data-badge     -> nuevo, oferta o popular
 *  Desde JS se leen con la propiedad dataset de cada elemento.
 *  Recorremos las tarjetas con for...of, armamos un array de
 *  objetos y lo mostramos en consola con console.table().
 * ============================================================
 */
if (paginaActual === "index") {
    // Seleccionamos todas las tarjetas de producto
    const tarjetas = document.querySelectorAll(".product-card");

    // Array donde vamos a guardar un objeto por cada producto
    const productos = [];

    for (const tarjeta of tarjetas) {
        // El nombre lo tomamos del título visible de la tarjeta
        const nombre = tarjeta.querySelector(".product-title").textContent;

        const producto = {
            nombre: nombre,
            categoria: tarjeta.dataset.categoria,
            coleccion: tarjeta.dataset.coleccion,
            // dataset siempre devuelve texto, por eso lo convertimos a número
            precio: Number(tarjeta.dataset.precio),
            badge: tarjeta.dataset.badge
        };

        productos.push(producto);
    }

    // Mostramos todos los productos en forma de tabla en la consola
    console.table(productos);
}

