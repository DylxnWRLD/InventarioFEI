document.addEventListener('DOMContentLoaded', () => {
  cargarEquipos();
});

async function cargarEquipos() {
    const contenedor = document.getElementById('tablita-equipos');
    contenedor.innerHTML = '<p>Cargando equipos...</p>';

    try {
        const response = await fetch('http://localhost:8080/InventarioFEI/Equipos');

        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status}`);
        }

        const equipos = await response.json();
        contenedor.innerHTML = '';

        if (equipos.length === 0) {
            contenedor.innerHTML = '<p>No hay equipos registrados.</p>';
            return;
        }

        equipos.forEach(equipo => {
            const tarjeta = document.createElement('article');
            tarjeta.classList.add('equipo-card');

            tarjeta.innerHTML = `
                <div class="equipo-imagen-container">
                    <img
                        class="img-equipo"
                        src="${equipo.urlImagen || '../images/noEncontrado.png'}"
                        alt="Imagen de ${equipo.descripcion || 'equipo'}"
                        onerror="this.onerror=null; this.src='../images/noEncontrado.png';"
                    >
                </div>

                <div class="equipo-info">
                    <h3>${equipo.descripcion || 'Sin descripción'}</h3>
                    <p>Número de inventario: ${equipo.numeroInventario || 'N/A'}</p>
                    <p>Código Serial: ${equipo.noSerial || 'S/N'}</p>
                    <p>Ubicación: ${equipo.ubicacion || 'Sin ubicación'}</p>

                    <div class="equipo-botones">
                        <button class="btn-baja"
                            onclick="solicitarBaja('${equipo.numeroInventario || ''}')">
                            Dar Baja
                        </button>

                        <button class="btn-editar"
                            onclick="editarEquipo('${equipo.numeroInventario || ''}')">
                            Editar
                        </button>
                    </div>
                </div>
            `;

            contenedor.appendChild(tarjeta);
        });
    } catch (error) {
        console.error('Error al consultar la API REST:', error);
        contenedor.innerHTML = '<p class="mensaje-error">Error al conectar con la API.</p>';
    }
}

function solicitarBaja(numeroInventario) {
  console.log('Iniciar proceso de baja para:', numeroInventario);
}

function editarEquipo(numeroInventario) {
  console.log('Editar equipo:', numeroInventario);
}