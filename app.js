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

    /*
     * ============================================================
     *  BUSCADOR EN TIEMPO REAL (HEADER)
     * ============================================================
     *  Filtra las .product-card a medida que el usuario escribe
     *  en el input de búsqueda (evento "input").
     *  Compara el texto buscado con el título de cada tarjeta
     *  usando trim(), toLowerCase() e includes().
     *  Si no coincide ninguna, muestra un mensaje debajo del grid
     *  creado con createElement, y lo quita con remove() cuando
     *  vuelve a haber resultados.
     * ============================================================
     */
    const formBusqueda = document.querySelector(".nav-search-bar");
    const inputBusqueda = document.querySelector(".nav-search-input");
    const seccionCatalogo = document.querySelector(".catalog");

    // Variable para guardar la referencia al mensaje de "sin resultados"
    let mensajeSinResultados = null;

    // Cancelamos el envío del formulario para que no recargue la página
    formBusqueda.addEventListener("submit", (e) => {
        e.preventDefault();
    });

    // Escuchamos cada vez que el usuario escribe o borra en el buscador
    inputBusqueda.addEventListener("input", () => {
        // Limpiamos espacios en los bordes y pasamos a minúsculas
        const textoBuscado = inputBusqueda.value.trim().toLowerCase();

        // Contador para saber cuántas tarjetas quedaron visibles
        let resultadosVisibles = 0;

        for (const tarjeta of tarjetas) {
            const titulo = tarjeta.querySelector(".product-title").textContent.toLowerCase();

            // Si el título incluye lo que escribió el usuario, mostramos la tarjeta
            if (titulo.includes(textoBuscado)) {
                tarjeta.classList.remove("oculto");
                resultadosVisibles = resultadosVisibles + 1;
            } else {
                // Si no coincide, la ocultamos con la clase .oculto
                tarjeta.classList.add("oculto");
            }
        }

        // Si no quedó ninguna tarjeta visible, mostramos el mensaje debajo del grid
        if (resultadosVisibles === 0) {
            // Si el mensaje todavía no existe en el DOM, lo creamos y lo agregamos
            if (mensajeSinResultados === null) {
                mensajeSinResultados = document.createElement("p");
                seccionCatalogo.appendChild(mensajeSinResultados);
            }
            // Actualizamos el texto con template literal mostrando lo que buscó el usuario
            mensajeSinResultados.textContent = `No encontramos productos para: ${inputBusqueda.value.trim()}`;
        } else {
            // Si volvió a haber resultados y el mensaje estaba en pantalla, lo quitamos
            if (mensajeSinResultados !== null) {
                mensajeSinResultados.remove();
                mensajeSinResultados = null;
            }
        }
    });
}

