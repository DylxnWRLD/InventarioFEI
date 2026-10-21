
const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';
const RUTA_FORMATO = '../formatos/abs-cb-f-25.xlsx';

// Elementos HTML
const inputBusqueda = document.getElementById('buscar-equipo');
const btnBuscar = document.getElementById('btn-buscar-equipo');
const resultadosBusqueda = document.getElementById('resultados-busqueda');
const equiposSeleccionadosContenedor = document.getElementById('equipos-seleccionados');
const contadorEquipos = document.getElementById('contador-equipos');
const btnLimpiar = document.getElementById('btn-limpiar-seleccion');
const btnGenerar = document.getElementById('btn-generar-excel');
const comboDictamen = document.getElementById('combo-dictamen');
const btnFiltroActivos = document.getElementById('btn-filtro-activos');

// Variables generales
const equiposSeleccionados = [];
let catalogoDictamen = [];
let dictamenSeleccionado = null;
let libroExcel = null;
let identificadorBusqueda = 0;

// Cargar las opciones del dictamen desde la base de datos
async function cargarCatalogoDictamen() {
    try {
        const respuesta = await fetch(`${API_BASE}/Dictamen`);

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener el catálogo de dictamen.');
        }

        const catalogo = await respuesta.json();

        if (!Array.isArray(catalogo)) {
            throw new Error('La respuesta del servidor no contiene el catálogo de dictamen.');
        }

        catalogoDictamen = catalogo;
        dictamenSeleccionado = null;

        comboDictamen.replaceChildren();

        const opcionPorDefecto = document.createElement('option');
        opcionPorDefecto.value = '';
        opcionPorDefecto.textContent = 'Seleccione un dictamen...';
        comboDictamen.appendChild(opcionPorDefecto);

        catalogoDictamen.forEach(articulo => {
            const opcion = document.createElement('option');
            opcion.value = articulo.idArticulo;
            opcion.textContent = articulo.articulo;
            comboDictamen.appendChild(opcion);
        });

        comboDictamen.disabled = false;
        comboDictamen.value = '';

        actualizarFormatoExcel();

    } catch (error) {
        console.error('Error al cargar el catálogo de dictamen:', error);

        comboDictamen.replaceChildren();

        const opcionError = document.createElement('option');
        opcionError.value = '';
        opcionError.textContent = 'No se pudieron cargar los dictámenes';
        comboDictamen.appendChild(opcionError);

        comboDictamen.disabled = true;
    }
}

// Cargar las opciones del dictamen desde la base de datos
async function cargarCatalogoDictamen() {
    try {
        const respuesta = await fetch(`${API_BASE}/Dictamen`);

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener el catálogo de dictamen.');
        }

        const catalogo = await respuesta.json();

        if (!Array.isArray(catalogo)) {
            throw new Error('La respuesta del servidor no contiene el catálogo de dictamen.');
        }

        catalogoDictamen = catalogo;
        dictamenSeleccionado = null;

        comboDictamen.replaceChildren();

        const opcionPorDefecto = document.createElement('option');
        opcionPorDefecto.value = '';
        opcionPorDefecto.textContent = 'Seleccione un dictamen...';
        comboDictamen.appendChild(opcionPorDefecto);

        catalogoDictamen.forEach(articulo => {
            const opcion = document.createElement('option');
            opcion.value = articulo.idArticulo;
            opcion.textContent = articulo.articulo;
            comboDictamen.appendChild(opcion);
        });

        comboDictamen.disabled = false;
        comboDictamen.value = '';

        actualizarFormatoExcel();

    } catch (error) {
        console.error('Error al cargar el catálogo de dictamen:', error);

        comboDictamen.replaceChildren();

        const opcionError = document.createElement('option');
        opcionError.value = '';
        opcionError.textContent = 'No se pudieron cargar los dictámenes';
        comboDictamen.appendChild(opcionError);

        comboDictamen.disabled = true;
    }
}

// Filtro de equipos
let soloActivos = false;
let resultadosActuales = [];

// Imagen alternativa cuando no existe una imagen en Supabase
const IMAGEN_PREDETERMINADA = '../images/noEncontrado.png';



// ==========================================
// FUNCIONES PARA CONSTRUIR LAS TARJETAS
// ==========================================

// Crear campo con etiqueta en negrita y valor normal
function crearCampo(etiqueta, valor) {
    const parrafo = document.createElement('p');

    const negrita = document.createElement('strong');
    negrita.textContent = `${etiqueta}: `;

    const contenido = document.createElement('span');
    contenido.textContent = valor ?? 'No disponible';

    parrafo.append(negrita, contenido);

    return parrafo;
}


// Crear imagen del equipo usando su URL de Supabase
function crearImagenEquipo(equipo) {
    const imagen = document.createElement('img');

    imagen.className = 'imagen-equipo';
    imagen.alt = `Imagen del equipo ${equipo.numeroInventario}`;
    imagen.loading = 'lazy';

    // Si no hay URL, utilizar imagen predeterminada
    imagen.src = equipo.urlImagen || IMAGEN_PREDETERMINADA;

    // Si falla la imagen de Supabase, mostrar imagen alternativa
    imagen.addEventListener('error', () => {
        if (imagen.src !== new URL(
            IMAGEN_PREDETERMINADA,
            document.baseURI
        ).href) {
            imagen.src = IMAGEN_PREDETERMINADA;
        }
    });

    return imagen;
}


// Crear información del equipo
function crearInformacionEquipo(equipo) {
    const informacion = document.createElement('div');
    informacion.className = 'informacion-equipo';

    const descripcion = document.createElement('p');
    descripcion.className = 'descripcion-equipo';
    descripcion.textContent = equipo.descripcion || 'Sin descripción';

    const inventario = crearCampo(
        'Inventario',
        equipo.numeroInventario
    );

    const marca = crearCampo(
        'Marca',
        equipo.marca || 'Sin marca'
    );

    const estado = crearCampo(
        'Estado',
        equipo.estadoOperativo || 'No disponible'
    );

    informacion.append(
        descripcion,
        inventario,
        marca,
        estado
    );

    return informacion;
}


// Crear estructura de información e imagen
function crearContenidoTarjeta(equipo) {
    const contenido = document.createElement('div');
    contenido.className = 'contenido-tarjeta';

    const informacion = crearInformacionEquipo(equipo);
    const imagen = crearImagenEquipo(equipo);

    contenido.append(informacion, imagen);

    return contenido;
}


// ==========================================
// BUSCAR EQUIPOS EN POSTGRESQL
// ==========================================

async function buscarEquipos() {
    const textoBusqueda = inputBusqueda.value.trim();
    const busquedaActual = ++identificadorBusqueda;

    if (!textoBusqueda) {
        resultadosActuales = [];
        resultadosBusqueda.textContent = 'Ingresa el número de inventario';
        return;
    }

    resultadosBusqueda.textContent = 'Buscando equipos...';

    try {
        const respuesta = await fetch(
            `${API_BASE}/Equipos/Buscar?q=${encodeURIComponent(textoBusqueda)}&pagina=1`
        );

        if (!respuesta.ok) {
            throw new Error('No se pudieron obtener los equipos.');
        }

        const datos = await respuesta.json();

        if (busquedaActual !== identificadorBusqueda) {
            return;
        }

        const equipos = datos.equipos;

        if (!Array.isArray(equipos)) {
            throw new Error(
                'La respuesta del servidor no contiene una lista de equipos.'
            );
        }

        resultadosActuales = equipos;

        aplicarFiltroResultados();

    } catch (error) {
        if (busquedaActual !== identificadorBusqueda) {
            return;
        }

        console.error('Error al buscar equipos:', error);

        resultadosActuales = [];
        resultadosBusqueda.textContent =
            'Ocurrió un error durante la búsqueda.';
    }
}


// ==========================================
// FILTRAR EQUIPOS ACTIVOS
// ==========================================

function aplicarFiltroResultados() {
    const equiposFiltrados = soloActivos
        ? resultadosActuales.filter(
            equipo => equipo.estadoOperativo === 'ACTIVO'
        )
        : resultadosActuales;

    mostrarResultados(equiposFiltrados);
}


// Alternar entre activos y todos los resultados
function alternarFiltroActivos() {
    soloActivos = !soloActivos;

    btnFiltroActivos.classList.toggle('activo', soloActivos);

    btnFiltroActivos.textContent = soloActivos
        ? 'Mostrar todos los equipos'
        : 'Mostrar solo equipos activos';

    btnFiltroActivos.setAttribute(
        'aria-pressed',
        String(soloActivos)
    );

    aplicarFiltroResultados();
}


// ==========================================
// MOSTRAR RESULTADOS DE BÚSQUEDA
// ==========================================

function mostrarResultados(equipos) {
    resultadosBusqueda.replaceChildren();

    if (equipos.length === 0) {
        resultadosBusqueda.textContent = soloActivos
            ? 'No se encontraron equipos activos.'
            : 'No se encontraron equipos.';

        return;
    }

    equipos.forEach(equipo => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-resultado';

        // Información e imagen del equipo
        const contenido = crearContenidoTarjeta(equipo);

        // Botón agregar
        const boton = document.createElement('button');

        boton.type = 'button';
        boton.className = 'btn-agregar-equipo';

        const agregado = equiposSeleccionados.some(
            seleccionado =>
                seleccionado.numeroInventario === equipo.numeroInventario
        );

        boton.textContent = agregado ? 'AGREGADO' : 'AGREGAR';

        boton.disabled =
            agregado ||
            equipo.estadoOperativo === 'EN_PROCESO_DE_BAJA';

        boton.addEventListener('click', () => {
            agregarEquipo(equipo);
        });

        tarjeta.append(contenido, boton);

        resultadosBusqueda.appendChild(tarjeta);
    });
}


// ==========================================
// AGREGAR EQUIPO A LA LISTA
// ==========================================

function agregarEquipo(equipo) {
    const existe = equiposSeleccionados.some(
        seleccionado =>
            seleccionado.numeroInventario === equipo.numeroInventario
    );

    if (existe) {
        alert('Este equipo ya está seleccionado.');
        return;
    }

    if (equipo.estadoOperativo === 'EN_PROCESO_DE_BAJA') {
        alert('El equipo ya se encuentra en proceso de baja.');
        return;
    }

    if (equiposSeleccionados.length >= 10) {
        alert('El formato permite un máximo de 10 equipos.');
        return;
    }

    equiposSeleccionados.push(equipo);

    actualizarSeleccion();
}


// ==========================================
// ELIMINAR EQUIPO SELECCIONADO
// ==========================================

function eliminarEquipo(numeroInventario) {
    const indice = equiposSeleccionados.findIndex(
        equipo => equipo.numeroInventario === numeroInventario
    );

    if (indice !== -1) {
        equiposSeleccionados.splice(indice, 1);
    }

    actualizarSeleccion();
}


// ==========================================
// ACTUALIZAR EQUIPOS SELECCIONADOS
// ==========================================

function actualizarSeleccion() {
    equiposSeleccionadosContenedor.replaceChildren();

    contadorEquipos.textContent = equiposSeleccionados.length;

    btnLimpiar.disabled = equiposSeleccionados.length === 0;

    // Se activará cuando implementemos la generación del archivo
    btnGenerar.disabled = true;

    if (equiposSeleccionados.length === 0) {
        equiposSeleccionadosContenedor.textContent =
            'No hay equipos seleccionados.';

    } else {
        equiposSeleccionados.forEach(equipo => {
            const tarjeta = document.createElement('div');

            tarjeta.className = 'tarjeta-seleccionada';

            // Información e imagen del equipo
            const contenido = crearContenidoTarjeta(equipo);

            // Botón quitar
            const botonEliminar = document.createElement('button');

            botonEliminar.type = 'button';
            botonEliminar.textContent = 'QUITAR';
            botonEliminar.className = 'btn-quitar-equipo';

            botonEliminar.addEventListener('click', () => {
                eliminarEquipo(equipo.numeroInventario);
            });

            tarjeta.append(contenido, botonEliminar);

            equiposSeleccionadosContenedor.appendChild(tarjeta);
        });
    }

    // Actualizar botones AGREGAR / AGREGADO
    aplicarFiltroResultados();

    // Actualizar el formato Excel
    actualizarFormatoExcel();
}


// ==========================================
// MOSTRAR AUTOMÁTICAMENTE LA PLANTILLA EXCEL
// ==========================================

async function mostrarFormatoBaja() {
    const visor = document.getElementById('visor-excel');

    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('No se pudo cargar la librería de Excel.');
        }

        const respuesta = await fetch(RUTA_FORMATO);

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener el formato de baja.');
        }

        const archivo = await respuesta.arrayBuffer();

        libroExcel = XLSX.read(archivo, {
            type: 'array'
        });

        const hoja = libroExcel.Sheets['Mobiliario -Herramientas'];

        if (!hoja) {
            throw new Error('No se encontró la hoja del dictamen.');
        }

        actualizarFormatoExcel();

        console.log('Formato de baja cargado correctamente.');

    } catch (error) {
        console.error('Error al cargar el Excel:', error);
        visor.textContent = 'No se pudo mostrar el formato de baja.';
    }
}


// ==========================================
// ACTUALIZAR FORMATO EXCEL
// ==========================================

function actualizarFormatoExcel() {
    if (!libroExcel) {
        return;
    }

    const visor = document.getElementById('visor-excel');
    const hojaOriginal = libroExcel.Sheets['Mobiliario -Herramientas'];

    // Copia de las referencias de las celdas
    const hoja = { ...hojaOriginal };

    // Columnas del Excel relacionadas con propiedades del equipo
    const columnas = {
        B: 'numeroActivo',
        E: 'numeroInventario',
        H: 'descripcion',
        N: 'noSerial',
        Q: 'marca',
        T: 'modelo'
    };

    // Recorrer un máximo de 10 equipos
    equiposSeleccionados.slice(0, 10).forEach((equipo, indice) => {
        const fila = 12 + indice;

        Object.entries(columnas).forEach(([columna, propiedad]) => {
            const celda = `${columna}${fila}`;
            const valor = equipo[propiedad] ?? '';

            // Conservar estilo de la celda original
            hoja[celda] = {
                ...hojaOriginal[celda],
                t: 's',
                v: String(valor)
            };

            // Evitar que una fórmula anterior sustituya el valor
            delete hoja[celda].f;
            delete hoja[celda].w;
        });
    });

    // Escribir el dictamen seleccionado en el recuadro
    // "Supuesto del artículo 54" (celdas combinadas U10:AI10)
    const celdaSupuesto = 'U10';

    hoja[celdaSupuesto] = {
        ...hojaOriginal[celdaSupuesto],
        t: 's',
        v: dictamenSeleccionado ? dictamenSeleccionado.articulo : ''
    };

    // Evitar que una fórmula anterior sustituya el valor
    delete hoja[celdaSupuesto].f;
    delete hoja[celdaSupuesto].w;

    // Escribir el dictamen seleccionado en el recuadro
    // "Supuesto del artículo 54" (celdas combinadas U10:AI10)
    const celdaSupuesto = 'U10';

    hoja[celdaSupuesto] = {
        ...hojaOriginal[celdaSupuesto],
        t: 's',
        v: dictamenSeleccionado ? dictamenSeleccionado.articulo : ''
    };

    // Evitar que una fórmula anterior sustituya el valor
    delete hoja[celdaSupuesto].f;
    delete hoja[celdaSupuesto].w;

    // Mostrar Excel con equipos seleccionados
    visor.innerHTML = XLSX.utils.sheet_to_html(hoja);
}


// ==========================================
// EVENTOS
// ==========================================

// Buscar equipos
btnBuscar.addEventListener('click', buscarEquipos);

// Buscar al presionar Enter
inputBusqueda.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        buscarEquipos();
    }
});

// Filtrar activos
btnFiltroActivos.addEventListener('click', alternarFiltroActivos);

// Limpiar selección
btnLimpiar.addEventListener('click', () => {
    equiposSeleccionados.length = 0;
    actualizarSeleccion();
});

comboDictamen.addEventListener('change', () => {
    const idArticulo = Number(comboDictamen.value);

    dictamenSeleccionado = idArticulo
        ? catalogoDictamen.find(articulo => articulo.idArticulo === idArticulo) || null
        : null;

    actualizarFormatoExcel();
});

comboDictamen.addEventListener('change', () => {
    const idArticulo = Number(comboDictamen.value);

    dictamenSeleccionado = idArticulo
        ? catalogoDictamen.find(articulo => articulo.idArticulo === idArticulo) || null
        : null;

    actualizarFormatoExcel();
});


// ==========================================
// INICIALIZAR MÓDULO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    mostrarFormatoBaja();
    cargarCatalogoDictamen();
    actualizarSeleccion();
});
