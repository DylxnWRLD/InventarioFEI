
const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';
const RUTA_FORMATO = '../formatos/abs-cb-f-25.xlsx';

const parametros = new URLSearchParams(window.location.search);
const numeroInventario = parametros.get('numeroInventario');

// Obtener información del equipo seleccionado
async function cargarEquipo() {
    if (!numeroInventario) {
        alert('No se seleccionó ningún equipo.');
        return;
    }

    try {
        const respuesta = await fetch(
            `${API_BASE}/Equipos/${encodeURIComponent(numeroInventario)}`
        );

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener el equipo.');
        }

        const equipo = await respuesta.json();

        document.getElementById('numero-inventario').value = equipo.numeroInventario ?? '';
        document.getElementById('numero-activo').value = equipo.numeroActivo ?? '';
        document.getElementById('marca-equipo').value = equipo.marca ?? '';
        document.getElementById('modelo-equipo').value = equipo.modelo ?? '';
        document.getElementById('numero-serie').value = equipo.noSerial ?? '';
        document.getElementById('descripcion-equipo').value = equipo.descripcion ?? '';
        document.getElementById('tipo-equipo').value = equipo.tipoEquipo ?? '';
        document.getElementById('estado-operativo').value = equipo.estadoOperativo ?? '';

        // Seleccionar la ubicación correspondiente
        const ubicacion = document.getElementById('ubicacion-equipo');

        ubicacion.value = equipo.ubicacion ?? '';

        // Si la ubicación no existe entre las opciones, mostrarla
        if (equipo.ubicacion && ubicacion.value !== equipo.ubicacion) {
            const opcion = document.createElement('option');
            opcion.value = equipo.ubicacion;
            opcion.textContent = equipo.ubicacion;
            ubicacion.appendChild(opcion);
            ubicacion.value = equipo.ubicacion;
        }

        console.log('Equipo cargado:', equipo);

    } catch (error) {
        console.error('Error al cargar el equipo:', error);
        alert('No se pudieron cargar los datos del equipo.');
    }
}

// Mostrar automáticamente el formato de baja
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

        // Leer el archivo Excel
        const libro = XLSX.read(archivo, {
            type: 'array'
        });

        // Seleccionar la hoja del dictamen
        const hoja = libro.Sheets['Mobiliario -Herramientas'];

        if (!hoja) {
            throw new Error('No se encontró la hoja del dictamen.');
        }

        // Convertir la hoja en una tabla HTML
        visor.innerHTML = XLSX.utils.sheet_to_html(hoja);

        console.log('Formato de baja cargado correctamente.');

    } catch (error) {
        console.error('Error al cargar el Excel:', error);
        visor.textContent = 'No se pudo mostrar el formato de baja.';
    }
}

// Ejecutar ambas funciones al abrir la pantalla
document.addEventListener('DOMContentLoaded', () => {
    cargarEquipo();
    mostrarFormatoBaja();
});
