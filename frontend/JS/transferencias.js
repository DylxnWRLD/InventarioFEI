
const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';
const RUTA_FORMATO = '../formatos/abs-cb-f-16.xlsx';
const IMAGEN_PREDETERMINADA = '../images/noEncontrado.png';

const HOJA = 'ABS-CB-F-16';
const MAX_EQUIPOS = 15;
const FILA_INICIAL = 15;
const REGISTRAR_EN_BD = true;

const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

// ==========================================
// ELEMENTOS HTML
// ==========================================

const $ = id => document.getElementById(id);

const inputBusqueda = $('buscar-equipo');
const resultados = $('resultados-busqueda');
const seleccionados = $('equipos-seleccionados');
const contador = $('contador-equipos');
const btnLimpiar = $('btn-limpiar-seleccion');
const btnGenerar = $('btn-generar-excel');
const visor = $('visor-excel');
const formulario = $('datos-transferencia');
const estado = $('estado-transferencia');

let equipos = [];
let resultadosActuales = [];
let libro = null;
let archivoOriginal = null;
let procesando = false;
let numeroBusqueda = 0;
let urlDescarga = null;

// ==========================================
// DATOS DEL PRÉSTAMO
// ==========================================

function obtenerDatos() {
    return {
        nombreEntrega: $('nombre-entrega').value.trim(),
        identificador: $('identificador-dependencia').value.trim(),
        dependencia: $('dependencia').value.trim(),
        nombreRecibe: $('nombre-recibe').value.trim(),
        fecha: $('fecha-prestamo').value,
        justificacion: $('justificacion').value.trim(),
        nombreTitular: $('nombre-titular').value.trim()
    };
}

// ==========================================
// TARJETAS DE EQUIPOS
// ==========================================

function crearTarjeta(equipo, seleccionado = false) {
    const tarjeta = document.createElement('div');
    tarjeta.className = seleccionado
        ? 'tarjeta-seleccionada'
        : 'tarjeta-resultado';

    const contenido = document.createElement('div');
    contenido.className = 'contenido-tarjeta';

    const informacion = document.createElement('div');
    informacion.className = 'informacion-equipo';

    const descripcion = document.createElement('p');
    descripcion.className = 'descripcion-equipo';
    descripcion.textContent = equipo.descripcion || 'Sin descripción';
    informacion.appendChild(descripcion);

    const campos = {
        Inventario: equipo.numeroInventario,
        Marca: equipo.marca,
        Estado: equipo.estadoOperativo,
        Ubicación: equipo.ubicacion
    };

    Object.entries(campos).forEach(([nombre, valor]) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = `${nombre}: `;

        const span = document.createElement('span');
        span.textContent = valor || 'No disponible';

        p.append(strong, span);
        informacion.appendChild(p);
    });

    const imagen = document.createElement('img');
    imagen.className = 'imagen-equipo';
    imagen.alt = `Equipo ${equipo.numeroInventario}`;
    imagen.loading = 'lazy';
    imagen.src = equipo.urlImagen || IMAGEN_PREDETERMINADA;

    imagen.onerror = () => {
        imagen.onerror = null;
        imagen.src = IMAGEN_PREDETERMINADA;
    };

    contenido.append(informacion, imagen);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = seleccionado
        ? 'btn-quitar-equipo'
        : 'btn-agregar-equipo';

    const agregado = equipos.some(
        e => e.numeroInventario === equipo.numeroInventario
    );

    boton.textContent = seleccionado
        ? 'QUITAR'
        : agregado ? 'AGREGADO' : 'AGREGAR';

    boton.disabled = procesando || (!seleccionado &&
        (agregado || equipos.length >= MAX_EQUIPOS));

    boton.onclick = () => seleccionado
        ? quitarEquipo(equipo.numeroInventario)
        : agregarEquipo(equipo);

    tarjeta.append(contenido, boton);
    return tarjeta;
}

// ==========================================
// BUSCAR EQUIPOS ACTIVOS
// ==========================================

async function buscarEquipos() {
    const busqueda = inputBusqueda.value.trim();
    const actual = ++numeroBusqueda;

    if (!busqueda) {
        resultados.textContent = 'Ingresa un dato para buscar.';
        return;
    }

    resultados.textContent = 'Buscando equipos...';

    try {
        const respuesta = await fetch(
            `${API_BASE}/Equipos/Buscar?q=${encodeURIComponent(busqueda)}&pagina=1`
        );

        if (!respuesta.ok) throw new Error('Error al consultar equipos.');

        const datos = await respuesta.json();
        if (actual !== numeroBusqueda) return;

        if (!Array.isArray(datos.equipos)) {
            throw new Error('Respuesta inválida del servidor.');
        }

        resultadosActuales = datos.equipos.filter(
            e => e.estadoOperativo === 'ACTIVO'
        );

        mostrarResultados();

    } catch (error) {
        if (actual !== numeroBusqueda) return;
        console.error(error);
        resultados.textContent = 'No se pudo realizar la búsqueda.';
    }
}

function mostrarResultados() {
    resultados.replaceChildren();

    if (!resultadosActuales.length) {
        resultados.textContent = 'No se encontraron equipos activos.';
        return;
    }

    resultadosActuales.forEach(equipo => {
        resultados.appendChild(crearTarjeta(equipo));
    });
}

// ==========================================
// SELECCIÓN DE EQUIPOS
// ==========================================

function agregarEquipo(equipo) {
    if (procesando) return;

    if (equipo.estadoOperativo !== 'ACTIVO') {
        alert('Solo se permiten equipos activos.');
        return;
    }

    if (equipos.some(e => e.numeroInventario === equipo.numeroInventario)) {
        return;
    }

    if (equipos.length >= MAX_EQUIPOS) {
        alert(`Máximo ${MAX_EQUIPOS} equipos.`);
        return;
    }

    equipos.push(equipo);
    actualizarSeleccion();
}

function quitarEquipo(numeroInventario) {
    if (procesando) return;

    equipos = equipos.filter(
        e => e.numeroInventario !== numeroInventario
    );

    actualizarSeleccion();
}

function actualizarSeleccion() {
    seleccionados.replaceChildren();
    contador.textContent = equipos.length;
    btnLimpiar.disabled = procesando || equipos.length === 0;

    if (!equipos.length) {
        seleccionados.textContent = 'No hay equipos seleccionados.';
    } else {
        equipos.forEach(equipo => {
            seleccionados.appendChild(crearTarjeta(equipo, true));
        });
    }

    mostrarResultados();
    actualizarVistaPrevia();
    actualizarBoton();
}

// ==========================================
// FECHAS Y CELDAS DEL FORMATO
// ==========================================

function fechaExcel(fecha) {
    if (!fecha) return '';

    const [a, m, d] = fecha.split('-').map(Number);
    const fechaUTC = Date.UTC(a, m - 1, d);

    if (
        !Number.isFinite(fechaUTC) ||
        new Date(fechaUTC).toISOString().slice(0, 10) !== fecha
    ) {
        throw new Error('Fecha inválida.');
    }

    return (fechaUTC - Date.UTC(1899, 11, 30)) / 86400000;
}

function obtenerCeldas() {
    const datos = obtenerDatos();

    const celdas = {
        D7: datos.nombreEntrega,
        D9: datos.identificador,
        E9: datos.dependencia,
        D12: datos.nombreRecibe,
        D30: datos.justificacion,
        C40: datos.nombreTitular,
        I40: datos.nombreRecibe
    };

    const columnas = {
        B: 'numeroInventario',
        D: 'cantidad',
        E: 'descripcion',
        I: 'noSerial',
        J: 'marca',
        K: 'fecha'
    };

    const fecha = fechaExcel(datos.fecha);

    // Limpiar las 14 filas
    for (let i = 0; i < MAX_EQUIPOS; i++) {
        Object.keys(columnas).forEach(col => {
            celdas[`${col}${FILA_INICIAL + i}`] = '';
        });
    }

    // Agregar equipos seleccionados
    equipos.forEach((equipo, i) => {
        const valores = {
            ...equipo,
            cantidad: 1,
            fecha
        };

        Object.entries(columnas).forEach(([col, propiedad]) => {
            celdas[`${col}${FILA_INICIAL + i}`] =
                valores[propiedad] ?? '';
        });
    });

    return celdas;
}

// ==========================================
// CARGAR PLANTILLA EXCEL
// ==========================================

async function cargarFormato() {
    try {
        if (typeof XLSX === 'undefined' || typeof JSZip === 'undefined') {
            throw new Error('No se cargaron las bibliotecas de Excel.');
        }

        const respuesta = await fetch(RUTA_FORMATO);
        if (!respuesta.ok) throw new Error('No se encontró la plantilla.');

        archivoOriginal = await respuesta.arrayBuffer();

        libro = XLSX.read(archivoOriginal, {
            type: 'array',
            cellStyles: true
        });

        if (!libro.Sheets[HOJA]) {
            throw new Error('No existe la hoja ABS-CB-F-16.');
        }

        actualizarVistaPrevia();

    } catch (error) {
        console.error(error);
        libro = null;
        archivoOriginal = null;
        visor.textContent = error.message;
    }

    actualizarBoton();
}

// ==========================================
// VISTA PREVIA
// ==========================================

function actualizarVistaPrevia() {
    if (!libro) return;

    try {
        const original = libro.Sheets[HOJA];
        const hoja = { ...original };

        Object.entries(obtenerCeldas()).forEach(([direccion, valor]) => {
            const celda = { ...(original[direccion] || {}) };

            celda.t = typeof valor === 'number' ? 'n' : 's';
            celda.v = valor;

            delete celda.f;
            delete celda.w;
            delete celda.h;
            delete celda.r;

            hoja[direccion] = celda;
        });

        visor.innerHTML = XLSX.utils.sheet_to_html(hoja);

    } catch (error) {
        console.error(error);
        visor.textContent = 'Error al actualizar la vista previa.';
    }
}

// ==========================================
// MODIFICAR CELDAS XML
// ==========================================

function escribirCeldaXML(documento, direccion, valor) {
    const celdas = Array.from(
        documento.getElementsByTagNameNS(NS, 'c')
    );

    const celda = celdas.find(
        c => c.getAttribute('r') === direccion
    );

    if (!celda) {
        throw new Error(`No existe la celda ${direccion} en la plantilla.`);
    }

    Array.from(celda.children).forEach(nodo => {
        if (['f', 'v', 'is'].includes(nodo.localName)) {
            celda.removeChild(nodo);
        }
    });

    if (typeof valor === 'number') {
        celda.setAttribute('t', 'n');

        const v = documento.createElementNS(NS, 'v');
        v.textContent = String(valor);
        celda.appendChild(v);

    } else {
        celda.setAttribute('t', 'inlineStr');

        const is = documento.createElementNS(NS, 'is');
        const t = documento.createElementNS(NS, 't');

        t.textContent = String(valor ?? '');
        t.setAttributeNS(
            'http://www.w3.org/XML/1998/namespace',
            'xml:space',
            'preserve'
        );

        is.appendChild(t);
        celda.appendChild(is);
    }
}

// ==========================================
// GENERAR EXCEL ORIGINAL
// ==========================================

async function crearExcel() {
    const zip = await JSZip.loadAsync(archivoOriginal);
    const ruta = 'xl/worksheets/sheet1.xml';
    const archivo = zip.file(ruta);

    if (!archivo) throw new Error('No se encontró la hoja del formato.');

    const xml = await archivo.async('string');
    const documento = new DOMParser().parseFromString(
        xml, 'application/xml'
    );

    if (documento.getElementsByTagName('parsererror').length) {
        throw new Error('El XML del formato es inválido.');
    }

    Object.entries(obtenerCeldas()).forEach(([direccion, valor]) => {
        escribirCeldaXML(documento, direccion, valor);
    });

    // Quitar protección del documento generado
    const protecciones = documento.getElementsByTagNameNS(
        NS, 'sheetProtection'
    );

    while (protecciones.length) {
        protecciones[0].remove();
    }

    zip.file(ruta, new XMLSerializer().serializeToString(documento));

    return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE'
    });
}

// ==========================================
// ACTUALIZAR ESTADO EN LA BD
// ==========================================

async function registrarPrestamo() {

    const datos = obtenerDatos();

    const respuesta = await fetch(`${API_BASE}/Prestamo/Equipos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...datos,
            equipos: equipos.map(e => e.numeroInventario)
        })
    });

    if (!respuesta.ok) {
        throw new Error(
            'No se pudo registrar el préstamo. Verifica los datos y la disponibilidad de los equipos.'
        );
    }

    return await respuesta.json();
}

// ==========================================
// VALIDAR Y GENERAR
// ==========================================

function actualizarBoton() {
    const campos = formulario.querySelectorAll('[required]');

    const validos = Array.from(campos).every(
        campo => campo.value.trim() && campo.checkValidity()
    );

    btnGenerar.disabled =
        procesando || !archivoOriginal || !equipos.length || !validos;
}

async function generarTransferencia() {
    if (procesando) return;

    const campos = formulario.querySelectorAll('[required]');

    for (const campo of campos) {
        if (campo.type !== 'date') campo.value = campo.value.trim();
        if (!campo.reportValidity()) return;
    }

    if (!equipos.length || !archivoOriginal) return;

    try {
        procesando = true;
        btnGenerar.disabled = true;
        estado.textContent = 'Generando documento...';

        const excel = await crearExcel();

        if (REGISTRAR_EN_BD) {
            await registrarPrestamo();
        }

        if (urlDescarga) URL.revokeObjectURL(urlDescarga);
        urlDescarga = URL.createObjectURL(excel);

        const enlace = document.createElement('a');
        enlace.href = urlDescarga;
        enlace.download = `vale_salida_${$('fecha-prestamo').value}.xlsx`;
        enlace.textContent = 'Volver a descargar el Excel';

        estado.replaceChildren(
            document.createTextNode(
                REGISTRAR_EN_BD
                    ? 'Préstamo registrado. '
                    : 'Documento generado correctamente. '
            ),
            enlace
        );

        if (REGISTRAR_EN_BD) {
            const registrados = new Set(equipos.map(e => e.numeroInventario));

            resultadosActuales = resultadosActuales.filter(
                e => !registrados.has(e.numeroInventario)
            );

            equipos = [];
        }

        enlace.click();

    } catch (error) {
        console.error(error);
        estado.textContent = error.message;
        alert(error.message);

    } finally {
        procesando = false;
        btnGenerar.textContent = REGISTRAR_EN_BD
            ? 'REGISTRAR PRÉSTAMO Y DESCARGAR EXCEL'
            : 'GENERAR Y DESCARGAR EXCEL';

        actualizarSeleccion();
    }
}

// ==========================================
// EVENTOS
// ==========================================

$('btn-buscar-equipo').addEventListener('click', buscarEquipos);

inputBusqueda.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        buscarEquipos();
    }
});

btnLimpiar.addEventListener('click', () => {
    if (procesando) return;
    equipos = [];
    actualizarSeleccion();
});

formulario.addEventListener('input', () => {
    actualizarVistaPrevia();
    actualizarBoton();
});

btnGenerar.addEventListener('click', generarTransferencia);

window.addEventListener('beforeunload', () => {
    if (urlDescarga) URL.revokeObjectURL(urlDescarga);
});

// ==========================================
// INICIALIZAR
// ==========================================

const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
}).format(new Date());

$('fecha-prestamo').value = hoy;
$('fecha-prestamo').max = hoy;

btnGenerar.textContent = REGISTRAR_EN_BD
    ? 'REGISTRAR PRÉSTAMO Y DESCARGAR EXCEL'
    : 'GENERAR Y DESCARGAR EXCEL';

actualizarSeleccion();
cargarFormato();
