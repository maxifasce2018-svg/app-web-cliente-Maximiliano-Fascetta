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

    /*
     * ============================================================
     *  ENLACES DEL MENÚ DE NAVEGACIÓN (Ofertas, Colecciones, etc.)
     * ============================================================
     *  Escuchamos el click en los links que tienen data-accion:
     *   - "ofertas": muestra solo las tarjetas con data-badge="oferta".
     *   - "colecciones": abre el desplegable de filtros con setAttribute("open", "").
     *   - "inicio" / "catalogo": limpian los filtros y vuelven a mostrar todo.
     *  Usamos un switch evaluando link.dataset.accion.
     * ============================================================
     */
    const linksMenu = document.querySelectorAll(".nav-list a[data-accion]");

    for (const link of linksMenu) {
        link.addEventListener("click", () => {
            const accion = link.dataset.accion;

            switch (accion) {
                case "ofertas": {
                    let ofertasVisibles = 0;

                    for (const tarjeta of tarjetas) {
                        if (tarjeta.dataset.badge === "oferta") {
                            tarjeta.classList.remove("oculto");
                            ofertasVisibles = ofertasVisibles + 1;
                        } else {
                            tarjeta.classList.add("oculto");
                        }
                    }

                    // Actualizamos el contador arriba del grid
                    contadorProductos.textContent = `Mostrando ${ofertasVisibles} de ${totalProductos} productos`;

                    // Si había un mensaje de "sin resultados" previo, lo quitamos
                    if (mensajeSinResultados !== null) {
                        mensajeSinResultados.remove();
                        mensajeSinResultados = null;
                    }
                    break;
                }

                case "colecciones": {
                    // Abrimos el desplegable de filtros
                    dropdownFiltros.setAttribute("open", "");
                    break;
                }

                case "inicio":
                case "catalogo": {
                    // Reseteamos todos los filtros y el buscador para volver a mostrar todo
                    for (const checkbox of checkboxesCategoria) {
                        checkbox.checked = false;
                    }
                    selectColeccion.value = "";
                    inputPrecioMax.value = 500;
                    spanPrecio.textContent = `Hasta $${inputPrecioMax.value} USD`;
                    inputBusqueda.value = "";

                    filtrarProductos();
                    break;
                }
            }
        });
    }
}

/*
 * ============================================================
 *  CARRITO DE COMPRAS INTERACTIVO (cart.html)
 * ============================================================
 *  - Inserta en cada .cart-item los botones "−", "+" y "Eliminar"
 *    usando createElement y append.
 *  - Usa UN solo addEventListener "click" en .cart-items (delegación)
 *    detectando el botón con e.target.matches() y el item con closest().
 *  - Cantidad entre 1 y 20 (if/else).
 *  - calcularResumen() usa reduce() con valor inicial 0 para sumar
 *    la cantidad de artículos y el subtotal, y un operador ternario
 *    para el envío (0 si subtotal >= 150, 15 si no).
 * ============================================================
 */
if (paginaActual === "cart") {
    const contenedorItems = document.querySelector(".cart-items");
    const itemsIniciales = document.querySelectorAll(".cart-item");
    const contenedorResumen = document.querySelector(".cart-summary");
    const filasResumen = document.querySelectorAll(".cart-summary .summary-row");
    const btnPagar = document.querySelector(".checkout-btn");

    // Referencias a los elementos del Resumen de Compra
    const labelSubtotal = filasResumen[0].querySelector(".summary-label");
    const valorSubtotal = filasResumen[0].querySelector(".summary-value");
    const valorEnvio = filasResumen[1].querySelector(".summary-value");
    const valorTotalFinal = filasResumen[2].querySelector(".summary-value");

    // Variable para guardar el total final actual y usarlo al pagar
    let totalFinalActual = 0;

    // Insertamos en cada .cart-item los botones "−", "+" y "Eliminar"
    for (const item of itemsIniciales) {
        const infoItem = item.querySelector(".cart-item-info");

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

        // Si el carrito quedó vacío, mostramos el mensaje, vaciamos .cart-items y deshabilitamos el botón
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

            // Actualizamos el resumen en 0 y deshabilitamos "Pagar Ahora"
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

        // Actualizamos los textos del resumen todo en enteros
        labelSubtotal.textContent = `Subtotal (${totalArticulos} artículos)`;
        valorSubtotal.textContent = `$${subtotal} USD`;
        valorEnvio.textContent = costoEnvio === 0 ? "GRATIS" : `$${costoEnvio} USD`;
        valorTotalFinal.textContent = `$${totalFinal} USD`;
    };

    // UN solo addEventListener "click" en .cart-items (delegación de eventos)
    contenedorItems.addEventListener("click", (e) => {
        // Buscamos a qué .cart-item pertenece el botón clickeado
        const item = e.target.closest(".cart-item");
        if (item === null) {
            return;
        }

        const precio = Number(item.dataset.precio);
        let cantidad = Number(item.dataset.cantidad);

        // Detectamos qué botón se tocó usando e.target.matches()
        if (e.target.matches(".btn-restar")) {
            // Cantidad mínima 1
            if (cantidad > 1) {
                cantidad = cantidad - 1;
            } else {
                cantidad = 1;
            }

            item.dataset.cantidad = cantidad;
            item.querySelector(".cart-item-qty").textContent = `Cantidad: ${cantidad}`;
            item.querySelector(".cart-item-total-price").textContent = `$${precio * cantidad} USD`;
            calcularResumen();
        } else if (e.target.matches(".btn-sumar")) {
            // Cantidad máxima 20
            if (cantidad < 20) {
                cantidad = cantidad + 1;
            } else {
                cantidad = 20;
            }

            item.dataset.cantidad = cantidad;
            item.querySelector(".cart-item-qty").textContent = `Cantidad: ${cantidad}`;
            item.querySelector(".cart-item-total-price").textContent = `$${precio * cantidad} USD`;
            calcularResumen();
        } else if (e.target.matches(".btn-remove-item")) {
            // Quitamos el item del DOM y recalculamos el resumen
            item.remove();
            calcularResumen();
        }
    });

    // Evento click en "Pagar Ahora"
    btnPagar.addEventListener("click", () => {
        const itemsActuales = document.querySelectorAll(".cart-item");

        // Si el carrito está vacío, mostramos un console.warn y no hacemos nada
        if (itemsActuales.length === 0) {
            console.warn("No se puede realizar el pago: el carrito está vacío.");
            return;
        }

        // Reemplazamos el contenido de .cart-summary con innerHTML y template literal
        contenedorResumen.innerHTML = `
            <h2 class="summary-title">¡Compra Confirmada!</h2>
            <p class="summary-label">¡Gracias por tu compra! Total abonado: $${totalFinalActual} USD</p>
            <a href="index.html" class="continue-shopping">Volver al inicio</a>
        `;
    });

    // Ejecutamos calcularResumen() al cargar la página para sincronizar los valores iniciales
    calcularResumen();
}

/*
 * ============================================================
 *  DETALLE DE PRODUCTO (las 7 páginas producto-*.html)
 * ============================================================
 *  Un solo bloque para todas las páginas con data-pagina="producto":
 *   - Lee el precio desde data-precio del span .price con Number().
 *   - Muestra debajo del input cantidad "Total: $X USD" y lo actualiza
 *     con el evento "input" (corrigiendo entre 1 y 20 con if/else).
 *   - Al enviar "Añadir al Carrito", cancela el submit con preventDefault
 *     y muestra con createElement + after() el mensaje
 *     "✔ Agregaste N × NOMBRE" con un link "Ir al carrito", reemplazando
 *     el mensaje anterior si se vuelve a agregar.
 * ============================================================
 */
if (paginaActual === "producto") {
    const tituloProducto = document.querySelector(".detail-title").textContent;
    const spanPrecioUnitario = document.querySelector(".price");
    const precioUnitario = Number(spanPrecioUnitario.dataset.precio);

    const formAgregar = document.querySelector(".add-to-cart-form");
    const selectorCantidad = document.querySelector(".quantity-selector");
    const inputCantidad = document.querySelector("#cantidad");

    // Creamos el texto "Total: $X USD" y lo ubicamos debajo del selector de cantidad
    const textoTotal = document.createElement("p");
    textoTotal.classList.add("detail-total-preview");
    textoTotal.textContent = `Total: $${precioUnitario * Number(inputCantidad.value)} USD`;
    selectorCantidad.after(textoTotal);

    // Variable para guardar la referencia al mensaje de confirmación y no duplicarlo
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

    // Actualizamos el total en vivo cada vez que cambia el input
    inputCantidad.addEventListener("input", () => {
        actualizarTotalProducto();
    });

    // Al enviar "Añadir al Carrito", cancelamos el submit y mostramos el mensaje con after()
    formAgregar.addEventListener("submit", (e) => {
        e.preventDefault();

        // Nos aseguramos de que la cantidad esté validada entre 1 y 20
        actualizarTotalProducto();
        const cantidadElegida = Number(inputCantidad.value);

        // Si ya había un mensaje anterior, lo quitamos antes de crear el nuevo
        if (mensajeAgregado !== null) {
            mensajeAgregado.remove();
        }

        mensajeAgregado = document.createElement("div");
        mensajeAgregado.classList.add("added-to-cart-msg");

        const spanTexto = document.createElement("span");
        spanTexto.textContent = `✔ Agregaste ${cantidadElegida} × ${tituloProducto}`;

        const linkCarrito = document.createElement("a");
        linkCarrito.href = "cart.html";
        linkCarrito.classList.add("added-to-cart-link");
        linkCarrito.textContent = "Ir al carrito";

        mensajeAgregado.append(spanTexto, linkCarrito);

        // Insertamos el mensaje justo debajo del formulario usando after()
        formAgregar.after(mensajeAgregado);
    });
}

/*
 * ============================================================
 *  MOSTRAR / OCULTAR CONTRASEÑA (login.html y registro.html)
 * ============================================================
 *  Una sola arrow function reutilizada con querySelectorAll + forEach
 *  sobre todos los input[type="password"].
 *  Crea con createElement un botón type="button" al lado del input
 *  que alterna entre type="password" (ojo tachado) y type="text"
 *  (ojo abierto) usando getAttribute, setAttribute y un ternario.
 * ============================================================
 */
const agregarTogglePassword = (inputPassword) => {
    const contenedorPassword = document.createElement("div");
    contenedorPassword.classList.add("password-wrapper");

    // Insertamos el contenedor en el lugar del input y metemos el input adentro
    inputPassword.before(contenedorPassword);
    contenedorPassword.appendChild(inputPassword);

    const btnVerPassword = document.createElement("button");
    btnVerPassword.type = "button";
    // Arranca oculto (type="password"), por eso empieza con el ojo tachado
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

// Seleccionamos todos los inputs de contraseña de la página actual y les agregamos el botón
const inputsPasswordPagina = document.querySelectorAll('input[type="password"]');
inputsPasswordPagina.forEach(agregarTogglePassword);

/*
 * ============================================================
 *  FORMULARIO DE REGISTRO (registro.html)
 * ============================================================
 *  Sin quitar la validación HTML existente:
 *   - Arrow function reutilizable mostrarError(input, mensaje) que
 *     agrega .input-error al input y un <span class="error-msg">
 *     debajo con createElement + after().
 *   - Al corregir, quita .input-error y elimina el span con remove().
 *   - En el submit verifica que nombre y apellido no queden vacíos
 *     tras trim() y que password y confirm_password sean iguales (!==).
 *   - Si todo está bien, preventDefault y reemplaza el formulario
 *     por "¡Cuenta creada, NOMBRE!".
 * ============================================================
 */
if (paginaActual === "registro") {
    const formRegistro = document.querySelector(".auth-form");
    const inputNombre = document.querySelector("#nombre");
    const inputApellido = document.querySelector("#apellido");
    const inputPassword = document.querySelector("#password");
    const inputConfirmPassword = document.querySelector("#confirm_password");

    // Arrow function reutilizable para mostrar un error debajo de un input
    const mostrarError = (input, mensaje) => {
        const grupo = input.closest(".form-group");
        // Si ya tenía un mensaje de error previo, lo quitamos primero para no duplicarlo
        const errorPrevio = grupo.querySelector(".error-msg");
        if (errorPrevio !== null) {
            errorPrevio.remove();
        }

        input.classList.add("input-error");

        const spanError = document.createElement("span");
        spanError.classList.add("error-msg");
        spanError.textContent = mensaje;

        // Si el input está dentro de .password-wrapper, ponemos el error debajo del wrapper
        const elementoReferencia = input.parentElement.classList.contains("password-wrapper")
            ? input.parentElement
            : input;
        elementoReferencia.after(spanError);
    };

    // Arrow function para limpiar el error de un input cuando el usuario lo corrige
    const limpiarError = (input) => {
        input.classList.remove("input-error");
        const grupo = input.closest(".form-group");
        const errorPrevio = grupo.querySelector(".error-msg");
        if (errorPrevio !== null) {
            errorPrevio.remove();
        }
    };

    // Al escribir en cualquiera de los campos validados, quitamos el error si ya fue corregido
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

        // Limpiamos errores previos antes de volver a validar
        limpiarError(inputNombre);
        limpiarError(inputApellido);
        limpiarError(inputConfirmPassword);

        let hayErrores = false;

        // 1) Verificamos que nombre no quede vacío después de trim()
        if (inputNombre.value.trim() === "") {
            mostrarError(inputNombre, "El nombre no puede quedar vacío.");
            hayErrores = true;
        }

        // 2) Verificamos que apellido no quede vacío después de trim()
        if (inputApellido.value.trim() === "") {
            mostrarError(inputApellido, "El apellido no puede quedar vacío.");
            hayErrores = true;
        }

        // 3) Verificamos que password y confirm_password sean iguales (!==)
        if (inputPassword.value !== inputConfirmPassword.value) {
            mostrarError(inputConfirmPassword, "Las contraseñas no coinciden.");
            hayErrores = true;
        }

        // Si hubo algún error, cortamos acá
        if (hayErrores) {
            return;
        }

        // Si todo está bien, reemplazamos el formulario por "¡Cuenta creada, NOMBRE!"
        const nombreLimpio = inputNombre.value.trim();
        const mensajeExito = document.createElement("p");
        mensajeExito.classList.add("form-success-msg");
        mensajeExito.textContent = `¡Cuenta creada, ${nombreLimpio}!`;

        formRegistro.after(mensajeExito);
        formRegistro.remove();
    });
}

/*
 * ============================================================
 *  FORMULARIO DE INICIO DE SESIÓN (login.html)
 * ============================================================
 *  Al enviar el formulario válido:
 *   - Cancela el envío con preventDefault().
 *   - Oculta el formulario con classList.add("oculto").
 *   - Muestra "¡Bienvenido de nuevo!" con template literal.
 * ============================================================
 */
if (paginaActual === "login") {
    const formLogin = document.querySelector(".auth-form");
    const inputEmailLogin = document.querySelector("#email");

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

/*
 * ============================================================
 *  FORMULARIO DE RECUPERAR CONTRASEÑA (recuperar-password.html)
 * ============================================================
 *  Al enviar el formulario válido:
 *   - Cancela el envío con preventDefault().
 *   - Lee el email con .value y oculta el formulario con .oculto.
 *   - Muestra "Te enviamos un correo a EMAIL" con template literal.
 * ============================================================
 */
if (paginaActual === "recuperar") {
    const formRecuperar = document.querySelector(".auth-form");
    const inputEmailRecuperar = document.querySelector("#email");

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

/*
 * ============================================================
 *  FORMULARIO DE CONTACTO (contacto.html)
 * ============================================================
 *  - Agrega debajo del textarea un contador "N / 500 caracteres"
 *    que se actualiza en vivo con "input" usando .length y cambia
 *    de color con classList.toggle al pasar 450 caracteres.
 *  - Al enviar el formulario: preventDefault, muestra con console.table
 *    los datos enviados, oculta el formulario con classList.add("oculto")
 *    y muestra "¡Gracias NOMBRE! Te responderemos a EMAIL" junto a un
 *    botón "Enviar otro mensaje" que limpia los campos (.value = "")
 *    y vuelve a mostrar el formulario.
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

    // Creamos el contador "0 / 500 caracteres" debajo del textarea
    const contadorCaracteres = document.createElement("span");
    contadorCaracteres.classList.add("char-counter");
    contadorCaracteres.textContent = `${textareaMensaje.value.length} / 500 caracteres`;
    textareaMensaje.after(contadorCaracteres);

    // Actualizamos el contador en cada "input" y cambiamos de color al pasar 450
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

        // Mostramos los datos enviados con console.table()
        const datosEnviados = {
            nombre: nombre,
            email: email,
            telefono: telefono,
            motivo: motivo,
            mensaje: mensaje
        };
        console.table(datosEnviados);

        // Ocultamos el formulario con classList.add("oculto")
        formContacto.classList.add("oculto");

        // Si ya existía un mensaje previo, lo quitamos antes de crear el nuevo
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

        // Al hacer click en "Enviar otro mensaje", limpiamos los campos y volvemos a mostrar el form
        btnOtroMensaje.addEventListener("click", () => {
            inputNombreContacto.value = "";
            inputEmailContacto.value = "";
            inputTelefonoContacto.value = "";
            selectMotivoContacto.value = "";
            textareaMensaje.value = "";
            checkPrivacidad.checked = false;

            // Reseteamos también el contador de caracteres
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

/*
 * ============================================================
 *  ACORDEONES EXCLUSIVOS (<details>) EN FAQ Y PRODUCTOS
 * ============================================================
 *  Tanto en la FAQ de contacto.html (.faq-item) como en las
 *  páginas de producto (.product-accordion), al abrir un <details>
 *  se cierran automáticamente los demás.
 *  Usamos querySelectorAll, el evento "toggle", hasAttribute("open")
 *  y removeAttribute("open") con forEach, comparando con !== para
 *  no cerrar el que se acaba de abrir.
 * ============================================================
 */
const configurarAcordeonExclusivo = (selector) => {
    const acordeones = document.querySelectorAll(selector);

    acordeones.forEach((acordeonActual) => {
        acordeonActual.addEventListener("toggle", () => {
            // Verificamos si el acordeón se acaba de abrir con hasAttribute("open")
            if (acordeonActual.hasAttribute("open")) {
                // Recorremos todos y cerramos los que sean distintos (!==) al que se abrió
                acordeones.forEach((otroAcordeon) => {
                    if (otroAcordeon !== acordeonActual) {
                        otroAcordeon.removeAttribute("open");
                    }
                });
            }
        });
    });
};

// Aplicamos la lógica a la FAQ de contacto.html y a los acordeones de producto-*.html
configurarAcordeonExclusivo(".faq-item");
configurarAcordeonExclusivo(".product-accordion");






