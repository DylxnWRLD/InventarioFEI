
// Página que se está mostrando actualmente
let paginaActual = 1;

// Cantidad máxima de equipos por página.
const equiposPorPagina = 30;

// Cuando termine de cargar el HTML.
document.addEventListener('DOMContentLoaded', () => {
  cargarEquipos(paginaActual);

  // Botón "Anterior".
  document.getElementById('btn-anterior').addEventListener('click', () => {

    if (paginaActual > 1) {
      paginaActual--;
      cargarEquipos(paginaActual);
    }
  });

  // Botón "Siguiente".
  document.getElementById('btn-siguiente').addEventListener('click', () => {
    paginaActual++;
    cargarEquipos(paginaActual);
  });
});

async function cargarEquipos(pagina) {
  const contenedor = document.getElementById('tablita-equipos');
  contenedor.innerHTML = '<p>Cargando equipos...</p>';
  try {
    const response = await fetch(
      `http://localhost:8080/InventarioFEI/Equipos?pagina=${pagina}`
    );
    if (!response.ok) {
      throw new Error(
        `Error en la petición: ${response.status}`
      );
    }
    const equipos = await response.json();
    contenedor.innerHTML = '';

    if (equipos.length === 0) {
      if (paginaActual > 1) {
        paginaActual--;
        cargarEquipos(paginaActual);
      } else {
        contenedor.innerHTML =
          '<p>No hay equipos registrados.</p>';
      }
      return;
    }

    // Creamos una tarjeta para cada equipo.
    equipos.forEach(equipo => {
      const tarjeta = document.createElement('article');
      tarjeta.classList.add('equipo-card');
      tarjeta.innerHTML = `
        <div class="equipo-imagen-container">
          <img
            class="img-equipo"
            src="${equipo.urlImagen || '../images/noEncontrado.png'}"
            alt="Imagen de ${equipo.modelo || 'equipo'}"
            onerror="this.onerror=null; this.src='../images/noEncontrado.png';"
          >
        </div>

        <div class="equipo-info">
          <h3>
            ${equipo.marca || 'DESCONOCIDO'}
            ${equipo.modelo || 'DESCONOCIDO'}
          </h3>

          <p>
            <strong>Número de inventario:</strong>
            ${equipo.numeroInventario || 'N/A'}
          </p>

          <p>
            <strong>Código Serial:</strong>
            ${equipo.noSerial || 'S/N'}
          </p>

          <p>
            <strong>Ubicación:</strong>
            ${equipo.ubicacion || 'Sin ubicación'}
          </p>

          <div class="equipo-botones">
            <button
              class="btn-baja"
              onclick="solicitarBaja('${equipo.numeroInventario || ''}')"
            >
              Dar Baja
            </button>

            <button
              class="btn-editar"
              onclick="editarEquipo('${equipo.numeroInventario || ''}')"
            >
              Editar
            </button>
          </div>
        </div>
      `;
      contenedor.appendChild(tarjeta);
    });

    //Actualizar el número de página
    document.getElementById('numero-pagina').textContent =
      `Página ${paginaActual}`;

    //Sin botòn de anterior en la primera página
    document.getElementById('btn-anterior').disabled =
      paginaActual === 1;

    //Ùltima pàgina
    document.getElementById('btn-siguiente').disabled =
      equipos.length < equiposPorPagina;
  } catch (error) {
    console.error(
      'Error al consultar la API REST:',
      error
    );
    contenedor.innerHTML =
      '<p class="mensaje-error">Error al conectar con la API.</p>';
  }
}

function solicitarBaja(numeroInventario) {
  console.log(
    'Iniciar proceso de baja para:',
    numeroInventario
  );
}

function editarEquipo(numeroInventario) {
  console.log(
    'Editar equipo:',
    numeroInventario
  );
}