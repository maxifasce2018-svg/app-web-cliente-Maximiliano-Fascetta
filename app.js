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
 *  ÍNDICE DE SECCIONES DEL ARCHIVO:
 *   1. Inicialización y lectura de data-pagina (Todas las páginas)
 *   2. Catálogo desde Supabase con fetch y lectura de datos data-* (index.html)
 *   3. Buscador en tiempo real y sistema de filtros (index.html)
 *   4. Enlaces del menú de navegación con switch (index.html)
 *   5. Carrito de compras interactivo y resumen con reduce (cart.html)
 *   6. Detalle de producto: total en vivo y agregar al carrito (producto-*.html)
 *   7. Mostrar / ocultar contraseña con botón 👁 (login.html y registro.html)
 *   8. Validación del formulario de registro (registro.html)
 *   9. Formulario de inicio de sesión (login.html)
 *  10. Formulario de recuperar contraseña (recuperar-password.html)
 *  11. Formulario de contacto y contador de caracteres (contacto.html)
 *  12. Acordeones exclusivos <details> en FAQ y productos (contacto.html y producto-*.html)
 *  13. Mejoras de navegación: menú mobile, click afuera en filtros y link activo (Todas las páginas)
 *
 * ============================================================
 */

/*
 * ============================================================
 *  1. INICIALIZACIÓN Y LECTURA DE PÁGINA ACTUAL
 * ============================================================
 *  Páginas donde actúa: TODAS.
 *  Qué hace: Lee document.body.dataset.pagina para identificar
 *  la página actual y muestra un mensaje en consola. Si falta
 *  el atributo, avisa con console.warn.
 * ============================================================
 */
const paginaActual = document.body.dataset.pagina;

if (!paginaActual) {
    console.warn("Advertencia: el <body> no tiene definido el atributo data-pagina.");
} else {
    console.log(`app.js cargado correctamente en la página: ${paginaActual}`);
}

/*
 * ============================================================
 *  2. CATÁLOGO DESDE SUPABASE (fetch) Y LECTURA DE DATOS (data-*)
 * ============================================================
 *  Página donde actúa: index.html (data-pagina="index").
 *  Qué hace:
 *   - Define UNA sola vez SUPABASE_URL, SUPABASE_KEY y el objeto
 *     headers que se usan en las peticiones con fetch.
 *   - obtenerProductos(): arrow function async que hace un GET a
 *     /rest/v1/productos con try/catch y if (!res.ok), y devuelve
 *     los productos con res.json() (o null si algo falla).
 *   - crearTarjeta(): arma cada .product-card con createElement,
 *     guardando categoria, coleccion, precio y badge en data-*
 *     mediante dataset.
 *   - Mientras carga muestra "Cargando productos..." y si falla
 *     muestra un mensaje de error con textContent.
 *   - Cuando las tarjetas ya están en el .product-grid (creadas con
 *     .map()), ejecuta iniciarCatalogo(), que recorre las tarjetas
 *     con for...of, lee sus data-* (precio con Number()), las
 *     muestra con console.table() y activa el buscador, los
 *     filtros, el contador y los links del menú (secciones 3 y 4).
 * ============================================================
 */
const SUPABASE_URL = "https://vwomelsxjbhvijfrrize.supabase.co";
const SUPABASE_KEY = "sb_publishable_TWFfoLPf_qVAldaGeeXy1g_pAJQNQDX";

const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
};

// GET de todos los productos ordenados por id. Devuelve el array o null si falla.
const obtenerProductos = async () => {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/productos?select=*&order=id.asc`, {
            method: "GET",
            headers: headers
        });

        if (!res.ok) {
            throw new Error(`Error HTTP ${res.status} al pedir los productos`);
        }

        const productos = await res.json();
        return productos;
    } catch (error) {
        console.error("No se pudieron obtener los productos de Supabase:", error);
        return null;
    }
};

// Texto y clase CSS de cada badge según el valor guardado en Supabase
const textosBadge = { nuevo: "NUEVO", oferta: "OFERTA", popular: "POPULAR" };
const clasesBadge = { nuevo: "badge-new", oferta: "badge-sale", popular: "badge-popular" };

// Crea un <article class="product-card"> con la misma estructura que tenía el HTML
const crearTarjeta = (producto) => {
    const tarjeta = document.createElement("article");
    tarjeta.classList.add("product-card");
    tarjeta.dataset.categoria = producto.categoria;
    tarjeta.dataset.coleccion = producto.coleccion;
    tarjeta.dataset.precio = producto.precio;
    tarjeta.dataset.badge = producto.badge !== null ? producto.badge : "";

    // Imagen + badge
    const contenedorImagen = document.createElement("div");
    contenedorImagen.classList.add("product-image");

    if (clasesBadge[producto.badge] !== undefined) {
        const badge = document.createElement("span");
        badge.classList.add("card-badge", clasesBadge[producto.badge]);
        badge.textContent = textosBadge[producto.badge];
        contenedorImagen.appendChild(badge);
    }

    const imagen = document.createElement("img");
    imagen.src = producto.imagen_url;
    imagen.alt = producto.nombre;
    contenedorImagen.appendChild(imagen);

    // Cuerpo: título, descripción (si existe en la tabla), precio y link
    const cuerpo = document.createElement("div");
    cuerpo.classList.add("product-body");

    const titulo = document.createElement("h3");
    titulo.classList.add("product-title");
    titulo.textContent = producto.nombre;
    cuerpo.appendChild(titulo);

    if (producto.descripcion) {
        const descripcion = document.createElement("p");
        descripcion.classList.add("product-description");
        descripcion.textContent = producto.descripcion;
        cuerpo.appendChild(descripcion);
    }

    const precio = document.createElement("p");
    precio.classList.add("product-price");
    precio.textContent = `$${producto.precio} USD`;
    cuerpo.appendChild(precio);

    const link = document.createElement("a");
    link.href = producto.pagina_detalle;
    link.classList.add("product-link");
    link.textContent = "Ver Detalle";
    cuerpo.appendChild(link);

    tarjeta.append(contenedorImagen, cuerpo);
    return tarjeta;
};

// Todo lo que depende de las tarjetas se ejecuta recién cuando ya fueron creadas
const iniciarCatalogo = () => {
    const tarjetas = document.querySelectorAll(".product-card");

    if (tarjetas.length === 0) {
        console.warn("No se encontraron tarjetas .product-card en index.html.");
    } else {
        const productos = [];

        for (const tarjeta of tarjetas) {
            const elementoTitulo = tarjeta.querySelector(".product-title");
            const nombre = elementoTitulo !== null ? elementoTitulo.textContent : "";

            const producto = {
                nombre: nombre,
                categoria: tarjeta.dataset.categoria,
                coleccion: tarjeta.dataset.coleccion,
                precio: Number(tarjeta.dataset.precio),
                badge: tarjeta.dataset.badge
            };

            productos.push(producto);
        }

        console.table(productos);
    }

    /*
     * ============================================================
     *  3. BUSCADOR EN TIEMPO REAL Y SISTEMA DE FILTROS
     * ============================================================
     *  Página donde actúa: index.html (data-pagina="index").
     *  Qué hace:
     *   - Agrega un <span> al lado del range que muestra "Hasta $X USD"
     *     actualizado en vivo con el evento "input".
     *   - Agrega el contador "Mostrando X de 7 productos" arriba del grid.
     *   - Agrega el botón "Limpiar filtros".
     *   - Filtra las tarjetas combinando buscador + checkboxes (map)
     *     + select + range con &&. Si no hay resultados, crea un
     *     mensaje con createElement y lo quita con remove().
     *   - En celular ubica el buscador al lado del menú hamburguesa.
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
    const headerPagina = document.querySelector(".page-header");

    if (
        formBusqueda === null ||
        inputBusqueda === null ||
        seccionCatalogo === null ||
        grillaProductos === null ||
        formFiltros === null ||
        dropdownFiltros === null ||
        selectColeccion === null ||
        inputPrecioMax === null ||
        grupoRange === null ||
        headerPagina === null
    ) {
        console.warn("Faltan elementos del buscador o del formulario de filtros en index.html.");
    } else {
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

        // Función que lleva la pantalla al inicio de "Catálogo de Productos"
        // restando la altura del header sticky para que no tape el título
        const irACatalogo = () => {
            const alturaHeader = headerPagina.offsetHeight;
            const posicionCatalogo = seccionCatalogo.offsetTop - alturaHeader - 15;
            window.scrollTo({ top: posicionCatalogo, behavior: "smooth" });
        };

        // Función que evalúa el buscador + los filtros activos al mismo tiempo
        const filtrarProductos = () => {
            const textoBuscado = inputBusqueda.value.trim().toLowerCase();

            // Obtenemos los checkboxes marcados y usamos map() para quedarnos con sus value
            const checksMarcados = document.querySelectorAll('input[name="categoria"]:checked');
            const categoriasSeleccionadas = Array.from(checksMarcados).map((checkbox) => checkbox.value);

            // Leemos el select de colección y el range de precio máximo
            const coleccionSeleccionada = selectColeccion.value;
            const precioMaximo = Number(inputPrecioMax.value);

            let resultadosVisibles = 0;

            for (const tarjeta of tarjetas) {
                const titulo = tarjeta.querySelector(".product-title").textContent.toLowerCase();
                const categoriaTarjeta = tarjeta.dataset.categoria;
                const coleccionTarjeta = tarjeta.dataset.coleccion;
                const precioTarjeta = Number(tarjeta.dataset.precio);

                const coincideBusqueda = titulo.includes(textoBuscado);
                const coincideCategoria = categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(categoriaTarjeta);
                const coincideColeccion = coleccionSeleccionada === "" || coleccionTarjeta === coleccionSeleccionada;
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
                if (mensajeSinResultados !== null) {
                    mensajeSinResultados.remove();
                    mensajeSinResultados = null;
                }
            }
        };

        // Función reutilizable que vuelve todos los controles a su estado inicial
        // (checkboxes destildados, colección "Todas", precio en 500 y buscador vacío)
        // y vuelve a filtrar para mostrar todos los productos.
        // La usan: el botón "Limpiar filtros" y los links Inicio, Catálogo y Ofertas.
        const limpiarFiltros = () => {
            for (const checkbox of checkboxesCategoria) {
                checkbox.checked = false;
            }
            selectColeccion.value = "";
            inputPrecioMax.value = 500;
            spanPrecio.textContent = `Hasta $${inputPrecioMax.value} USD`;
            inputBusqueda.value = "";

            filtrarProductos();
        };

        // Cancelamos el envío del formulario de búsqueda y llevamos la vista a los productos
        formBusqueda.addEventListener("submit", (e) => {
            e.preventDefault();
            irACatalogo();
            inputBusqueda.blur();
        });

        // Escuchamos cada vez que el usuario escribe o borra en el buscador
        inputBusqueda.addEventListener("input", () => {
            filtrarProductos();

            if (window.innerWidth <= 768 && inputBusqueda.value.trim() !== "") {
                irACatalogo();
            }
        });

        // En celular (<= 768px), ubicamos la barra de búsqueda afuera, al lado del botón hamburguesa
        const barraMobile = document.querySelector(".mobile-menu-bar");
        const btnCarritoMobile = document.querySelector(".mobile-cart-btn");
        const listaAccionesNav = document.querySelector(".nav-actions-list");

        if (barraMobile !== null && btnCarritoMobile !== null && listaAccionesNav !== null) {
            const ubicarBuscadorSegunPantalla = () => {
                if (window.innerWidth <= 768) {
                    if (formBusqueda.parentElement !== barraMobile) {
                        barraMobile.insertBefore(formBusqueda, btnCarritoMobile);
                    }
                } else {
                    if (formBusqueda.parentElement !== listaAccionesNav.parentElement) {
                        listaAccionesNav.before(formBusqueda);
                    }
                }
            };

            ubicarBuscadorSegunPantalla();
            window.addEventListener("resize", ubicarBuscadorSegunPantalla);
        }

        // 2) Al enviar el formulario de filtros, cancelamos el submit, filtramos y cerramos el menú
        formFiltros.addEventListener("submit", (e) => {
            e.preventDefault();
            filtrarProductos();
            dropdownFiltros.open = false;
            irACatalogo();
        });

        // Evento del botón "Limpiar filtros": resetea los controles, muestra todo y cierra el menú
        btnLimpiar.addEventListener("click", () => {
            limpiarFiltros();
            dropdownFiltros.open = false;
            irACatalogo();
        });

        /*
         * ============================================================
         *  4. ENLACES DEL MENÚ DE NAVEGACIÓN (Ofertas, Colecciones)
         * ============================================================
         *  Página donde actúa: index.html (data-pagina="index").
         *  Qué hace: Escucha el click en los links con data-accion y
         *  usa un switch sobre link.dataset.accion:
         *   - "ofertas": muestra solo las tarjetas con data-badge="oferta".
         *   - "colecciones": abre el desplegable de filtros con setAttribute("open", "").
         *   - "inicio" / "catalogo": limpian los filtros y vuelven a mostrar todo.
         * ============================================================
         */
        const linksMenu = document.querySelectorAll(".nav-list a[data-accion]");

        if (linksMenu.length === 0) {
            console.warn("No se encontraron enlaces con data-accion en el menú de index.html.");
        } else {
            for (const link of linksMenu) {
                link.addEventListener("click", (e) => {
                    const accion = link.dataset.accion;

                    switch (accion) {
                        case "ofertas": {
                            e.preventDefault();

                            // Primero limpiamos filtros y buscador para que no quede texto viejo
                            limpiarFiltros();

                            let ofertasVisibles = 0;

                            for (const tarjeta of tarjetas) {
                                if (tarjeta.dataset.badge === "oferta") {
                                    tarjeta.classList.remove("oculto");
                                    ofertasVisibles = ofertasVisibles + 1;
                                } else {
                                    tarjeta.classList.add("oculto");
                                }
                            }

                            contadorProductos.textContent = `Mostrando ${ofertasVisibles} de ${totalProductos} productos`;
                            irACatalogo();
                            break;
                        }

                        case "colecciones": {
                            e.preventDefault();
                            dropdownFiltros.setAttribute("open", "");
                            break;
                        }

                        case "inicio": {
                            e.preventDefault();
                            limpiarFiltros();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            break;
                        }

                        case "catalogo": {
                            e.preventDefault();
                            limpiarFiltros();
                            irACatalogo();
                            break;
                        }
                    }
                });
            }
        }
    }
};

// Carga del catálogo: mensaje "Cargando...", fetch, .map() de tarjetas e inicio del buscador/filtros
if (paginaActual === "index") {
    const grillaCatalogo = document.querySelector(".product-grid");
    const seccionCatalogo = document.querySelector(".catalog");

    if (grillaCatalogo === null || seccionCatalogo === null) {
        console.warn("No se encontró el .product-grid o la sección .catalog en index.html.");
    } else {
        const mensajeEstado = document.createElement("p");
        mensajeEstado.textContent = "Cargando productos...";
        seccionCatalogo.insertBefore(mensajeEstado, grillaCatalogo);

        const cargarCatalogo = async () => {
            const productos = await obtenerProductos();

            if (productos === null) {
                mensajeEstado.textContent = "No se pudieron cargar los productos. Por favor, intentá de nuevo más tarde.";
                return;
            }

            if (productos.length === 0) {
                mensajeEstado.textContent = "No hay productos disponibles por el momento.";
                return;
            }

            // Creamos todas las tarjetas con .map() y las agregamos al grid
            const tarjetasCreadas = productos.map((producto) => crearTarjeta(producto));
            grillaCatalogo.append(...tarjetasCreadas);
            mensajeEstado.remove();

            // Recién ahora que existen las tarjetas activamos buscador, filtros, contador y menú
            iniciarCatalogo();
        };

        cargarCatalogo();
    }
}

/*
 * ============================================================
 *  5. CARRITO DE COMPRAS INTERACTIVO (cart.html)
 * ============================================================
 *  Página donde actúa: cart.html (data-pagina="cart").
 *  Qué hace:
 *   - Inserta en cada .cart-item los botones "−", "+" y "Eliminar"
 *     usando createElement y append.
 *   - Usa UN solo addEventListener "click" en .cart-items (delegación)
 *     detectando el botón con e.target.matches() y el item con closest().
 *   - Mantiene la cantidad entre 1 y 20 con if/else.
 *   - calcularResumen() usa reduce() con valor inicial 0 para sumar
 *     artículos y subtotal, y un operador ternario para el envío
 *     (0 si subtotal >= 150, 15 si no).
 *   - Al hacer click en "Pagar Ahora" reemplaza .cart-summary con
 *     innerHTML mostrando el total abonado, o console.warn si está vacío.
 * ============================================================
 */
if (paginaActual === "cart") {
    const contenedorItems = document.querySelector(".cart-items");
    const itemsIniciales = document.querySelectorAll(".cart-item");
    const contenedorResumen = document.querySelector(".cart-summary");
    const filasResumen = document.querySelectorAll(".cart-summary .summary-row");
    const btnPagar = document.querySelector(".checkout-btn");

    if (
        contenedorItems === null ||
        contenedorResumen === null ||
        filasResumen.length < 3 ||
        btnPagar === null
    ) {
        console.warn("Faltan elementos esperados del carrito en cart.html.");
    } else {
        const labelSubtotal = filasResumen[0].querySelector(".summary-label");
        const valorSubtotal = filasResumen[0].querySelector(".summary-value");
        const valorEnvio = filasResumen[1].querySelector(".summary-value");
        const valorTotalFinal = filasResumen[2].querySelector(".summary-value");

        let totalFinalActual = 0;

        // Insertamos en cada .cart-item los botones "−", "+" y "Eliminar"
        for (const item of itemsIniciales) {
            const infoItem = item.querySelector(".cart-item-info");

            if (infoItem !== null) {
                const contenedorControles = document.createElement("div");
                contenedorControles.classList.add("cart-item-controls");

                const btnRestar = document.createElement("button");
                btnRestar.type = "button";
                btnRestar.classList.add("btn-qty", "btn-restar");
                btnRestar.textContent = "−";

                const btnSumar = document.createElement("button");
                btnSumar.type = "button";
                btnSumar.classList.add("btn-qty", "btn-sumar");
                btnSumar.textContent = "+";

                const btnEliminar = document.createElement("button");
                btnEliminar.type = "button";
                btnEliminar.classList.add("btn-remove-item");
                btnEliminar.textContent = "Eliminar";

                contenedorControles.append(btnRestar, btnSumar, btnEliminar);
                infoItem.append(contenedorControles);
            }
        }

        // Arrow function que recalcula el resumen del carrito con reduce()
        const calcularResumen = () => {
            const itemsActuales = Array.from(document.querySelectorAll(".cart-item"));

            // Calculamos la cantidad total de artículos con reduce (valor inicial 0)
            const totalArticulos = itemsActuales.reduce((acumulador, item) => {
                return acumulador + Number(item.dataset.cantidad);
            }, 0);

            // Calculamos el subtotal sumando precio * cantidad de cada item (valor inicial 0)
            const subtotal = itemsActuales.reduce((acumulador, item) => {
                const precio = Number(item.dataset.precio);
                const cantidad = Number(item.dataset.cantidad);
                return acumulador + (precio * cantidad);
            }, 0);

            // Si el carrito quedó vacío, vaciamos .cart-items, mostramos el mensaje y deshabilitamos el botón
            if (itemsActuales.length === 0) {
                contenedorItems.innerHTML = "";

                const bloqueVacio = document.createElement("div");
                bloqueVacio.classList.add("cart-empty-msg");

                const textoVacio = document.createElement("p");
                textoVacio.textContent = "Tu carrito está vacío";

                const linkCatalogo = document.createElement("a");
                linkCatalogo.href = "index.html";
                linkCatalogo.classList.add("cart-empty-link");
                linkCatalogo.textContent = "Volver al catálogo";

                bloqueVacio.append(textoVacio, linkCatalogo);
                contenedorItems.append(bloqueVacio);

                totalFinalActual = 0;
                labelSubtotal.textContent = "Subtotal (0 artículos)";
                valorSubtotal.textContent = "$0 USD";
                valorEnvio.textContent = "$0 USD";
                valorTotalFinal.textContent = "$0 USD";
                btnPagar.setAttribute("disabled", "");
                return;
            }

            // El envío es 0 si el subtotal es >= 150 y 15 si no (operador ternario)
            const costoEnvio = subtotal >= 150 ? 0 : 15;
            const totalFinal = subtotal + costoEnvio;
            totalFinalActual = totalFinal;

            labelSubtotal.textContent = `Subtotal (${totalArticulos} artículos)`;
            valorSubtotal.textContent = `$${subtotal} USD`;
            valorEnvio.textContent = costoEnvio === 0 ? "GRATIS" : `$${costoEnvio} USD`;
            valorTotalFinal.textContent = `$${totalFinal} USD`;
        };

        // Arrow function reutilizable que actualiza un item del carrito con una nueva cantidad.
        // Mantiene la cantidad entre 1 y 20 (if/else), guarda el valor en el dataset,
        // actualiza los textos "Cantidad: N" y el total del item, y recalcula el resumen.
        const actualizarItem = (item, cantidad) => {
            let cantidadFinal = cantidad;

            if (cantidadFinal < 1) {
                cantidadFinal = 1;
            } else if (cantidadFinal > 20) {
                cantidadFinal = 20;
            }

            const precio = Number(item.dataset.precio);

            item.dataset.cantidad = cantidadFinal;
            item.querySelector(".cart-item-qty").textContent = `Cantidad: ${cantidadFinal}`;
            item.querySelector(".cart-item-total-price").textContent = `$${precio * cantidadFinal} USD`;
            calcularResumen();
        };

        // UN solo addEventListener "click" en .cart-items (delegación de eventos)
        contenedorItems.addEventListener("click", (e) => {
            const item = e.target.closest(".cart-item");
            if (item === null) {
                return;
            }

            const cantidad = Number(item.dataset.cantidad);

            if (e.target.matches(".btn-restar")) {
                // Restamos 1 (actualizarItem se encarga de no bajar de 1)
                actualizarItem(item, cantidad - 1);
            } else if (e.target.matches(".btn-sumar")) {
                // Sumamos 1 (actualizarItem se encarga de no pasar de 20)
                actualizarItem(item, cantidad + 1);
            } else if (e.target.matches(".btn-remove-item")) {
                item.remove();
                calcularResumen();
            }
        });

        // Evento click en "Pagar Ahora"
        btnPagar.addEventListener("click", () => {
            const itemsActuales = document.querySelectorAll(".cart-item");

            if (itemsActuales.length === 0) {
                console.warn("No se puede realizar el pago: el carrito está vacío.");
                return;
            }

            contenedorResumen.innerHTML = `
                <h2 class="summary-title">¡Compra Confirmada!</h2>
                <p class="summary-label">¡Gracias por tu compra! Total abonado: $${totalFinalActual} USD</p>
                <a href="index.html" class="continue-shopping">Volver al inicio</a>
            `;
        });

        // Ejecutamos calcularResumen() al cargar la página
        calcularResumen();
    }
}

/*
 * ============================================================
 *  6. DETALLE DE PRODUCTO (las 7 páginas producto-*.html)
 * ============================================================
 *  Páginas donde actúa: producto-*.html (data-pagina="producto").
 *  Qué hace:
 *   - Lee el id del producto desde data-id del <body> y hace un GET a
 *     /rest/v1/productos?id=eq.ID (cargarPrecioProducto) para obtener
 *     el precio real desde Supabase. Mientras responde, usa como
 *     respaldo el data-precio del span .price.
 *   - Muestra debajo del input cantidad "Total: $X USD" y lo actualiza
 *     con el evento "input" (corrigiendo entre 1 y 20 con if/else).
 *   - Al enviar "Añadir al Carrito" (agregarAlCarrito):
 *       1) GET al carrito y .find() para ver si el producto ya está.
 *       2) Si no está: POST a /rest/v1/carrito con { producto_id, cantidad }.
 *       3) Si está: PATCH a /rest/v1/carrito?id=eq.ID sumando la
 *          cantidad (máximo 20).
 *     Usa try/catch e if (!res.ok), deshabilita el botón mientras
 *     espera y muestra "✔ Agregaste N × NOMBRE" con un link "Ir al
 *     carrito" solo si salió bien, o un mensaje de error si falló.
 * ============================================================
 */
if (paginaActual === "producto") {
    const elementoTituloProducto = document.querySelector(".detail-title");
    const spanPrecioUnitario = document.querySelector(".price");
    const formAgregar = document.querySelector(".add-to-cart-form");
    const selectorCantidad = document.querySelector(".quantity-selector");
    const inputCantidad = document.querySelector("#cantidad");
    const btnAgregar = document.querySelector(".add-to-cart-btn");
    const idProducto = Number(document.body.dataset.id);

    if (
        elementoTituloProducto === null ||
        spanPrecioUnitario === null ||
        formAgregar === null ||
        selectorCantidad === null ||
        inputCantidad === null ||
        btnAgregar === null ||
        !idProducto
    ) {
        console.warn("Faltan elementos esperados (o el data-id del <body>) en la página de detalle de producto.");
    } else {
        const tituloProducto = elementoTituloProducto.textContent;
        const CANTIDAD_MAXIMA = 20;

        // Precio de respaldo (el del HTML) hasta que responda Supabase
        let precioUnitario = Number(spanPrecioUnitario.dataset.precio);

        // Creamos el texto "Total: $X USD" y lo ubicamos debajo del selector de cantidad
        const textoTotal = document.createElement("p");
        textoTotal.classList.add("detail-total-preview");
        textoTotal.textContent = `Total: $${precioUnitario * Number(inputCantidad.value)} USD`;
        selectorCantidad.after(textoTotal);

        let mensajeAgregado = null;

        // Función que valida el rango (1 a 20) con if/else y actualiza el total
        const actualizarTotalProducto = () => {
            let cantidad = Number(inputCantidad.value);

            if (cantidad < 1) {
                cantidad = 1;
                inputCantidad.value = 1;
            } else if (cantidad > 20) {
                cantidad = 20;
                inputCantidad.value = 20;
            }

            textoTotal.textContent = `Total: $${precioUnitario * cantidad} USD`;
        };

        inputCantidad.addEventListener("input", () => {
            actualizarTotalProducto();
        });

        // GET del producto en Supabase para usar su precio en el total en vivo
        const cargarPrecioProducto = async () => {
            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/productos?id=eq.${idProducto}`, {
                    method: "GET",
                    headers: headers
                });

                if (!res.ok) {
                    throw new Error(`Error HTTP ${res.status} al pedir el producto`);
                }

                const datos = await res.json();

                if (datos.length === 0) {
                    throw new Error(`No existe el producto con id ${idProducto} en Supabase`);
                }

                precioUnitario = Number(datos[0].precio);
                spanPrecioUnitario.dataset.precio = precioUnitario;
                actualizarTotalProducto();
            } catch (error) {
                console.warn("No se pudo leer el precio desde Supabase, se usa el del HTML:", error);
            }
        };

        cargarPrecioProducto();

        // Quita el mensaje anterior (de éxito o de error) si existe
        const quitarMensajeAnterior = () => {
            if (mensajeAgregado !== null) {
                mensajeAgregado.remove();
                mensajeAgregado = null;
            }
        };

        // Muestra "✔ Agregaste N × NOMBRE" con el link "Ir al carrito"
        const mostrarMensajeExito = (cantidad) => {
            quitarMensajeAnterior();

            mensajeAgregado = document.createElement("div");
            mensajeAgregado.classList.add("added-to-cart-msg");

            const spanTexto = document.createElement("span");
            spanTexto.textContent = `✔ Agregaste ${cantidad} × ${tituloProducto}`;

            const linkCarrito = document.createElement("a");
            linkCarrito.href = "cart.html";
            linkCarrito.classList.add("added-to-cart-link");
            linkCarrito.textContent = "Ir al carrito";

            mensajeAgregado.append(spanTexto, linkCarrito);
            formAgregar.after(mensajeAgregado);
        };

        // Muestra un mensaje de error debajo del formulario (usa la clase .error-msg existente)
        const mostrarMensajeError = (texto) => {
            quitarMensajeAnterior();

            mensajeAgregado = document.createElement("p");
            mensajeAgregado.classList.add("error-msg");
            mensajeAgregado.textContent = texto;
            formAgregar.after(mensajeAgregado);
        };

        // GET al carrito + .find(); si no está hace POST, si está hace PATCH (máximo 20).
        // Devuelve la cantidad realmente agregada.
        const agregarAlCarrito = async (cantidad) => {
            const resCarrito = await fetch(`${SUPABASE_URL}/rest/v1/carrito?select=*`, {
                method: "GET",
                headers: headers
            });

            if (!resCarrito.ok) {
                throw new Error(`Error HTTP ${resCarrito.status} al leer el carrito`);
            }

            const itemsCarrito = await resCarrito.json();
            const itemExistente = itemsCarrito.find((item) => item.producto_id === idProducto);

            if (itemExistente === undefined) {
                const resPost = await fetch(`${SUPABASE_URL}/rest/v1/carrito`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({ producto_id: idProducto, cantidad: cantidad })
                });

                if (!resPost.ok) {
                    throw new Error(`Error HTTP ${resPost.status} al agregar el producto al carrito`);
                }

                return cantidad;
            }

            const cantidadActual = Number(itemExistente.cantidad);

            if (cantidadActual >= CANTIDAD_MAXIMA) {
                throw new Error(`Ya tenés el máximo de ${CANTIDAD_MAXIMA} unidades de este producto en el carrito.`);
            }

            const nuevaCantidad = Math.min(cantidadActual + cantidad, CANTIDAD_MAXIMA);

            const resPatch = await fetch(`${SUPABASE_URL}/rest/v1/carrito?id=eq.${itemExistente.id}`, {
                method: "PATCH",
                headers: headers,
                body: JSON.stringify({ cantidad: nuevaCantidad })
            });

            if (!resPatch.ok) {
                throw new Error(`Error HTTP ${resPatch.status} al actualizar la cantidad en el carrito`);
            }

            return nuevaCantidad - cantidadActual;
        };

        formAgregar.addEventListener("submit", async (e) => {
            e.preventDefault();

            actualizarTotalProducto();
            const cantidadElegida = Number(inputCantidad.value);

            // Deshabilitamos el botón mientras esperamos la respuesta de Supabase
            btnAgregar.disabled = true;

            try {
                const cantidadAgregada = await agregarAlCarrito(cantidadElegida);
                mostrarMensajeExito(cantidadAgregada);
            } catch (error) {
                console.error("No se pudo agregar al carrito:", error);
                const texto = error.message.startsWith("Ya tenés")
                    ? error.message
                    : "No se pudo agregar el producto al carrito. Intentá de nuevo más tarde.";
                mostrarMensajeError(texto);
            } finally {
                btnAgregar.disabled = false;
            }
        });
    }
}

/*
 * ============================================================
 *  7. MOSTRAR / OCULTAR CONTRASEÑA (login.html y registro.html)
 * ============================================================
 *  Páginas donde actúa: login.html y registro.html (o cualquier
 *  página con input[type="password"]).
 *  Qué hace: Define una sola arrow function reutilizada con
 *  querySelectorAll + forEach que inserta al lado de cada input
 *  de contraseña un botón type="button" con "👁" que alterna
 *  entre type="password" (ojo tachado) y type="text" (ojo abierto)
 *  con getAttribute, setAttribute y un operador ternario.
 * ============================================================
 */
const agregarTogglePassword = (inputPassword) => {
    const contenedorPassword = document.createElement("div");
    contenedorPassword.classList.add("password-wrapper");

    inputPassword.before(contenedorPassword);
    contenedorPassword.appendChild(inputPassword);

    const btnVerPassword = document.createElement("button");
    btnVerPassword.type = "button";
    btnVerPassword.classList.add("btn-toggle-pass", "ojo-tachado");
    btnVerPassword.textContent = "👁";

    contenedorPassword.appendChild(btnVerPassword);

    btnVerPassword.addEventListener("click", () => {
        const tipoActual = inputPassword.getAttribute("type");
        const nuevoTipo = tipoActual === "password" ? "text" : "password";

        inputPassword.setAttribute("type", nuevoTipo);
        btnVerPassword.textContent = nuevoTipo === "password" ? "👁" : "👁";
        btnVerPassword.classList.toggle("ojo-tachado", nuevoTipo === "password");
    });
};

const inputsPasswordPagina = document.querySelectorAll('input[type="password"]');
inputsPasswordPagina.forEach(agregarTogglePassword);

/*
 * ============================================================
 *  8. FORMULARIO DE REGISTRO (registro.html)
 * ============================================================
 *  Página donde actúa: registro.html (data-pagina="registro").
 *  Qué hace:
 *   - Define la arrow function reutilizable mostrarError(input, mensaje)
 *     que agrega .input-error y un <span class="error-msg"> con after().
 *   - Al corregir el campo, quita .input-error y remueve el span.
 *   - En el submit verifica que nombre y apellido no queden vacíos
 *     tras trim() y que password y confirm_password sean iguales (!==).
 *   - Si todo es válido, hace preventDefault y reemplaza el formulario
 *     por "¡Cuenta creada, NOMBRE!".
 * ============================================================
 */
if (paginaActual === "registro") {
    const formRegistro = document.querySelector(".auth-form");
    const inputNombre = document.querySelector("#nombre");
    const inputApellido = document.querySelector("#apellido");
    const inputPassword = document.querySelector("#password");
    const inputConfirmPassword = document.querySelector("#confirm_password");

    if (
        formRegistro === null ||
        inputNombre === null ||
        inputApellido === null ||
        inputPassword === null ||
        inputConfirmPassword === null
    ) {
        console.warn("Faltan elementos esperados en el formulario de registro.html.");
    } else {
        const mostrarError = (input, mensaje) => {
            const grupo = input.closest(".form-group");
            const errorPrevio = grupo.querySelector(".error-msg");
            if (errorPrevio !== null) {
                errorPrevio.remove();
            }

            input.classList.add("input-error");

            const spanError = document.createElement("span");
            spanError.classList.add("error-msg");
            spanError.textContent = mensaje;

            const elementoReferencia = input.parentElement.classList.contains("password-wrapper")
                ? input.parentElement
                : input;
            elementoReferencia.after(spanError);
        };

        const limpiarError = (input) => {
            input.classList.remove("input-error");
            const grupo = input.closest(".form-group");
            const errorPrevio = grupo.querySelector(".error-msg");
            if (errorPrevio !== null) {
                errorPrevio.remove();
            }
        };

        inputNombre.addEventListener("input", () => {
            if (inputNombre.value.trim() !== "") {
                limpiarError(inputNombre);
            }
        });

        inputApellido.addEventListener("input", () => {
            if (inputApellido.value.trim() !== "") {
                limpiarError(inputApellido);
            }
        });

        inputPassword.addEventListener("input", () => {
            if (inputPassword.value === inputConfirmPassword.value) {
                limpiarError(inputConfirmPassword);
            }
        });

        inputConfirmPassword.addEventListener("input", () => {
            if (inputPassword.value === inputConfirmPassword.value) {
                limpiarError(inputConfirmPassword);
            }
        });

        formRegistro.addEventListener("submit", (e) => {
            e.preventDefault();

            limpiarError(inputNombre);
            limpiarError(inputApellido);
            limpiarError(inputConfirmPassword);

            let hayErrores = false;

            if (inputNombre.value.trim() === "") {
                mostrarError(inputNombre, "El nombre no puede quedar vacío.");
                hayErrores = true;
            }

            if (inputApellido.value.trim() === "") {
                mostrarError(inputApellido, "El apellido no puede quedar vacío.");
                hayErrores = true;
            }

            if (inputPassword.value !== inputConfirmPassword.value) {
                mostrarError(inputConfirmPassword, "Las contraseñas no coinciden.");
                hayErrores = true;
            }

            if (hayErrores) {
                return;
            }

            const nombreLimpio = inputNombre.value.trim();
            const mensajeExito = document.createElement("p");
            mensajeExito.classList.add("form-success-msg");
            mensajeExito.textContent = `¡Cuenta creada, ${nombreLimpio}!`;

            formRegistro.after(mensajeExito);
            formRegistro.remove();
        });
    }
}

/*
 * ============================================================
 *  9. FORMULARIO DE INICIO DE SESIÓN (login.html)
 * ============================================================
 *  Página donde actúa: login.html (data-pagina="login").
 *  Qué hace: Al enviar el formulario válido, cancela el envío
 *  con preventDefault(), oculta el formulario con classList.add("oculto")
 *  y muestra "¡Bienvenido de nuevo!" con template literal.
 * ============================================================
 */
if (paginaActual === "login") {
    const formLogin = document.querySelector(".auth-form");
    const inputEmailLogin = document.querySelector("#email");

    if (formLogin === null || inputEmailLogin === null) {
        console.warn("Faltan elementos esperados en el formulario de login.html.");
    } else {
        formLogin.addEventListener("submit", (e) => {
            e.preventDefault();

            const emailIngresado = inputEmailLogin.value.trim();
            formLogin.classList.add("oculto");

            const mensajeExito = document.createElement("p");
            mensajeExito.classList.add("form-success-msg");
            mensajeExito.textContent = `¡Bienvenido de nuevo! (${emailIngresado})`;

            formLogin.after(mensajeExito);
        });
    }
}

/*
 * ============================================================
 *  10. FORMULARIO DE RECUPERAR CONTRASEÑA (recuperar-password.html)
 * ============================================================
 *  Página donde actúa: recuperar-password.html (data-pagina="recuperar").
 *  Qué hace: Al enviar el formulario válido, cancela el envío con
 *  preventDefault(), lee el email con .value, oculta el formulario
 *  con classList.add("oculto") y muestra "Te enviamos un correo a EMAIL".
 * ============================================================
 */
if (paginaActual === "recuperar") {
    const formRecuperar = document.querySelector(".auth-form");
    const inputEmailRecuperar = document.querySelector("#email");

    if (formRecuperar === null || inputEmailRecuperar === null) {
        console.warn("Faltan elementos esperados en recuperar-password.html.");
    } else {
        formRecuperar.addEventListener("submit", (e) => {
            e.preventDefault();

            const email = inputEmailRecuperar.value.trim();
            formRecuperar.classList.add("oculto");

            const mensajeExito = document.createElement("p");
            mensajeExito.classList.add("form-success-msg");
            mensajeExito.textContent = `Te enviamos un correo a ${email}`;

            formRecuperar.after(mensajeExito);
        });
    }
}

/*
 * ============================================================
 *  11. FORMULARIO DE CONTACTO (contacto.html)
 * ============================================================
 *  Página donde actúa: contacto.html (data-pagina="contacto").
 *  Qué hace:
 *   - Agrega un contador "N / 500 caracteres" bajo el textarea que
 *     se actualiza con "input" usando .length y cambia de color con
 *     classList.toggle al pasar 450 caracteres.
 *   - Al hacer submit: preventDefault, muestra con console.table los
 *     datos enviados, oculta el formulario con classList.add("oculto")
 *     y muestra "¡Gracias NOMBRE! Te responderemos a EMAIL" junto al
 *     botón "Enviar otro mensaje" que limpia los campos (.value = "")
 *     y vuelve a mostrar el formulario.
 * ============================================================
 */
if (paginaActual === "contacto") {
    const formContacto = document.querySelector(".auth-form");
    const inputNombreContacto = document.querySelector("#nombre");
    const inputEmailContacto = document.querySelector("#email");
    const inputTelefonoContacto = document.querySelector("#telefono");
    const selectMotivoContacto = document.querySelector("#motivo");
    const textareaMensaje = document.querySelector("#mensaje");
    const checkPrivacidad = document.querySelector('input[name="privacidad"]');

    if (
        formContacto === null ||
        inputNombreContacto === null ||
        inputEmailContacto === null ||
        inputTelefonoContacto === null ||
        selectMotivoContacto === null ||
        textareaMensaje === null ||
        checkPrivacidad === null
    ) {
        console.warn("Faltan elementos esperados en el formulario de contacto.html.");
    } else {
        const contadorCaracteres = document.createElement("span");
        contadorCaracteres.classList.add("char-counter");
        contadorCaracteres.textContent = `${textareaMensaje.value.length} / 500 caracteres`;
        textareaMensaje.after(contadorCaracteres);

        textareaMensaje.addEventListener("input", () => {
            const cantidadCaracteres = textareaMensaje.value.length;
            contadorCaracteres.textContent = `${cantidadCaracteres} / 500 caracteres`;
            contadorCaracteres.classList.toggle("char-limit-warn", cantidadCaracteres > 450);
        });

        let bloqueExitoContacto = null;

        formContacto.addEventListener("submit", (e) => {
            e.preventDefault();

            const nombre = inputNombreContacto.value.trim();
            const email = inputEmailContacto.value.trim();
            const telefono = inputTelefonoContacto.value.trim();
            const motivo = selectMotivoContacto.value;
            const mensaje = textareaMensaje.value.trim();

            const datosEnviados = {
                nombre: nombre,
                email: email,
                telefono: telefono,
                motivo: motivo,
                mensaje: mensaje
            };
            console.table(datosEnviados);

            formContacto.classList.add("oculto");

            if (bloqueExitoContacto !== null) {
                bloqueExitoContacto.remove();
            }

            bloqueExitoContacto = document.createElement("div");
            bloqueExitoContacto.classList.add("form-success-msg");

            const textoExito = document.createElement("p");
            textoExito.textContent = `¡Gracias ${nombre}! Te responderemos a ${email}`;

            const btnOtroMensaje = document.createElement("button");
            btnOtroMensaje.type = "button";
            btnOtroMensaje.classList.add("auth-submit-btn");
            btnOtroMensaje.textContent = "Enviar otro mensaje";

            btnOtroMensaje.addEventListener("click", () => {
                inputNombreContacto.value = "";
                inputEmailContacto.value = "";
                inputTelefonoContacto.value = "";
                selectMotivoContacto.value = "";
                textareaMensaje.value = "";
                checkPrivacidad.checked = false;

                contadorCaracteres.textContent = "0 / 500 caracteres";
                contadorCaracteres.classList.remove("char-limit-warn");

                bloqueExitoContacto.remove();
                bloqueExitoContacto = null;
                formContacto.classList.remove("oculto");
            });

            bloqueExitoContacto.append(textoExito, btnOtroMensaje);
            formContacto.after(bloqueExitoContacto);
        });
    }
}

/*
 * ============================================================
 *  12. ACORDEONES EXCLUSIVOS (<details>) EN FAQ Y PRODUCTOS
 * ============================================================
 *  Páginas donde actúa: contacto.html (.faq-item) y las 7 páginas
 *  producto-*.html (.product-accordion).
 *  Qué hace: Al abrir un <details>, cierra automáticamente los
 *  demás usando querySelectorAll, el evento "toggle",
 *  hasAttribute("open") y removeAttribute("open") con forEach,
 *  comparando con !== para no cerrar el que se acaba de abrir.
 * ============================================================
 */
const configurarAcordeonExclusivo = (selector) => {
    const acordeones = document.querySelectorAll(selector);

    acordeones.forEach((acordeonActual) => {
        acordeonActual.addEventListener("toggle", () => {
            if (acordeonActual.hasAttribute("open")) {
                acordeones.forEach((otroAcordeon) => {
                    if (otroAcordeon !== acordeonActual) {
                        otroAcordeon.removeAttribute("open");
                    }
                });
            }
        });
    });
};

if (paginaActual === "contacto") {
    const itemsFaq = document.querySelectorAll(".faq-item");
    if (itemsFaq.length === 0) {
        console.warn("No se encontraron acordeones .faq-item en contacto.html.");
    } else {
        configurarAcordeonExclusivo(".faq-item");
    }
}

if (paginaActual === "producto") {
    const acordeonesProducto = document.querySelectorAll(".product-accordion");
    if (acordeonesProducto.length === 0) {
        console.warn("No se encontraron acordeones .product-accordion en la página de producto.");
    } else {
        configurarAcordeonExclusivo(".product-accordion");
    }
}

/*
 * ============================================================
 *  13. MEJORAS DE NAVEGACIÓN (TODAS LAS PÁGINAS)
 * ============================================================
 *  Páginas donde actúa: TODAS.
 *  Qué hace:
 *   1) Cierra el menú mobile al tocar cualquier link del nav
 *      poniendo .checked = false en #menu-toggle.
 *   2) Cierra el desplegable de Filtros del index al hacer click
 *      fuera (click en document + closest(".nav-filter-dropdown")
 *      + removeAttribute("open")), usando stopPropagation para que
 *      los clicks dentro no lo cierren.
 *   3) Resalta el link del menú de la página actual comparando
 *      document.body.dataset.pagina con getAttribute("href") de
 *      cada link y agregando la clase .activo.
 * ============================================================
 */
const checkboxMenuMobile = document.querySelector("#menu-toggle");
const linksNavegacion = document.querySelectorAll(".header-nav a");

if (checkboxMenuMobile === null || linksNavegacion.length === 0) {
    console.warn("Faltan elementos de navegación (#menu-toggle o links del .header-nav).");
} else {
    linksNavegacion.forEach((link) => {
        // 1) Al tocar cualquier link del nav, cerramos el menú mobile
        link.addEventListener("click", () => {
            checkboxMenuMobile.checked = false;
        });

        // 3) Comparamos document.body.dataset.pagina con getAttribute("href")
        const hrefLink = link.getAttribute("href");

        const esIndex = paginaActual === "index" && (hrefLink === "#inicio" || hrefLink === "index.html");
        const esProducto = paginaActual === "producto" && hrefLink === "index.html#catalogo";
        const esContacto = paginaActual === "contacto" && hrefLink === "contacto.html";
        const esLogin = paginaActual === "login" && hrefLink === "login.html";
        const esRegistro = paginaActual === "registro" && hrefLink === "registro.html";
        const esCarrito = paginaActual === "cart" && hrefLink === "cart.html";

        if (esIndex || esProducto || esContacto || esLogin || esRegistro || esCarrito) {
            link.classList.add("activo");
        }
    });
}

// 2) Cerrar el desplegable de Filtros al hacer click fuera (solo en index.html)
if (paginaActual === "index") {
    const menuFiltrosIndex = document.querySelector(".nav-filter-dropdown");

    if (menuFiltrosIndex === null) {
        console.warn("No se encontró el desplegable .nav-filter-dropdown en index.html.");
    } else {
        const panelInteriorFiltros = menuFiltrosIndex.querySelector(".nav-filter-menu");

        if (panelInteriorFiltros !== null) {
            panelInteriorFiltros.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        }

        document.addEventListener("click", (e) => {
            if (e.target.closest(".nav-filter-dropdown") === null) {
                menuFiltrosIndex.removeAttribute("open");
            }
        });
    }
}
