
const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';

const parametros = new URLSearchParams(window.location.search);
const numeroInventario = parametros.get('numeroInventario');

// Obtener información del equipo
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
        document.getElementById('ubicacion-equipo').value = equipo.ubicacion ?? '';
        document.getElementById('estado-operativo').value = equipo.estadoOperativo ?? '';

        console.log('Equipo cargado:', equipo);

    } catch (error) {
        console.error('Error al cargar el equipo:', error);
        alert('No se pudieron cargar los datos del equipo.');
    }
}

// Seleccionar plantilla Excel
const btnSubirExcel = document.getElementById('btn-trigger-upload');
const inputExcel = document.getElementById('input-excel');
const nombreArchivo = document.getElementById('nombre-archivo');

btnSubirExcel.addEventListener('click', () => {
    inputExcel.click();
});

inputExcel.addEventListener('change', () => {
    const archivo = inputExcel.files[0];

    if (!archivo) {
        nombreArchivo.textContent = 'Ningún archivo seleccionado';
        return;
    }

    const extension = archivo.name.split('.').pop().toLowerCase();

    if (!['xlsx', 'xlsm'].includes(extension)) {
        alert('Selecciona un archivo Excel válido.');
        inputExcel.value = '';
        nombreArchivo.textContent = 'Ningún archivo seleccionado';
        return;
    }

    nombreArchivo.textContent = archivo.name;
});

document.addEventListener('DOMContentLoaded', cargarEquipo);
