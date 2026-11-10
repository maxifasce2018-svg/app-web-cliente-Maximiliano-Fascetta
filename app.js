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
 *   1. Inicialización, página actual y configuración de Supabase (Todas las páginas)
 *   1b. Copia local del carrito en localStorage y contador del header (Todas las páginas)
 *   2. Catálogo desde Supabase con fetch y lectura de datos data-* (index.html)
 *   3. Buscador en tiempo real y sistema de filtros (index.html)
 *   4. Enlaces del menú de navegación (index.html)
 *   5. Carrito de compras conectado a Supabase y resumen con reduce (cart.html)
 *   6. Detalle de producto con Supabase: total en vivo y agregar al carrito (producto-*.html)
 *   7. Mostrar / ocultar contraseña con botón 👁 (login.html y registro.html)
 *   8. Validación del formulario de registro (registro.html)
 *   9. Formulario de inicio de sesión (login.html)
 *  10. Formulario de recuperar contraseña (recuperar-password.html)
 *  11. Formulario de contacto con Supabase, contador de caracteres y borrador en sessionStorage (contacto.html)
 *  12. Acordeones exclusivos <details> en FAQ y productos (contacto.html y producto-*.html)
 *  13. Mejoras de navegación: menú mobile, click afuera en filtros y link activo (Todas las páginas)
 *  14. Tema claro / oscuro persistente con localStorage (Todas las páginas)
 *  15. Banner de aviso que se cierra y se recuerda con localStorage (index.html)
 *  16. Panel de administrador oculto con contraseña para añadir y eliminar productos (admin.html)
 *
 * ============================================================
 */

/*
 * ============================================================
 *  1. INICIALIZACIÓN, PÁGINA ACTUAL Y CONFIGURACIÓN DE SUPABASE
 * ============================================================
 *  Páginas donde actúa: TODAS.
 *  Qué hace:
 *   - Lee document.body.dataset.pagina para identificar la página
 *     actual y muestra un mensaje en consola. Si falta el atributo,
 *     avisa con console.warn.
 *   - Define UNA sola vez las constantes SUPABASE_URL, SUPABASE_KEY
 *     y el objeto headers que reutilizan todas las peticiones fetch
 *     del sitio (index.html, producto-*.html, cart.html y contacto.html).
 * ============================================================
 */
const paginaActual = document.body.dataset.pagina;

if (!paginaActual) {
    console.warn("Advertencia: el <body> no tiene definido el atributo data-pagina.");
} else {
    console.log(`app.js cargado correctamente en la página: ${paginaActual}`);
}

const SUPABASE_URL = "https://vwomelsxjbhvijfrrize.supabase.co";
const SUPABASE_KEY = "sb_publishable_TWFfoLPf_qVAldaGeeXy1g_pAJQNQDX";

const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
};

/*
 * ============================================================
 *  1b. COPIA LOCAL DEL CARRITO (localStorage) Y CONTADOR DEL HEADER
 * ============================================================
 *  Páginas donde actúa: TODAS.
 *  Qué hace:
 *   - guardarCarritoLocal(items): guarda en localStorage, con la
 *     clave "carrito", un array de objetos con JSON.stringify y
 *     refresca el contador del header.
 *   - leerCarritoLocal(): recupera el array con JSON.parse dentro
 *     de try/catch y devuelve [] si no existe o está corrupto.
 *   - actualizarContadorCarrito(): suma las cantidades de la copia
 *     local y las muestra en todos los [data-contador-carrito].
 *   - sincronizarCarritoLocal(): pide el carrito a Supabase (la
 *     fuente de verdad) y reemplaza la copia local con esos datos.
 *   - Cada item local tiene SOLO datos del producto, sin datos
 *     personales: { id, producto_id, cantidad, precio, nombre,
 *     imagen_url }. El nombre y la imagen se guardan solo para poder
 *     pintar el carrito al instante; no son datos sensibles.
 *   - No se usan cookies. Supabase sigue mandando: la copia local
 *     se pisa siempre que llegan datos reales.
 * ============================================================
 */
const CLAVE_CARRITO = "carrito";

// Guarda el array de items en localStorage y actualiza el contador
const guardarCarritoLocal = (items) => {
    try {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
    } catch (error) {
        console.warn("localStorage no está disponible, el carrito no se guardará localmente.", error);
    }
    actualizarContadorCarrito();
};

// Lee el array de items; devuelve [] si no existe o está corrupto
const leerCarritoLocal = () => {
    try {
        const texto = localStorage.getItem(CLAVE_CARRITO);
        if (texto === null) {
            return [];
        }

        const datos = JSON.parse(texto);
        if (!datos) {
            return [];
        }

        // Descartamos con .filter() entradas sin id, cantidad o precio válidos
        return datos.filter((item) => {
            return item &&
                Number(item.id) > 0 &&
                Number(item.cantidad) > 0 &&
                Number(item.precio) >= 0;
        });
    } catch (error) {
        console.warn("La copia local del carrito no se pudo leer, se ignora.", error);
        return [];
    }
};

// Convierte los registros de Supabase (carrito + productos) al formato liviano de la copia local
const registrosACarritoLocal = (registros) => {
    return registros.map((registro) => {
        return {
            id: registro.id,
            producto_id: registro.producto_id,
            cantidad: Number(registro.cantidad),
            precio: Number(registro.productos.precio),
            nombre: registro.productos.nombre,
            imagen_url: registro.productos.imagen_url
        };
    });
};

// Muestra en el header la cantidad total de productos (suma de cantidades) leída de localStorage
const actualizarContadorCarrito = () => {
    const total = leerCarritoLocal().reduce((acumulador, item) => {
        return acumulador + Number(item.cantidad);
    }, 0);

    document.querySelectorAll("[data-contador-carrito]").forEach((contador) => {
        contador.textContent = total;
    });
};

// Pide el carrito a Supabase y reemplaza la copia local con los datos reales.
// Devuelve true si se pudo sincronizar y false si falló (en ese caso no toca lo local).
const sincronizarCarritoLocal = async () => {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/carrito?select=*,productos(*)&order=id.asc`, {
            method: "GET",
            headers: headers
        });

        if (!res.ok) {
            throw new Error(`Error HTTP ${res.status} al sincronizar el carrito`);
        }

        const registros = await res.json();
        guardarCarritoLocal(registrosACarritoLocal(registros));
        return true;
    } catch (error) {
        console.warn("No se pudo sincronizar la copia local del carrito:", error);
        return false;
    }
};

// Contador al cargar la página
actualizarContadorCarrito();

/*
 * ============================================================
 *  2. CATÁLOGO DESDE SUPABASE (fetch) Y LECTURA DE DATOS (data-*)
 * ============================================================
 *  Página donde actúa: index.html (data-pagina="index").
 *  Qué hace:
 *   - obtenerProductos(): arrow function async que hace un GET a
 *     /rest/v1/productos?select=*&order=id.asc con try/catch y
 *     if (!res.ok), y devuelve los productos con res.json()
 *     (o null si algo falla).
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
    tarjeta.dataset.badge = producto.badge ?? "";

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
        grillaProductos.before(contadorProductos);

        // 4) Botón "Limpiar filtros" dentro del formulario de filtros
        const btnLimpiar = document.createElement("button");
        btnLimpiar.type = "button";
        btnLimpiar.classList.add("btn-apply");
        btnLimpiar.textContent = "Limpiar filtros";
        formFiltros.appendChild(btnLimpiar);

        // Variable para guardar la referencia al mensaje de "sin resultados"
        let mensajeSinResultados = null;

        // Función que lleva la pantalla al inicio de "Catálogo de Productos"
        const irACatalogo = () => {
            seccionCatalogo.scrollIntoView({ behavior: "smooth" });
        };

        // Función que evalúa el buscador + los filtros activos al mismo tiempo
        const filtrarProductos = () => {
            const textoBuscado = inputBusqueda.value.trim().toLowerCase();

            // Obtenemos los checkboxes marcados y usamos map() para quedarnos con sus value
            const checksMarcados = document.querySelectorAll('input[name="categoria"]:checked');
            const listaChecks = [];
            checksMarcados.forEach((checkbox) => listaChecks.push(checkbox));
            const categoriasSeleccionadas = listaChecks.map((checkbox) => checkbox.value);

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
                    btnCarritoMobile.before(formBusqueda);
                } else {
                    listaAccionesNav.before(formBusqueda);
                }
            };

            ubicarBuscadorSegunPantalla();
            window.addEventListener("resize", ubicarBuscadorSegunPantalla);
        }

        // 2) Al enviar el formulario de filtros, cancelamos el submit, filtramos y cerramos el menú
        formFiltros.addEventListener("submit", (e) => {
            e.preventDefault();
            filtrarProductos();
            dropdownFiltros.removeAttribute("open");
            irACatalogo();
        });

        // Evento del botón "Limpiar filtros": resetea los controles, muestra todo y cierra el menú
        btnLimpiar.addEventListener("click", () => {
            limpiarFiltros();
            dropdownFiltros.removeAttribute("open");
            irACatalogo();
        });

        /*
         * ============================================================
         *  4. ENLACES DEL MENÚ DE NAVEGACIÓN (Ofertas, Colecciones)
         * ============================================================
         *  Página donde actúa: index.html (data-pagina="index").
         *  Qué hace: Escucha el click en los links con data-accion y
         *  compara link.dataset.accion con ===:
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

                    if (accion === "ofertas") {
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
                    } else if (accion === "colecciones") {
                        e.preventDefault();
                        dropdownFiltros.setAttribute("open", "");
                    } else if (accion === "inicio") {
                        e.preventDefault();
                        limpiarFiltros();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    } else if (accion === "catalogo") {
                        e.preventDefault();
                        limpiarFiltros();
                        irACatalogo();
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
        grillaCatalogo.before(mensajeEstado);

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
 *   - Hace GET a /rest/v1/carrito?select=*,productos(*)&order=id.asc,
 *     mostrando "Cargando carrito..." mientras espera y un mensaje
 *     de error si falla.
 *   - Crea cada .cart-item con createElement y .map() (incluyendo
 *     los botones "−", "+" y "Eliminar" con append), guardando
 *     id, precio y cantidad en data-* mediante dataset.
 *   - Usa UN solo addEventListener "click" en .cart-items (delegación)
 *     detectando el botón con e.target.matches() y el item con closest().
 *   - "+" y "−" hacen PATCH a /rest/v1/carrito?id=eq.ID con
 *     JSON.stringify({ cantidad }) (entre 1 y 20 con if/else).
 *   - "Eliminar" hace DELETE a /rest/v1/carrito?id=eq.ID y quita el
 *     item con remove() solo cuando el servidor respondió bien.
 *   - calcularResumen() usa reduce() con valor inicial 0 para sumar
 *     artículos y subtotal, y un operador ternario para el envío
 *     (0 si subtotal >= 150, 15 si no).
 *   - "Pagar Ahora" hace DELETE a /rest/v1/carrito?id=gt.0 y muestra
 *     el mensaje de compra confirmada con el total abonado, o avisa
 *     si el carrito está vacío.
 *   - Copia local: al abrir, pinta primero los items de
 *     leerCarritoLocal() para que se vean al instante; luego hace el
 *     GET a Supabase y reemplaza la vista y la copia local con los
 *     datos reales. Si el fetch falla, deja lo local y muestra un
 *     aviso discreto. Cambiar cantidad, eliminar y pagar mantienen
 *     la copia local sincronizada (solo después de que Supabase
 *     responde bien).
 * ============================================================
 */
if (paginaActual === "cart") {
    const contenedorItems = document.querySelector(".cart-items");
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

        // GET de todos los items del carrito con los datos de su producto
        const obtenerCarrito = async () => {
            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/carrito?select=*,productos(*)&order=id.asc`, {
                    method: "GET",
                    headers: headers
                });

                if (!res.ok) {
                    throw new Error(`Error HTTP ${res.status} al pedir el carrito`);
                }

                const items = await res.json();
                return items;
            } catch (error) {
                console.error("No se pudo obtener el carrito desde Supabase:", error);
                return null;
            }
        };

        // Crea un <article class="cart-item"> con la misma estructura y clases del diseño
        const crearItemCarrito = (registro) => {
            const producto = registro.productos;
            const precio = Number(producto.precio);
            const cantidad = Number(registro.cantidad);

            const item = document.createElement("article");
            item.classList.add("cart-item");
            item.dataset.id = registro.id;
            item.dataset.productoId = registro.producto_id;
            item.dataset.precio = precio;
            item.dataset.cantidad = cantidad;

            // Imagen
            const divImagen = document.createElement("div");
            divImagen.classList.add("cart-item-image");

            const img = document.createElement("img");
            img.src = producto.imagen_url;
            img.alt = producto.nombre;
            divImagen.appendChild(img);

            // Información + botones "−", "+" y "Eliminar"
            const infoItem = document.createElement("div");
            infoItem.classList.add("cart-item-info");

            const titulo = document.createElement("h3");
            titulo.classList.add("cart-item-title");
            titulo.textContent = producto.nombre;

            const parrafoPrecio = document.createElement("p");
            parrafoPrecio.classList.add("cart-item-price");
            parrafoPrecio.textContent = `$${precio} USD`;

            const parrafoCantidad = document.createElement("p");
            parrafoCantidad.classList.add("cart-item-qty");
            parrafoCantidad.textContent = `Cantidad: ${cantidad}`;

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
            infoItem.append(titulo, parrafoPrecio, parrafoCantidad, contenedorControles);

            // Total del item
            const divTotal = document.createElement("div");
            divTotal.classList.add("cart-item-total");

            const spanTotal = document.createElement("span");
            spanTotal.classList.add("cart-item-total-price");
            spanTotal.textContent = `$${precio * cantidad} USD`;
            divTotal.appendChild(spanTotal);

            item.append(divImagen, infoItem, divTotal);
            return item;
        };

        // Arma la copia local a partir de los items que se ven en pantalla y la guarda
        const guardarCopiaDesdeVista = () => {
            const listaItems = [];
            document.querySelectorAll(".cart-item").forEach((item) => listaItems.push(item));

            const itemsVista = listaItems.map((item) => {
                return {
                    id: Number(item.dataset.id),
                    producto_id: Number(item.dataset.productoId),
                    cantidad: Number(item.dataset.cantidad),
                    precio: Number(item.dataset.precio),
                    nombre: item.querySelector(".cart-item-title").textContent,
                    imagen_url: item.querySelector("img").getAttribute("src")
                };
            });

            guardarCarritoLocal(itemsVista);
        };

        // Arrow function que recalcula el resumen del carrito con reduce()
        const calcularResumen = () => {
            const itemsActuales = [];
            document.querySelectorAll(".cart-item").forEach((item) => itemsActuales.push(item));

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
            btnPagar.removeAttribute("disabled");
        };

        // Arrow function async que actualiza la cantidad de un item (entre 1 y 20 con if/else),
        // hace PATCH a Supabase y actualiza la pantalla solo si el servidor respondió bien.
        const actualizarItem = async (item, cantidad) => {
            let cantidadFinal = cantidad;

            if (cantidadFinal < 1) {
                cantidadFinal = 1;
            } else if (cantidadFinal > 20) {
                cantidadFinal = 20;
            }

            const cantidadActual = Number(item.dataset.cantidad);
            if (cantidadFinal === cantidadActual) {
                return;
            }

            const idItem = Number(item.dataset.id);
            const precio = Number(item.dataset.precio);

            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/carrito?id=eq.${idItem}`, {
                    method: "PATCH",
                    headers: headers,
                    body: JSON.stringify({ cantidad: cantidadFinal })
                });

                if (!res.ok) {
                    throw new Error(`Error HTTP ${res.status} al actualizar la cantidad`);
                }

                // Actualizamos el DOM y el resumen recién cuando Supabase respondió bien
                item.dataset.cantidad = cantidadFinal;
                item.querySelector(".cart-item-qty").textContent = `Cantidad: ${cantidadFinal}`;
                item.querySelector(".cart-item-total-price").textContent = `$${precio * cantidadFinal} USD`;
                calcularResumen();
                guardarCopiaDesdeVista();
            } catch (error) {
                console.error("No se pudo actualizar la cantidad del item en Supabase:", error);
            }
        };

        // Arrow function async que elimina un item en Supabase (DELETE) y lo quita del DOM si salió bien
        const eliminarItem = async (item) => {
            const idItem = Number(item.dataset.id);

            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/carrito?id=eq.${idItem}`, {
                    method: "DELETE",
                    headers: headers
                });

                if (!res.ok) {
                    throw new Error(`Error HTTP ${res.status} al eliminar el item`);
                }

                item.remove();
                calcularResumen();
                guardarCopiaDesdeVista();
            } catch (error) {
                console.error("No se pudo eliminar el item del carrito en Supabase:", error);
            }
        };

        // UN solo addEventListener "click" en .cart-items (delegación de eventos)
        contenedorItems.addEventListener("click", (e) => {
            const item = e.target.closest(".cart-item");
            if (item === null) {
                return;
            }

            const cantidad = Number(item.dataset.cantidad);

            if (e.target.classList.contains("btn-restar")) {
                // Restamos 1 (actualizarItem se encarga de no bajar de 1)
                actualizarItem(item, cantidad - 1);
            } else if (e.target.classList.contains("btn-sumar")) {
                // Sumamos 1 (actualizarItem se encarga de no pasar de 20)
                actualizarItem(item, cantidad + 1);
            } else if (e.target.classList.contains("btn-remove-item")) {
                eliminarItem(item);
            }
        });

        // Evento click en "Pagar Ahora": vacía la tabla carrito con DELETE y confirma la compra
        btnPagar.addEventListener("click", async () => {
            const itemsActuales = document.querySelectorAll(".cart-item");

            if (itemsActuales.length === 0) {
                console.warn("No se puede realizar el pago: el carrito está vacío.");
                return;
            }

            const totalAbonado = totalFinalActual;
            btnPagar.disabled = true;

            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/carrito?id=gt.0`, {
                    method: "DELETE",
                    headers: headers
                });

                if (!res.ok) {
                    throw new Error(`Error HTTP ${res.status} al vaciar el carrito`);
                }

                // Actualizamos la vista recién cuando el DELETE respondió bien
                for (const item of itemsActuales) {
                    item.remove();
                }
                calcularResumen();
                guardarCarritoLocal([]); // El carrito quedó vacío también en la copia local

                contenedorResumen.innerHTML = "";

                const tituloConfirmado = document.createElement("h2");
                tituloConfirmado.classList.add("summary-title");
                tituloConfirmado.textContent = "¡Compra Confirmada!";

                const textoConfirmado = document.createElement("p");
                textoConfirmado.classList.add("summary-label");
                textoConfirmado.textContent = `¡Gracias por tu compra! Total abonado: $${totalAbonado} USD`;

                const linkInicio = document.createElement("a");
                linkInicio.href = "index.html";
                linkInicio.classList.add("continue-shopping");
                linkInicio.textContent = "Volver al inicio";

                contenedorResumen.append(tituloConfirmado, textoConfirmado, linkInicio);
            } catch (error) {
                console.error("No se pudo confirmar la compra en Supabase:", error);
                btnPagar.disabled = false;
            }
        });

        // Convierte un item de la copia local al formato de registro que espera crearItemCarrito
        const localARegistro = (itemLocal) => {
            return {
                id: itemLocal.id,
                producto_id: itemLocal.producto_id,
                cantidad: itemLocal.cantidad,
                productos: {
                    id: itemLocal.producto_id,
                    nombre: itemLocal.nombre,
                    precio: itemLocal.precio,
                    imagen_url: itemLocal.imagen_url
                }
            };
        };

        // Reemplaza todo lo que hay en .cart-items por los registros recibidos
        const pintarItems = (registros) => {
            contenedorItems.innerHTML = "";

            if (registros.length > 0) {
                const elementosCarrito = registros.map((registro) => crearItemCarrito(registro));
                contenedorItems.append(...elementosCarrito);
            }

            calcularResumen();
        };

        // Carga inicial: 1) pinta la copia local al instante, 2) GET a Supabase y reemplaza vista y copia
        const copiaLocal = leerCarritoLocal();

        const mensajeEstadoCarrito = document.createElement("p");
        mensajeEstadoCarrito.textContent = "Cargando carrito...";

        if (copiaLocal.length > 0) {
            pintarItems(copiaLocal.map((itemLocal) => localARegistro(itemLocal)));
        } else {
            contenedorItems.appendChild(mensajeEstadoCarrito);
        }

        const cargarCarrito = async () => {
            const registros = await obtenerCarrito();

            if (registros === null) {
                if (copiaLocal.length > 0) {
                    // Dejamos lo local y avisamos de forma discreta
                    const aviso = document.createElement("p");
                    aviso.classList.add("aviso-carrito");
                    aviso.textContent = "No se pudo actualizar el carrito. Mostrando la última copia guardada.";
                    contenedorItems.prepend(aviso);
                } else {
                    mensajeEstadoCarrito.textContent = "No se pudo cargar el carrito. Por favor, intentá de nuevo más tarde.";
                    btnPagar.setAttribute("disabled", "");
                }
                return;
            }

            // Supabase es la fuente de verdad: reemplazamos la vista y la copia local
            pintarItems(registros);
            guardarCarritoLocal(registrosACarritoLocal(registros));
        };

        cargarCarrito();
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
 *   - Después de que Supabase responde bien, actualiza también la
 *     copia local (sincronizarCarritoLocal) y con ella el contador
 *     del header.
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

            const nuevaCantidad = cantidadActual + cantidad > CANTIDAD_MAXIMA
                ? CANTIDAD_MAXIMA
                : cantidadActual + cantidad;

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

                // Supabase respondió bien: actualizamos también la copia local (y el contador del header)
                await sincronizarCarritoLocal();

                mostrarMensajeExito(cantidadAgregada);
            } catch (error) {
                console.error("No se pudo agregar al carrito:", error);
                const texto = error.message.includes("Ya tenés")
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
 *   - Si todo es válido, hace preventDefault y redirige directamente
 *     a index.html con window.location.href.
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

            // Si todo es válido, redirigimos directamente al inicio
            window.location.href = "index.html";
        });
    }
}

/*
 * ============================================================
 *  9. FORMULARIO DE INICIO DE SESIÓN (login.html)
 * ============================================================
 *  Página donde actúa: login.html (data-pagina="login").
 *  Qué hace: Al enviar el formulario válido, cancela el envío
 *  con preventDefault() y redirige directamente a index.html
 *  con window.location.href.
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

            if (inputEmailLogin.value.trim() === "") {
                return;
            }

            // Inicio de sesión válido: redirigimos directamente al inicio
            window.location.href = "index.html";
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
 *   - Al hacer submit: preventDefault, arma el objeto con nombre,
 *     email, telefono, motivo y mensaje (trim) y hace POST a
 *     /rest/v1/mensajes_contacto usando async / await con
 *     try / catch / finally (verificando if (!res.ok)).
 *   - Mientras envía, deshabilita el botón y cambia su texto a
 *     "Enviando..."; en finally vuelve a habilitarlo.
 *   - Si sale bien, oculta el formulario con classList.add("oculto")
 *     y muestra "¡Gracias NOMBRE! Te responderemos a EMAIL" junto al
 *     botón "Enviar otro mensaje" que limpia los campos (.value = "")
 *     y vuelve a mostrar el formulario.
 *   - Si falla, muestra un mensaje de error sin ocultar el formulario.
 *   - Borrador con sessionStorage: mientras el usuario escribe (evento
 *     "input") guarda { nombre, motivo, mensaje } con JSON.stringify
 *     bajo la clave "borradorContacto". Al cargar la página lo
 *     recupera con JSON.parse y rellena los campos. NO guarda el
 *     email, el teléfono ni ningún otro dato sensible. Si el envío
 *     sale bien, lo borra con removeItem. Todo va en try/catch.
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
    const btnEnviarContacto = document.querySelector(".auth-submit-btn");

    if (
        formContacto === null ||
        inputNombreContacto === null ||
        inputEmailContacto === null ||
        inputTelefonoContacto === null ||
        selectMotivoContacto === null ||
        textareaMensaje === null ||
        checkPrivacidad === null ||
        btnEnviarContacto === null
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

        // ---- Borrador del formulario en sessionStorage (solo nombre, motivo y mensaje) ----
        const CLAVE_BORRADOR = "borradorContacto";

        // Guarda el borrador actual; si sessionStorage falla, solo avisa por consola
        const guardarBorradorContacto = () => {
            try {
                const borrador = {
                    nombre: inputNombreContacto.value,
                    motivo: selectMotivoContacto.value,
                    mensaje: textareaMensaje.value
                };
                sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
            } catch (error) {
                console.warn("sessionStorage no está disponible, no se guardará el borrador.", error);
            }
        };

        // Borra el borrador (se usa cuando el mensaje se envió bien)
        const borrarBorradorContacto = () => {
            try {
                sessionStorage.removeItem(CLAVE_BORRADOR);
            } catch (error) {
                console.warn("sessionStorage no está disponible, no se pudo borrar el borrador.", error);
            }
        };

        // Recupera el borrador con JSON.parse y rellena los campos usando ??
        const restaurarBorradorContacto = () => {
            try {
                const texto = sessionStorage.getItem(CLAVE_BORRADOR);
                if (texto === null) {
                    return;
                }

                const borrador = JSON.parse(texto);
                if (borrador === null) {
                    return;
                }

                inputNombreContacto.value = borrador.nombre ?? "";
                selectMotivoContacto.value = borrador.motivo ?? "";
                textareaMensaje.value = borrador.mensaje ?? "";

                // Actualizamos el contador de caracteres con el mensaje restaurado
                const cantidadRestaurada = textareaMensaje.value.length;
                contadorCaracteres.textContent = `${cantidadRestaurada} / 500 caracteres`;
                contadorCaracteres.classList.toggle("char-limit-warn", cantidadRestaurada > 450);
            } catch (error) {
                console.warn("El borrador guardado está dañado, se ignora.", error);
            }
        };

        restaurarBorradorContacto();

        // Guardamos mientras el usuario escribe (el select dispara "input" al cambiar)
        inputNombreContacto.addEventListener("input", guardarBorradorContacto);
        selectMotivoContacto.addEventListener("input", guardarBorradorContacto);
        textareaMensaje.addEventListener("input", guardarBorradorContacto);

        let bloqueExitoContacto = null;
        let mensajeErrorContacto = null;

        formContacto.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nombre = inputNombreContacto.value.trim();
            const email = inputEmailContacto.value.trim();
            const telefono = inputTelefonoContacto.value.trim();
            const motivo = selectMotivoContacto.value;
            const mensaje = textareaMensaje.value.trim();

            const datos = {
                nombre: nombre,
                email: email,
                telefono: telefono,
                motivo: motivo,
                mensaje: mensaje
            };

            if (mensajeErrorContacto !== null) {
                mensajeErrorContacto.remove();
                mensajeErrorContacto = null;
            }

            // Mientras se envía el mensaje, deshabilitamos el botón y cambiamos su texto
            btnEnviarContacto.disabled = true;
            btnEnviarContacto.textContent = "Enviando...";

            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/mensajes_contacto`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(datos)
                });

                if (!res.ok) {
                    throw new Error(`Error HTTP ${res.status} al guardar el mensaje de contacto`);
                }

                // El mensaje se envió bien: ya no hace falta el borrador
                borrarBorradorContacto();

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
            } catch (error) {
                console.error("No se pudo enviar el mensaje de contacto a Supabase:", error);

                mensajeErrorContacto = document.createElement("p");
                mensajeErrorContacto.classList.add("error-msg");
                mensajeErrorContacto.textContent = "No se pudo enviar tu mensaje. Por favor, intentá de nuevo más tarde.";
                formContacto.after(mensajeErrorContacto);
            } finally {
                btnEnviarContacto.disabled = false;
                btnEnviarContacto.textContent = "Enviar Mensaje";
            }
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

/*
 * ============================================================
 *  14. TEMA CLARO / OSCURO PERSISTENTE (TODAS LAS PÁGINAS)
 * ============================================================
 *  Páginas donde actúa: TODAS.
 *  Qué hace:
 *   1) Al cargar, lee localStorage.getItem("tema") y, si vale
 *      "claro", agrega la clase .tema-claro al <body>. Si no hay
 *      valor guardado, queda el tema oscuro por defecto.
 *   2) Al hacer click en #btn-tema alterna la clase con
 *      classList.toggle, guarda el tema con setItem y actualiza
 *      el texto/icono del botón.
 *   3) Todo el acceso a localStorage va dentro de try/catch por
 *      si no está disponible (modo privado, bloqueado, etc.): en
 *      ese caso el cambio de tema igual funciona, solo que no se
 *      recuerda al recargar. No se usan cookies.
 * ============================================================
 */
const botonTema = document.getElementById("btn-tema");

// Lee el tema guardado; usa ?? para devolver "oscuro" por defecto si no hay nada guardado
const leerTemaGuardado = () => {
    try {
        return localStorage.getItem("tema") ?? "oscuro";
    } catch (error) {
        console.warn("localStorage no está disponible, no se puede leer el tema.", error);
        return "oscuro";
    }
};

// Guarda el tema elegido; si localStorage falla, solo avisa por consola
const guardarTema = (tema) => {
    try {
        localStorage.setItem("tema", tema);
    } catch (error) {
        console.warn("localStorage no está disponible, el tema no se guardará.", error);
    }
};

// Muestra en el botón la acción que hará el próximo click
const actualizarBotonTema = (esClaro) => {
    if (botonTema === null) {
        return;
    }
    botonTema.textContent = esClaro ? "🌙 Modo oscuro" : "☀️ Modo claro";
    botonTema.setAttribute("aria-pressed", esClaro ? "true" : "false");
};

// 1) Aplicar el tema guardado apenas carga la página
const temaClaroActivo = leerTemaGuardado() === "claro";
document.body.classList.toggle("tema-claro", temaClaroActivo);
actualizarBotonTema(temaClaroActivo);

// 2) Alternar el tema al hacer click en el botón
if (botonTema === null) {
    console.warn("No se encontró el botón #btn-tema en esta página.");
} else {
    botonTema.addEventListener("click", () => {
        const esClaro = document.body.classList.toggle("tema-claro");
        guardarTema(esClaro ? "claro" : "oscuro");
        actualizarBotonTema(esClaro);
    });
}

/*
 * ============================================================
 *  15. BANNER DE AVISO CON localStorage (index.html)
 * ============================================================
 *  Página donde actúa: index.html (data-pagina="index").
 *  Qué hace:
 *   1) Al cargar, si localStorage.getItem("bannerOculto") vale
 *      "true", oculta el banner (#banner-aviso) con la clase
 *      .oculto; si no, queda visible.
 *   2) Al hacer click en la "x" (#btn-cerrar-banner) oculta el
 *      banner y guarda localStorage.setItem("bannerOculto", "true").
 *   3) El acceso a localStorage va en try/catch: si no está
 *      disponible, el banner igual se cierra pero reaparece al
 *      recargar. No se usan cookies.
 * ============================================================
 */
if (paginaActual === "index") {
    const bannerAviso = document.getElementById("banner-aviso");
    const btnCerrarBanner = document.getElementById("btn-cerrar-banner");

    if (bannerAviso === null || btnCerrarBanner === null) {
        console.warn("No se encontró el banner de aviso en index.html.");
    } else {
        // 1) Si el usuario ya lo cerró antes, no lo mostramos
        try {
            if (localStorage.getItem("bannerOculto") === "true") {
                bannerAviso.classList.add("oculto");
            }
        } catch (error) {
            console.warn("localStorage no está disponible, no se puede leer bannerOculto.", error);
        }

        // 2) Al cerrar, lo ocultamos y recordamos la decisión
        btnCerrarBanner.addEventListener("click", () => {
            bannerAviso.classList.add("oculto");

            try {
                localStorage.setItem("bannerOculto", "true");
            } catch (error) {
                console.warn("localStorage no está disponible, el banner volverá a aparecer.", error);
            }
        });
    }
}

/*
 * ============================================================
 *  16. PANEL DE ADMINISTRADOR OCULTO (admin.html)
 * ============================================================
 *  Página donde actúa: admin.html (data-pagina="admin").
 *  Qué hace:
 *   - Inicia dentro de document.addEventListener("DOMContentLoaded")
 *     y selecciona los contenedores principales con getElementById().
 *   - Valida en pantalla la contraseña contra CLAVE_ADMIN ("Pipi1234")
 *     con comparación estricta (===). Por seguridad (regla de XSS vista
 *     en clase), NO guarda la contraseña ni ningún token en localStorage
 *     ni sessionStorage.
 *   - Mientras el admin escribe (evento "input"), guarda un borrador de
 *     los datos del producto en sessionStorage ("borradorProducto") con
 *     JSON.stringify y lo restaura al abrir con JSON.parse y ?? dentro
 *     de try/catch.
 *   - Al enviar el formulario, valida los campos con .trim() y
 *     Number(precio) > 0, y hace POST a /rest/v1/productos usando
 *     fetch con async/await, try/catch/finally, las cabeceras estándar
 *     (headers) y JSON.stringify.
 *   - Debajo muestra la lista actual de productos en Supabase con GET
 *     y permite borrar productos con DELETE (usando delegación de
 *     eventos con closest() y classList.contains()).
 * ============================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    if (paginaActual !== "admin") {
        return;
    }

    const CLAVE_ADMIN = "Pipi1234";
    const CLAVE_BORRADOR_PRODUCTO = "borradorProducto";

    const tarjetaBloqueo = document.getElementById("admin-lock-card");
    const formAccesoAdmin = document.getElementById("form-admin-login");
    const inputPasswordAdmin = document.getElementById("admin-password");
    const panelAdmin = document.getElementById("admin-panel");

    const formProducto = document.getElementById("form-admin-producto");
    const inputNombreProd = document.getElementById("prod-nombre");
    const selectCategoriaProd = document.getElementById("prod-categoria");
    const selectColeccionProd = document.getElementById("prod-coleccion");
    const inputPrecioProd = document.getElementById("prod-precio");
    const selectBadgeProd = document.getElementById("prod-badge");
    const inputImagenProd = document.getElementById("prod-imagen");
    const textareaDescProd = document.getElementById("prod-descripcion");
    const btnGuardarProd = document.getElementById("btn-guardar-producto");
    const contenedorListaAdmin = document.getElementById("admin-lista-productos");

    if (
        tarjetaBloqueo === null ||
        formAccesoAdmin === null ||
        inputPasswordAdmin === null ||
        panelAdmin === null ||
        formProducto === null ||
        inputNombreProd === null ||
        selectCategoriaProd === null ||
        selectColeccionProd === null ||
        inputPrecioProd === null ||
        selectBadgeProd === null ||
        inputImagenProd === null ||
        textareaDescProd === null ||
        btnGuardarProd === null ||
        contenedorListaAdmin === null
    ) {
        console.warn("Faltan elementos esperados en admin.html.");
        return;
    }

    // ---- 1) Contador de caracteres en vivo para la descripción (máx 300) ----
    const contadorDescProd = document.createElement("span");
    contadorDescProd.classList.add("char-counter");
    contadorDescProd.textContent = `${textareaDescProd.value.length} / 300 caracteres`;
    textareaDescProd.after(contadorDescProd);

    const actualizarContadorDesc = () => {
        const largo = textareaDescProd.value.length;
        contadorDescProd.textContent = `${largo} / 300 caracteres`;
        contadorDescProd.classList.toggle("char-limit-warn", largo > 260);
    };

    textareaDescProd.addEventListener("input", actualizarContadorDesc);

    // ---- 2) Borrador del producto en sessionStorage (sin datos sensibles) ----
    const guardarBorradorProducto = () => {
        try {
            const borrador = {
                nombre: inputNombreProd.value,
                categoria: selectCategoriaProd.value,
                coleccion: selectColeccionProd.value,
                precio: inputPrecioProd.value,
                badge: selectBadgeProd.value,
                imagen_url: inputImagenProd.value,
                descripcion: textareaDescProd.value
            };
            sessionStorage.setItem(CLAVE_BORRADOR_PRODUCTO, JSON.stringify(borrador));
        } catch (error) {
            console.warn("sessionStorage no está disponible, no se guardará el borrador del producto.", error);
        }
    };

    const borrarBorradorProducto = () => {
        try {
            sessionStorage.removeItem(CLAVE_BORRADOR_PRODUCTO);
        } catch (error) {
            console.warn("sessionStorage no está disponible, no se pudo borrar el borrador del producto.", error);
        }
    };

    const restaurarBorradorProducto = () => {
        try {
            const texto = sessionStorage.getItem(CLAVE_BORRADOR_PRODUCTO);
            if (texto === null) {
                return;
            }

            const borrador = JSON.parse(texto);
            if (borrador === null) {
                return;
            }

            inputNombreProd.value = borrador.nombre ?? "";
            selectCategoriaProd.value = borrador.categoria ?? "";
            selectColeccionProd.value = borrador.coleccion ?? "";
            inputPrecioProd.value = borrador.precio ?? "";
            selectBadgeProd.value = borrador.badge ?? "";
            inputImagenProd.value = borrador.imagen_url ?? "";
            textareaDescProd.value = borrador.descripcion ?? "";
            actualizarContadorDesc();
        } catch (error) {
            console.warn("El borrador del producto está dañado, se ignora.", error);
        }
    };

    const camposBorrador = [
        inputNombreProd,
        selectCategoriaProd,
        selectColeccionProd,
        inputPrecioProd,
        selectBadgeProd,
        inputImagenProd,
        textareaDescProd
    ];

    camposBorrador.forEach((campo) => {
        campo.addEventListener("input", guardarBorradorProducto);
    });

    // ---- 3) Listado de productos actuales en Supabase (GET y DELETE) ----
    const crearFilaProductoAdmin = (producto) => {
        const fila = document.createElement("article");
        fila.classList.add("admin-product-item");
        fila.dataset.id = producto.id;

        const info = document.createElement("div");
        info.classList.add("admin-product-info");

        const miniatura = document.createElement("img");
        miniatura.classList.add("admin-product-thumb");
        miniatura.src = producto.imagen_url;
        miniatura.alt = producto.nombre;
        info.appendChild(miniatura);

        const textos = document.createElement("div");

        const titulo = document.createElement("h3");
        titulo.classList.add("admin-product-title");
        titulo.textContent = producto.nombre;

        const etiquetaBadge = producto.badge ?? "sin badge";
        const meta = document.createElement("p");
        meta.classList.add("admin-product-meta");
        meta.textContent = `ID #${producto.id} · $${producto.precio} USD · ${producto.categoria} · ${producto.coleccion} (${etiquetaBadge})`;

        textos.append(titulo, meta);
        info.appendChild(textos);

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.classList.add("btn-remove-item", "btn-eliminar-producto");
        btnEliminar.textContent = "Eliminar";

        fila.append(info, btnEliminar);
        return fila;
    };

    const cargarListaProductosAdmin = async () => {
        contenedorListaAdmin.innerHTML = "";

        const estadoCarga = document.createElement("p");
        estadoCarga.textContent = "Cargando productos...";
        contenedorListaAdmin.appendChild(estadoCarga);

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/productos?select=*&order=id.desc`, {
                method: "GET",
                headers: headers
            });

            if (!res.ok) {
                throw new Error(`Error HTTP ${res.status} al cargar los productos`);
            }

            const productos = await res.json();
            contenedorListaAdmin.innerHTML = "";

            if (productos.length === 0) {
                const vacio = document.createElement("p");
                vacio.textContent = "No hay productos cargados en Supabase.";
                contenedorListaAdmin.appendChild(vacio);
                return;
            }

            const filas = productos.map((prod) => crearFilaProductoAdmin(prod));
            contenedorListaAdmin.append(...filas);
        } catch (error) {
            console.error("No se pudo cargar la lista de productos en admin:", error);
            estadoCarga.textContent = "No se pudo cargar la lista de productos desde Supabase.";
        }
    };

    // Delegación de eventos para eliminar un producto con DELETE
    contenedorListaAdmin.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("btn-eliminar-producto")) {
            return;
        }

        const fila = e.target.closest(".admin-product-item");
        if (fila === null) {
            return;
        }

        const idBorrar = Number(fila.dataset.id);
        e.target.disabled = true;
        e.target.textContent = "Borrando...";

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/productos?id=eq.${idBorrar}`, {
                method: "DELETE",
                headers: headers
            });

            if (!res.ok) {
                throw new Error(`Error HTTP ${res.status} al eliminar el producto`);
            }

            fila.remove();
        } catch (error) {
            console.error("No se pudo eliminar el producto en Supabase:", error);
            e.target.disabled = false;
            e.target.textContent = "Eliminar";
        }
    });

    // ---- 4) Desbloqueo por contraseña en memoria (NO se guarda en Storage) ----
    let mensajeErrorAcceso = null;

    formAccesoAdmin.addEventListener("submit", (e) => {
        e.preventDefault();

        if (mensajeErrorAcceso !== null) {
            mensajeErrorAcceso.remove();
            mensajeErrorAcceso = null;
        }

        const claveIngresada = inputPasswordAdmin.value;

        if (claveIngresada !== CLAVE_ADMIN) {
            mensajeErrorAcceso = document.createElement("p");
            mensajeErrorAcceso.classList.add("error-msg");
            mensajeErrorAcceso.textContent = "Contraseña incorrecta. Acceso denegado.";
            formAccesoAdmin.after(mensajeErrorAcceso);
            return;
        }

        // Limpiamos el input para que la contraseña ni siquiera quede escrita en el DOM
        inputPasswordAdmin.value = "";
        tarjetaBloqueo.classList.add("oculto");
        panelAdmin.classList.remove("oculto");

        restaurarBorradorProducto();
        cargarListaProductosAdmin();
    });

    // ---- 5) Envío del formulario para añadir un producto a Supabase (POST) ----
    let mensajeResultadoProducto = null;

    const mostrarAvisoAdmin = (texto, esError) => {
        if (mensajeResultadoProducto !== null) {
            mensajeResultadoProducto.remove();
        }

        mensajeResultadoProducto = document.createElement("p");
        mensajeResultadoProducto.classList.add(esError ? "error-msg" : "form-success-msg");
        mensajeResultadoProducto.textContent = texto;
        formProducto.after(mensajeResultadoProducto);
    };

    formProducto.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = inputNombreProd.value.trim();
        const categoria = selectCategoriaProd.value.trim();
        const coleccion = selectColeccionProd.value.trim();
        const precio = Number(inputPrecioProd.value);
        const badgeElegido = selectBadgeProd.value.trim();
        const imagenUrl = inputImagenProd.value.trim();
        const descripcion = textareaDescProd.value.trim();

        if (
            nombre === "" ||
            categoria === "" ||
            coleccion === "" ||
            imagenUrl === "" ||
            descripcion === "" ||
            !(precio > 0)
        ) {
            mostrarAvisoAdmin("Completá todos los campos obligatorios y un precio mayor a 0.", true);
            return;
        }

        const nuevoProducto = {
            nombre: nombre,
            categoria: categoria,
            coleccion: coleccion,
            precio: precio,
            badge: badgeElegido !== "" ? badgeElegido : null,
            imagen_url: imagenUrl,
            descripcion: descripcion,
            pagina_detalle: "producto-scarlet-violet-booster-box.html"
        };

        btnGuardarProd.disabled = true;
        btnGuardarProd.textContent = "Guardando...";

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/productos`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(nuevoProducto)
            });

            if (!res.ok) {
                throw new Error(`Error HTTP ${res.status} al crear el producto`);
            }

            // Salió bien: limpiamos el formulario, borramos el borrador y refrescamos la lista
            inputNombreProd.value = "";
            selectCategoriaProd.value = "";
            selectColeccionProd.value = "";
            inputPrecioProd.value = "";
            selectBadgeProd.value = "";
            inputImagenProd.value = "";
            textareaDescProd.value = "";
            actualizarContadorDesc();

            borrarBorradorProducto();
            mostrarAvisoAdmin(`✔ Producto "${nombre}" añadido correctamente al catálogo.`, false);
            await cargarListaProductosAdmin();
        } catch (error) {
            console.error("No se pudo guardar el producto en Supabase:", error);
            mostrarAvisoAdmin("No se pudo guardar el producto en Supabase. Revisá los datos e intentá de nuevo.", true);
        } finally {
            btnGuardarProd.disabled = false;
            btnGuardarProd.textContent = "Añadir Producto al Catálogo";
        }
    });
});
