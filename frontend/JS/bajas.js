
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

const equiposSeleccionadosContenedor =
    document.getElementById('equipos-seleccionados');

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
let archivoExcelOriginal = null;

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
// CREAR CAMPOS DE INFORMACIÓN
// ==========================================

function crearCampo(etiqueta, valor) {
    const parrafo = document.createElement('p');

    const negrita = document.createElement('strong');
    negrita.textContent = `${etiqueta}: `;

    const contenido = document.createElement('span');
    contenido.textContent = valor ?? 'No disponible';

    parrafo.append(negrita, contenido);

    return parrafo;
}

// ==========================================
// CREAR IMAGEN DEL EQUIPO
// ==========================================

function crearImagenEquipo(equipo) {
    const imagen = document.createElement('img');

    imagen.className = 'imagen-equipo';
    imagen.alt = `Imagen del equipo ${equipo.numeroInventario}`;
    imagen.loading = 'lazy';

    imagen.src = equipo.urlImagen || IMAGEN_PREDETERMINADA;

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

// ==========================================
// CREAR INFORMACIÓN DEL EQUIPO
// ==========================================

function crearInformacionEquipo(equipo) {
    const informacion = document.createElement('div');
    informacion.className = 'informacion-equipo';

    const descripcion = document.createElement('p');
    descripcion.className = 'descripcion-equipo';
    descripcion.textContent =
        equipo.descripcion || 'Sin descripción';

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

    const ubicacion = crearCampo(
        'Ubicacion',
        equipo.ubicacion || 'No disponible'
    );

    informacion.append(
        descripcion,
        inventario,
        marca,
        estado,
        ubicacion
    );

    return informacion;
}

// ==========================================
// CREAR CONTENIDO DE TARJETA
// ==========================================

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

// ==========================================
// ALTERNAR FILTRO DE ACTIVOS
// ==========================================

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

        if (agregado) {
            boton.textContent = 'AGREGADO';
        } else if (enProcesoDeBaja) {
            boton.textContent = 'EN PROCESO DE BAJA';
        } else {
            boton.textContent = 'AGREGAR';
        }

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
// CARGAR PLANTILLA EXCEL ORIGINAL
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

        // Guardar el archivo original para la descarga
        archivoExcelOriginal = archivo;

        // Cargar una representación para la vista previa
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
        archivoExcelOriginal = null;

        visorExcel.textContent =
            'No se pudo mostrar el formato de baja.';

        actualizarEstadoBotonGenerar();
    }
}

// ==========================================
// CREAR HOJA PARA LA VISTA PREVIA
// ==========================================

function crearHojaActualizada() {
    if (!libroExcel) {
        return null;
    }

    const hojaOriginal = libroExcel.Sheets[NOMBRE_HOJA];

    if (!hojaOriginal) {
        return null;
    }

    // Copia superficial de la hoja original
    const hoja = { ...hojaOriginal };

    const columnas = {
        B: 'numeroActivo',
        E: 'numeroInventario',
        H: 'descripcion',
        N: 'noSerial',
        Q: 'marca',
        T: 'modelo',
        W: 'fechaRegistro'

    };

    // Modificar valor sin alterar la hoja original
    function escribirCelda(direccion, valor) {
        const celdaOriginal = hojaOriginal[direccion] || {};

        hoja[direccion] = {
            ...celdaOriginal,
            t: 's',
            v: String(valor ?? '')
        };

        delete hoja[direccion].f;
        delete hoja[direccion].w;
    }

    // Limpiar los espacios de los 10 equipos
    for (let indice = 0; indice < MAX_EQUIPOS; indice++) {
        const fila = FILA_INICIAL + indice;

        Object.keys(columnas).forEach(columna => {
            escribirCelda(`${columna}${fila}`, '');
        });
    }

    // Agregar los datos de los equipos seleccionados
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

    // Dictamen seleccionado
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

    const hayFormato =
        libroExcel !== null &&
        archivoExcelOriginal !== null;

    btnGenerar.disabled = !(
        hayEquipos &&
        hayDictamen &&
        hayFormato
    );
}

// ==========================================
// MODIFICAR CELDAS XML DEL EXCEL ORIGINAL
// ==========================================

function escaparXML(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Modificar únicamente una celda del XML original
// ==========================================
// MODIFICAR CELDAS XML DEL EXCEL ORIGINAL
// ==========================================

function escribirCeldaXML(documento, direccion, valor) {

    const namespace =
        'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

    // Obtener todas las celdas de la hoja
    const celdas = documento.getElementsByTagNameNS(
        namespace,
        'c'
    );

    // Buscar la celda por su dirección: B12, E12, etc.
    const celda = Array.from(celdas).find(
        elemento => elemento.getAttribute('r') === direccion
    );

    // Verificar que la celda exista
    if (!celda) {
        throw new Error(
            `No se encontró la celda ${direccion} en la plantilla.`
        );
    }

    // Eliminar únicamente el contenido anterior
    // f = fórmula
    // v = valor
    // is = texto interno
    Array.from(celda.children).forEach(elemento => {

        if (['f', 'v', 'is'].includes(elemento.localName)) {
            celda.removeChild(elemento);
        }

    });

    // Indicar que el contenido será texto
    celda.setAttribute('t', 'inlineStr');

    // Crear el contenedor para el texto
    const contenedor = documento.createElementNS(
        namespace,
        'is'
    );

    // Crear el elemento de texto
    const texto = documento.createElementNS(
        namespace,
        't'
    );

    // Conservar los espacios
    texto.setAttributeNS(
        'http://www.w3.org/XML/1998/namespace',
        'xml:space',
        'preserve'
    );

    // Asignar el nuevo valor
    texto.textContent = String(valor ?? '');

    // Agregar el texto a su contenedor
    contenedor.appendChild(texto);

    // Agregar el contenedor a la celda
    celda.appendChild(contenedor);
}

// ==========================================
// GENERAR Y DESCARGAR EXCEL CON FORMATO
// ==========================================

// ==========================================
// GENERAR Y DESCARGAR EXCEL CON FORMATO
// ==========================================

function obtenerFechaExcel() {
    const hoy = new Date();

    const inicioExcel = Date.UTC(1899, 11, 30);

    const fechaActual = Date.UTC(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate()
    );

    return (fechaActual - inicioExcel) / 86400000;
}

async function generarExcel() {

    // ==========================================
    // VALIDACIONES
    // ==========================================

    if (!archivoExcelOriginal) {
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

    if (typeof JSZip === 'undefined') {
        alert('No se encontró la biblioteca JSZip.');
        return;
    }

    try {

        btnGenerar.disabled = true;

        // ==========================================
        // 1. ABRIR PLANTILLA ORIGINAL
        // ==========================================

        const zip = await JSZip.loadAsync(
            archivoExcelOriginal
        );

        // Hoja Mobiliario -Herramientas
        const rutaHoja = 'xl/worksheets/sheet2.xml';

        const archivoHoja = zip.file(rutaHoja);

        if (!archivoHoja) {
            throw new Error(
                'No se encontró la hoja de mobiliario.'
            );
        }

        // Leer contenido XML
        const xmlHoja = await archivoHoja.async('string');

        // ==========================================
        // 2. CONVERTIR XML EN DOCUMENTO
        // ==========================================

        const parser = new DOMParser();

        const documento = parser.parseFromString(
            xmlHoja,
            'application/xml'
        );

        // Verificar errores en XML
        if (
            documento.getElementsByTagName('parsererror').length > 0
        ) {
            throw new Error(
                'No se pudo interpretar el XML del Excel.'
            );
        }

        // ==========================================
        // 3. DEFINIR COLUMNAS
        // ==========================================

        const columnas = {
            B: 'numeroActivo',
            E: 'numeroInventario',
            H: 'descripcion',
            N: 'noSerial',
            Q: 'marca',
            T: 'modelo',
            W: 'fechaRegistro'

        };

        // ==========================================
        // 4. LIMPIAR FILAS DE EQUIPOS
        // ==========================================

        for (
            let indice = 0;
            indice < MAX_EQUIPOS;
            indice++
        ) {

            const fila = FILA_INICIAL + indice;

            Object.keys(columnas).forEach(columna => {

                escribirCeldaXML(
                    documento,
                    `${columna}${fila}`,
                    ''
                );


            });
        }

        function escribirFechaExcel(documento, direccion, valor) {

            const namespace =
                'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

            const celdas = documento.getElementsByTagNameNS(
                namespace,
                'c'
            );

            const celda = Array.from(celdas).find(
                elemento => elemento.getAttribute('r') === direccion
            );

            if (!celda) {
                throw new Error(`No se encontró la celda ${direccion}.`);
            }

            // Eliminar fórmula y valor anteriores
            Array.from(celda.children).forEach(elemento => {
                if (['f', 'v', 'is'].includes(elemento.localName)) {
                    celda.removeChild(elemento);
                }
            });

            // Guardar fecha como número de Excel
            celda.setAttribute('t', 'n');

            const valorXML = documento.createElementNS(namespace, 'v');
            valorXML.textContent = String(valor);

            celda.appendChild(valorXML);
        }

        // ==========================================
        // 5. INSERTAR EQUIPOS SELECCIONADOS
        // ==========================================

        equiposSeleccionados
            .slice(0, MAX_EQUIPOS)
            .forEach((equipo, indice) => {

                const fila = FILA_INICIAL + indice;

                Object.entries(columnas).forEach(
                    ([columna, propiedad]) => {

                        const direccion = `${columna}${fila}`;

                        const valor = equipo[propiedad] ?? '';

                        escribirCeldaXML(
                            documento,
                            direccion,
                            valor
                        );

                    }
                );

            });

        // ==========================================
        // 6. INSERTAR DICTAMEN
        // ==========================================

        escribirCeldaXML(
            documento,
            'U10',
            dictamenSeleccionado.articulo
        );
        // Fecha de elaboración del formato de baja
        escribirFechaExcel(
            documento,
            'AG4',
            obtenerFechaExcel()
        );

        // ==========================================
        // 7. GUARDAR HOJA MODIFICADA
        // ==========================================

        const serializador = new XMLSerializer();

        const xmlActualizado =
            serializador.serializeToString(documento);

        zip.file(
            rutaHoja,
            xmlActualizado
        );

        // ==========================================
        // 8. ELIMINAR CADENA DE CÁLCULO ANTERIOR
        // ==========================================

        // Algunas fórmulas fueron reemplazadas por valores.
        // Por eso eliminamos la cadena de cálculo anterior.
        zip.remove('xl/calcChain.xml');

        // ==========================================
        // 9. ACTUALIZAR RELACIONES DEL LIBRO
        // ==========================================

        const rutaRelaciones =
            'xl/_rels/workbook.xml.rels';

        const archivoRelaciones =
            zip.file(rutaRelaciones);

        if (!archivoRelaciones) {
            throw new Error(
                'No se encontraron las relaciones del libro.'
            );
        }

        let xmlRelaciones =
            await archivoRelaciones.async('string');

        // Eliminar referencia a calcChain.xml
        xmlRelaciones = xmlRelaciones.replace(
            /<Relationship\b(?=[^>]*\bType="[^"]*\/calcChain")[^>]*\/>/g,
            ''
        );

        zip.file(
            rutaRelaciones,
            xmlRelaciones
        );

        // ==========================================
        // 10. ACTUALIZAR TIPOS DE CONTENIDO
        // ==========================================

        const rutaTipos = '[Content_Types].xml';

        const archivoTipos = zip.file(rutaTipos);

        if (!archivoTipos) {
            throw new Error(
                'No se encontraron los tipos de contenido.'
            );
        }

        let xmlTipos =
            await archivoTipos.async('string');

        // Eliminar declaración de calcChain.xml
        xmlTipos = xmlTipos.replace(
            /<Override\b(?=[^>]*\bPartName="\/xl\/calcChain\.xml")[^>]*\/>/g,
            ''
        );

        zip.file(
            rutaTipos,
            xmlTipos
        );

        // ==========================================
        // 11. CONFIGURAR RECÁLCULO DE FÓRMULAS
        // ==========================================

        const rutaLibro = 'xl/workbook.xml';

        const archivoLibro = zip.file(rutaLibro);

        if (!archivoLibro) {
            throw new Error(
                'No se encontró la configuración del libro.'
            );
        }

        let xmlLibro =
            await archivoLibro.async('string');

        // Actualizar la configuración existente
        if (/<calcPr\b/.test(xmlLibro)) {

            xmlLibro = xmlLibro.replace(
                /<calcPr\b[^>]*\/>/,
                '<calcPr calcMode="auto" fullCalcOnLoad="1"/>'
            );

        } else {

            // Agregar configuración si no existe
            xmlLibro = xmlLibro.replace(
                /<\/workbook>/,
                '<calcPr calcMode="auto" fullCalcOnLoad="1"/></workbook>'
            );

        }

        zip.file(
            rutaLibro,
            xmlLibro
        );

        // ==========================================
        // 12. GENERAR ARCHIVO EXCEL
        // ==========================================

        const archivoFinal = await zip.generateAsync({

            type: 'blob',

            mimeType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

            compression: 'DEFLATE',

            compressionOptions: {
                level: 6
            }

        });

        // ==========================================
        // 13. DESCARGAR ARCHIVO
        // ==========================================

        const url = URL.createObjectURL(
            archivoFinal
        );

        const enlace = document.createElement('a');

        enlace.href = url;

        enlace.download =
            'formato_baja.xlsx';

        document.body.appendChild(enlace);

        enlace.click();

        enlace.remove();

        // Liberar memoria
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

        console.log(
            'Archivo Excel generado correctamente.'
        );

    } catch (error) {

        console.error(
            'Error al generar el Excel:',
            error
        );

        alert(
            'No se pudo generar el formato Excel.\n\n' +
            'Motivo: ' + error.message
        );

    } finally {

        actualizarEstadoBotonGenerar();

    }
}

// ==========================================
// EVENTOS
// ==========================================

// Buscar equipos mediante botón
btnBuscar.addEventListener('click', buscarEquipos);

// Buscar al presionar Enter
inputBusqueda.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        evento.preventDefault();
        buscarEquipos();
    }
});

// Filtro de activos
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
            articulo =>
                String(articulo.idArticulo) === idArticulo
        ) || null
        : null;

    actualizarFormatoExcel();
    actualizarEstadoBotonGenerar();
});

// Descargar Excel
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

// Ejecutar al cargar el documento
if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        inicializarModulo
    );
} else {
    inicializarModulo();
}
