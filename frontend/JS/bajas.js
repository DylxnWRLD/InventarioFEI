
const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';
const RUTA_FORMATO = '../formatos/abs-cb-f-25.xlsx';

const inputBusqueda = document.getElementById('buscar-equipo');
const btnBuscar = document.getElementById('btn-buscar-equipo');
const resultadosBusqueda = document.getElementById('resultados-busqueda');
const equiposSeleccionadosContenedor = document.getElementById('equipos-seleccionados');
const contadorEquipos = document.getElementById('contador-equipos');
const btnLimpiar = document.getElementById('btn-limpiar-seleccion');
const btnGenerar = document.getElementById('btn-generar-excel');

const equiposSeleccionados = [];
let libroExcel = null;
let identificadorBusqueda = 0;

// Buscar equipos en PostgreSQL
async function buscarEquipos() {
    const textoBusqueda = inputBusqueda.value.trim();
    const busquedaActual = ++identificadorBusqueda;

    if (!textoBusqueda) {
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
            throw new Error('La respuesta del servidor no contiene una lista de equipos.');
        }

        mostrarResultados(equipos);

    } catch (error) {
        if (busquedaActual !== identificadorBusqueda) {
            return;
        }

        console.error('Error al buscar equipos:', error);
        resultadosBusqueda.textContent = 'Ocurrió un error durante la búsqueda.';
    }
}

// Mostrar resultados de búsqueda
function mostrarResultados(equipos) {
    resultadosBusqueda.replaceChildren();

    if (equipos.length === 0) {
        resultadosBusqueda.textContent = 'No se encontraron equipos.';
        return;
    }

    equipos.forEach(equipo => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-resultado';

        const descripcion = document.createElement('p');
        descripcion.textContent = equipo.descripcion || 'Sin descripción';

        const inventario = document.createElement('p');
        inventario.textContent = `Inventario: ${equipo.numeroInventario}`;

        const marca = document.createElement('p');
        marca.textContent = `Marca: ${equipo.marca || 'Sin marca'}`;

        const estado = document.createElement('p');
        estado.textContent = `Estado: ${equipo.estadoOperativo || 'No disponible'}`;

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn-agregar-equipo';

        const agregado = equiposSeleccionados.some(
            seleccionado => seleccionado.numeroInventario === equipo.numeroInventario
        );

        boton.textContent = agregado ? 'AGREGADO' : 'AGREGAR';
        boton.disabled = agregado || equipo.estadoOperativo === 'EN_PROCESO_DE_BAJA';

        boton.addEventListener('click', () => {
            agregarEquipo(equipo);
        });

        tarjeta.append(descripcion, inventario, marca, estado, boton);
        resultadosBusqueda.appendChild(tarjeta);
    });
}

// Agregar un equipo a la lista
function agregarEquipo(equipo) {
    const existe = equiposSeleccionados.some(
        seleccionado => seleccionado.numeroInventario === equipo.numeroInventario
    );

    if (existe) {
        alert('Este equipo ya está seleccionado.');
        return;
    }

    if (equipo.estadoOperativo === 'EN_PROCESO_DE_BAJA') {
        alert('El equipo ya se encuentra en proceso de baja.');
        return;
    }

    equiposSeleccionados.push(equipo);

    actualizarSeleccion();
}

// Eliminar un equipo seleccionado
function eliminarEquipo(numeroInventario) {
    const indice = equiposSeleccionados.findIndex(
        equipo => equipo.numeroInventario === numeroInventario
    );

    if (indice !== -1) {
        equiposSeleccionados.splice(indice, 1);
    }

    actualizarSeleccion();
}

// Actualizar lista de equipos seleccionados
function actualizarSeleccion() {
    equiposSeleccionadosContenedor.replaceChildren();

    contadorEquipos.textContent = equiposSeleccionados.length;

    btnLimpiar.disabled = equiposSeleccionados.length === 0;

    // Se activará cuando implementemos la generación del archivo
    btnGenerar.disabled = true;

    if (equiposSeleccionados.length === 0) {
        equiposSeleccionadosContenedor.textContent = 'No hay equipos seleccionados.';
    } else {
        equiposSeleccionados.forEach(equipo => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-seleccionada';

            const informacion = document.createElement('p');
            informacion.textContent =
                `${equipo.numeroInventario} - ${equipo.descripcion || 'Sin descripción'}`;

            const botonEliminar = document.createElement('button');
            botonEliminar.type = 'button';
            botonEliminar.textContent = 'QUITAR';
            botonEliminar.className = 'btn-quitar-equipo';

            botonEliminar.addEventListener('click', () => {
                eliminarEquipo(equipo.numeroInventario);
            });

            tarjeta.append(informacion, botonEliminar);
            equiposSeleccionadosContenedor.appendChild(tarjeta);
        });
    }

    // Actualizar botones de los resultados visibles
    const texto = inputBusqueda.value.trim();

    if (texto) {
        buscarEquipos();
    }
}

// Mostrar automáticamente la plantilla Excel
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

        visor.innerHTML = XLSX.utils.sheet_to_html(hoja);

        console.log('Formato de baja cargado correctamente.');

    } catch (error) {
        console.error('Error al cargar el Excel:', error);
        visor.textContent = 'No se pudo mostrar el formato de baja.';
    }
}

// Eventos
btnBuscar.addEventListener('click', buscarEquipos);

inputBusqueda.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        buscarEquipos();
    }
});

btnLimpiar.addEventListener('click', () => {
    equiposSeleccionados.length = 0;
    actualizarSeleccion();
});

// Inicializar módulo
document.addEventListener('DOMContentLoaded', () => {
    mostrarFormatoBaja();
    actualizarSeleccion();
});
