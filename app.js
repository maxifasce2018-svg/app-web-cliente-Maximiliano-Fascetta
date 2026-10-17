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
     *  BUSCADOR EN TIEMPO REAL Y SISTEMA DE FILTROS
     * ============================================================
     *  Tanto el buscador del header como el formulario de filtros
     *  conviven en una misma función filtrarProductos(), para que
     *  al escribir o al aplicar/limpiar filtros se respeten ambas
     *  condiciones al mismo tiempo.
     * ============================================================
     */
    const formBusqueda = document.querySelector(".nav-search-bar");
    const inputBusqueda = document.querySelector(".nav-search-input");
    const seccionCatalogo = document.querySelector(".catalog");
    const grillaProductos = document.querySelector(".product-grid");

    const formFiltros = document.querySelector(".filter-form");
    const dropdownFiltros = document.querySelector(".nav-filter-dropdown");
    const checkboxesCategoria = document.querySelectorAll('input[name="categoria"]');
    const selectColeccion = document.querySelector(".filter-select");
    const inputPrecioMax = document.querySelector('input[name="precio_max"]');
    const grupoRange = document.querySelector(".range-group");

    // 1) Span al lado del range "Precio máximo" que muestra "Hasta $X USD" en vivo
    const spanPrecio = document.createElement("span");
    spanPrecio.classList.add("range-value");
    spanPrecio.textContent = `Hasta $${inputPrecioMax.value} USD`;
    grupoRange.appendChild(spanPrecio);

    inputPrecioMax.addEventListener("input", () => {
        spanPrecio.textContent = `Hasta $${inputPrecioMax.value} USD`;
    });

    // 3) Contador arriba del grid: "Mostrando X de 7 productos"
    const totalProductos = tarjetas.length;
    const contadorProductos = document.createElement("p");
    contadorProductos.textContent = `Mostrando ${totalProductos} de ${totalProductos} productos`;
    seccionCatalogo.insertBefore(contadorProductos, grillaProductos);

    // 4) Botón "Limpiar filtros" dentro del formulario de filtros
    const btnLimpiar = document.createElement("button");
    btnLimpiar.type = "button";
    btnLimpiar.classList.add("btn-apply");
    btnLimpiar.textContent = "Limpiar filtros";
    formFiltros.appendChild(btnLimpiar);

    // Variable para guardar la referencia al mensaje de "sin resultados"
    let mensajeSinResultados = null;

    // Función que evalúa el buscador + los filtros activos al mismo tiempo
    const filtrarProductos = () => {
        // Texto del buscador limpio y en minúsculas
        const textoBuscado = inputBusqueda.value.trim().toLowerCase();

        // Obtenemos los checkboxes marcados y usamos map() para quedarnos con sus value
        const checksMarcados = document.querySelectorAll('input[name="categoria"]:checked');
        const categoriasSeleccionadas = Array.from(checksMarcados).map((checkbox) => checkbox.value);

        // Leemos el select de colección y el range de precio máximo
        const coleccionSeleccionada = selectColeccion.value;
        const precioMaximo = Number(inputPrecioMax.value);

        // Contador para saber cuántas tarjetas quedaron visibles
        let resultadosVisibles = 0;

        for (const tarjeta of tarjetas) {
            const titulo = tarjeta.querySelector(".product-title").textContent.toLowerCase();
            const categoriaTarjeta = tarjeta.dataset.categoria;
            const coleccionTarjeta = tarjeta.dataset.coleccion;
            const precioTarjeta = Number(tarjeta.dataset.precio);

            // Condición 1: coincide con el texto del buscador
            const coincideBusqueda = titulo.includes(textoBuscado);

            // Condición 2: si no hay categorías marcadas se muestran todas; si hay, debe estar incluida
            const coincideCategoria = categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(categoriaTarjeta);

            // Condición 3: si el select está en "" (todas) o coincide con la colección de la tarjeta
            const coincideColeccion = coleccionSeleccionada === "" || coleccionTarjeta === coleccionSeleccionada;

            // Condición 4: el precio de la tarjeta es menor o igual al máximo elegido
            const coincidePrecio = precioTarjeta <= precioMaximo;

            // Combinamos todas las condiciones con &&
            if (coincideBusqueda && coincideCategoria && coincideColeccion && coincidePrecio) {
                tarjeta.classList.remove("oculto");
                resultadosVisibles = resultadosVisibles + 1;
            } else {
                tarjeta.classList.add("oculto");
            }
        }

        // Actualizamos el texto del contador arriba del grid
        contadorProductos.textContent = `Mostrando ${resultadosVisibles} de ${totalProductos} productos`;

        // Si no quedó ninguna tarjeta visible, mostramos el mensaje debajo del grid
        if (resultadosVisibles === 0) {
            if (mensajeSinResultados === null) {
                mensajeSinResultados = document.createElement("p");
                seccionCatalogo.appendChild(mensajeSinResultados);
            }
            mensajeSinResultados.textContent = `No encontramos productos para: ${inputBusqueda.value.trim()}`;
        } else {
            // Si volvió a haber resultados y el mensaje estaba en pantalla, lo quitamos
            if (mensajeSinResultados !== null) {
                mensajeSinResultados.remove();
                mensajeSinResultados = null;
            }
        }
    };

    // Cancelamos el envío del formulario de búsqueda para que no recargue la página
    formBusqueda.addEventListener("submit", (e) => {
        e.preventDefault();
    });

    // Escuchamos cada vez que el usuario escribe o borra en el buscador
    inputBusqueda.addEventListener("input", () => {
        filtrarProductos();
    });

    // 2) Al enviar el formulario de filtros, cancelamos el submit, filtramos y cerramos el menú
    formFiltros.addEventListener("submit", (e) => {
        e.preventDefault();
        filtrarProductos();
        dropdownFiltros.open = false;
    });

    // Evento del botón "Limpiar filtros": resetea los controles, muestra todo y cierra el menú
    btnLimpiar.addEventListener("click", () => {
        for (const checkbox of checkboxesCategoria) {
            checkbox.checked = false;
        }
        selectColeccion.value = "";
        inputPrecioMax.value = 500;
        spanPrecio.textContent = `Hasta $${inputPrecioMax.value} USD`;

        // También limpiamos el buscador para mostrar todos los productos
        inputBusqueda.value = "";

        filtrarProductos();
        dropdownFiltros.open = false;
    });
}


