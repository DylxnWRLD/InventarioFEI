
const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';
const RUTA_FORMATO = '../formatos/abs-cb-f-25.xlsx';
const IMAGEN_PREDETERMINADA = '../images/noEncontrado.png';

const NOMBRE_HOJA = 'Mobiliario -Herramientas';
const MAX_EQUIPOS = 10;
const FILA_INICIAL = 12;

// ==========================================
// ELEMENTOS HTML
// ==========================================

const inputBusqueda = document.getElementById('buscar-equipo');
const btnBuscar = document.getElementById('btn-buscar-equipo');
const resultadosBusqueda = document.getElementById('resultados-busqueda');
const equiposSeleccionadosContenedor = document.getElementById('equipos-seleccionados');
const contadorEquipos = document.getElementById('contador-equipos');
const btnLimpiar = document.getElementById('btn-limpiar-seleccion');
const btnGenerar = document.getElementById('btn-generar-excel');
const comboDictamen = document.getElementById('combo-dictamen');
const btnFiltroActivos = document.getElementById('btn-filtro-activos');
const visorExcel = document.getElementById('visor-excel');

// ==========================================
// VARIABLES GENERALES
// ==========================================

const equiposSeleccionados = [];

let catalogoDictamen = [];
let dictamenSeleccionado = null;
let libroExcel = null;
let identificadorBusqueda = 0;

let soloActivos = false;
let resultadosActuales = [];


// ==========================================
// CARGAR CATÁLOGO DE DICTÁMENES
// ==========================================

async function cargarCatalogoDictamen() {
    try {
        const respuesta = await fetch(`${API_BASE}/Dictamen`);

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener el catálogo de dictamen.');
        }

        const catalogo = await respuesta.json();

        if (!Array.isArray(catalogo)) {
            throw new Error(
                'La respuesta del servidor no contiene el catálogo de dictamen.'
            );
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
        actualizarEstadoBotonGenerar();

    } catch (error) {
        console.error('Error al cargar el catálogo de dictamen:', error);

        catalogoDictamen = [];
        dictamenSeleccionado = null;

        comboDictamen.replaceChildren();

        const opcionError = document.createElement('option');
        opcionError.value = '';
        opcionError.textContent = 'No se pudieron cargar los dictámenes';

        comboDictamen.appendChild(opcionError);

        comboDictamen.disabled = true;

        actualizarFormatoExcel();
        actualizarEstadoBotonGenerar();
    }
}


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

    imagen.src = equipo.urlImagen || IMAGEN_PREDETERMINADA;

    // Mostrar imagen alternativa si falla la carga
    imagen.addEventListener('error', () => {
        const rutaAlternativa = new URL(
            IMAGEN_PREDETERMINADA,
            document.baseURI
        ).href;

        if (imagen.src !== rutaAlternativa) {
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

        resultadosBusqueda.textContent =
            'Ingresa el número de inventario';

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

        // Ignorar respuestas de búsquedas anteriores
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

        const contenido = crearContenidoTarjeta(equipo);

        const boton = document.createElement('button');

        boton.type = 'button';
        boton.className = 'btn-agregar-equipo';

        const agregado = equiposSeleccionados.some(
            seleccionado =>
                seleccionado.numeroInventario === equipo.numeroInventario
        );

        const enProcesoDeBaja =
            equipo.estadoOperativo === 'EN_PROCESO_DE_BAJA';

        boton.textContent = agregado
            ? 'AGREGADO'
            : 'AGREGAR';

        boton.disabled =
            agregado ||
            enProcesoDeBaja ||
            equiposSeleccionados.length >= MAX_EQUIPOS;

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

    if (equiposSeleccionados.length >= MAX_EQUIPOS) {
        alert(`El formato permite un máximo de ${MAX_EQUIPOS} equipos.`);
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

    if (equiposSeleccionados.length === 0) {
        equiposSeleccionadosContenedor.textContent =
            'No hay equipos seleccionados.';

    } else {
        equiposSeleccionados.forEach(equipo => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-seleccionada';

            const contenido = crearContenidoTarjeta(equipo);

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

    aplicarFiltroResultados();

    actualizarFormatoExcel();

    actualizarEstadoBotonGenerar();
}


// ==========================================
// MOSTRAR AUTOMÁTICAMENTE LA PLANTILLA EXCEL
// ==========================================

async function mostrarFormatoBaja() {
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
            type: 'array',
            cellStyles: true
        });

        const hoja = libroExcel.Sheets[NOMBRE_HOJA];

        if (!hoja) {
            throw new Error('No se encontró la hoja del dictamen.');
        }

        actualizarFormatoExcel();
        actualizarEstadoBotonGenerar();

        console.log('Formato de baja cargado correctamente.');

    } catch (error) {
        console.error('Error al cargar el Excel:', error);

        libroExcel = null;

        visorExcel.textContent =
            'No se pudo mostrar el formato de baja.';

        actualizarEstadoBotonGenerar();
    }
}


// ==========================================
// CREAR HOJA EXCEL ACTUALIZADA
// ==========================================

function crearHojaActualizada() {
    if (!libroExcel) {
        return null;
    }

    const hojaOriginal = libroExcel.Sheets[NOMBRE_HOJA];

    if (!hojaOriginal) {
        return null;
    }

    // Copia de la estructura original de la hoja
    const hoja = { ...hojaOriginal };

    // Columnas relacionadas con las propiedades del equipo
    const columnas = {
        B: 'numeroActivo',
        E: 'numeroInventario',
        H: 'descripcion',
        N: 'noSerial',
        Q: 'marca',
        T: 'modelo'
    };

    // Escribir valor conservando las propiedades existentes
    function escribirCelda(direccion, valor) {
        const celdaOriginal = hojaOriginal[direccion] || {};

        hoja[direccion] = {
            ...celdaOriginal,
            t: 's',
            v: String(valor ?? '')
        };

        // Eliminar fórmula y valor formateado anterior
        delete hoja[direccion].f;
        delete hoja[direccion].w;
    }

    // Limpiar las 10 filas destinadas a equipos
    for (let indice = 0; indice < MAX_EQUIPOS; indice++) {
        const fila = FILA_INICIAL + indice;

        Object.keys(columnas).forEach(columna => {
            escribirCelda(`${columna}${fila}`, '');
        });
    }

    // Escribir los equipos seleccionados
    equiposSeleccionados.slice(0, MAX_EQUIPOS).forEach(
        (equipo, indice) => {
            const fila = FILA_INICIAL + indice;

            Object.entries(columnas).forEach(
                ([columna, propiedad]) => {
                    const direccion = `${columna}${fila}`;
                    const valor = equipo[propiedad] ?? '';

                    escribirCelda(direccion, valor);
                }
            );
        }
    );

    // Escribir el dictamen en la celda U10
    // Corresponde al recuadro combinado U10:AI10
    escribirCelda(
        'U10',
        dictamenSeleccionado
            ? dictamenSeleccionado.articulo
            : ''
    );

    return hoja;
}


// ==========================================
// ACTUALIZAR VISTA PREVIA DEL EXCEL
// ==========================================

function actualizarFormatoExcel() {
    if (!libroExcel) {
        return;
    }

    try {
        const hoja = crearHojaActualizada();

        if (!hoja) {
            throw new Error('No se pudo preparar la hoja Excel.');
        }

        visorExcel.innerHTML = XLSX.utils.sheet_to_html(hoja);

    } catch (error) {
        console.error('Error al actualizar el Excel:', error);

        visorExcel.textContent =
            'No se pudo actualizar la vista previa del formato.';
    }
}


// ==========================================
// ACTIVAR O DESACTIVAR BOTÓN GENERAR
// ==========================================

function actualizarEstadoBotonGenerar() {
    const hayEquipos = equiposSeleccionados.length > 0;
    const hayDictamen = dictamenSeleccionado !== null;
    const hayFormato = libroExcel !== null;

    btnGenerar.disabled = !(
        hayEquipos &&
        hayDictamen &&
        hayFormato
    );
}


// ==========================================
// GENERAR Y DESCARGAR EXCEL
// ==========================================

function generarExcel() {
    if (!libroExcel) {
        alert('El formato Excel todavía no está disponible.');
        return;
    }

    if (equiposSeleccionados.length === 0) {
        alert('Debes seleccionar al menos un equipo.');
        return;
    }

    if (!dictamenSeleccionado) {
        alert('Debes seleccionar un dictamen.');
        return;
    }

    try {
        const hojaActualizada = crearHojaActualizada();

        if (!hojaActualizada) {
            throw new Error('No se pudo generar la hoja Excel.');
        }

        // Conservar las demás hojas del libro original
        const libroGenerado = {
            ...libroExcel,
            Sheets: {
                ...libroExcel.Sheets,
                [NOMBRE_HOJA]: hojaActualizada
            }
        };

        // Nombre del archivo generado
        const nombreArchivo = 'Formato_Baja_Equipos_FEI.xlsx';

        XLSX.writeFile(libroGenerado, nombreArchivo, {
            bookType: 'xlsx',
            cellStyles: true
        });

        console.log('Formato Excel generado correctamente.');

    } catch (error) {
        console.error('Error al generar el Excel:', error);

        alert('No se pudo generar el formato Excel.');
    }
}


// ==========================================
// EVENTOS
// ==========================================

// Buscar equipos mediante el botón
btnBuscar.addEventListener('click', buscarEquipos);

// Buscar al presionar Enter
inputBusqueda.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        evento.preventDefault();
        buscarEquipos();
    }
});

// Filtrar equipos activos
btnFiltroActivos.addEventListener(
    'click',
    alternarFiltroActivos
);

// Limpiar selección
btnLimpiar.addEventListener('click', () => {
    equiposSeleccionados.length = 0;
    actualizarSeleccion();
});

// Seleccionar dictamen
comboDictamen.addEventListener('change', () => {
    const idArticulo = comboDictamen.value;

    dictamenSeleccionado = idArticulo
        ? catalogoDictamen.find(
            articulo => String(articulo.idArticulo) === idArticulo
        ) || null
        : null;

    actualizarFormatoExcel();
    actualizarEstadoBotonGenerar();
});

// Generar y descargar archivo Excel
btnGenerar.addEventListener('click', generarExcel);


// ==========================================
// INICIALIZAR MÓDULO
// ==========================================

function inicializarModulo() {
    comboDictamen.disabled = true;
    btnGenerar.disabled = true;

    actualizarSeleccion();

    mostrarFormatoBaja();
    cargarCatalogoDictamen();
}

// Funciona con scripts normales o deferidos
if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        inicializarModulo
    );
} else {
    inicializarModulo();
}
