// Página que se está mostrando actualmente
let paginaActual = 1;

// Cantidad máxima de equipos por página.
const equiposPorPagina = 30;

// Término de búsqueda activo (null = modo listado normal).
let terminoBusqueda = null;

// URL base de la API.
const API_BASE = 'http://localhost:8080/InventarioFEI';

// Cuando termine de cargar el HTML.
document.addEventListener('DOMContentLoaded', () => {
  cargarEquipos(paginaActual);

  // Botón "Anterior".
  document.getElementById('btn-anterior').addEventListener('click', () => {
    if (paginaActual > 1) {
      paginaActual--;
      if (terminoBusqueda) {
        buscarEquipos(paginaActual);
      } else {
        cargarEquipos(paginaActual);
      }
    }
  });

  // Botón "Siguiente".
  document.getElementById('btn-siguiente').addEventListener('click', () => {
    paginaActual++;
    if (terminoBusqueda) {
      buscarEquipos(paginaActual);
    } else {
      cargarEquipos(paginaActual);
    }
  });

  // Botón "Buscar".
  document.getElementById('btn-buscar').addEventListener('click', ejecutarBusqueda);

  // Enter en el input dispara la búsqueda.
  document.getElementById('input-busqueda').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ejecutarBusqueda();
    }
  });
});

/* ============================================================
 *  MODO LISTADO NORMAL
 * ============================================================ */

/**
 * Carga los equipos para una página específica (modo listado normal).
 *
 * @param {number} pagina - El número de página a cargar.
 * @returns {Promise<void>}
 */
async function cargarEquipos(pagina) {
  const contenedor = document.getElementById('tablita-equipos');
  contenedor.innerHTML = '<p>Cargando equipos...</p>';

  try {
    const response = await fetch(
      `${API_BASE}/Equipos?pagina=${pagina}`
    );

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }

    const data = await response.json();

    const equipos = data.equipos;
    const total = data.total;

    contenedor.innerHTML = '';

    if (equipos.length === 0) {
      if (paginaActual > 1) {
        paginaActual--;
        cargarEquipos(paginaActual);
      } else {
        contenedor.innerHTML =
          '<p>No hay equipos registrados.</p>';
      }

      actualizarPaginacion(total, 'listado');
      return;
    }

    renderizarEquipos(equipos, contenedor);
    actualizarPaginacion(total, 'listado');

  } catch (error) {
    console.error('Error al consultar la API REST:', error);

    contenedor.innerHTML =
      '<p class="mensaje-error">Error al conectar con la API.</p>';
  }
}

/* ============================================================
 *  MODO BÚSQUEDA
 * ============================================================ */

/**
 * Ejecuta la búsqueda con el término actual del input.
 */
function ejecutarBusqueda() {
  const input = document.getElementById('input-busqueda');
  const termino = input.value.trim();

  if (termino === '') {
    limpiarBusqueda();
    return;
  }

  terminoBusqueda = termino;
  paginaActual = 1;
  buscarEquipos(paginaActual);
}

/**
 * Busca equipos que coincidan con el término activo.
 *
 * @param {number} pagina - El número de página a cargar.
 * @returns {Promise<void>}
 */
async function buscarEquipos(pagina) {
  const contenedor = document.getElementById('tablita-equipos');
  contenedor.innerHTML = '<p>Buscando equipos...</p>';

  try {
    const response = await fetch(
      `${API_BASE}/Equipos/Buscar?q=${encodeURIComponent(terminoBusqueda)}&pagina=${pagina}`
    );

    if (!response.ok) {
      const mensajeError = await response.text();
      throw new Error(`Error ${response.status}: ${mensajeError}`);
    }

    const equipos = await response.json();
    contenedor.innerHTML = '';

    if (equipos.length === 0) {
      if (paginaActual > 1) {
        paginaActual--;
        buscarEquipos(paginaActual);
      } else {
        contenedor.innerHTML =
          `<p>No se encontraron resultados para "<strong>${escapeHtml(terminoBusqueda)}</strong>".</p>`;
      }
      actualizarPaginacion(equipos.length, 'busqueda');
      return;
    }

    renderizarEquipos(equipos, contenedor);
    actualizarPaginacion(equipos.length, 'busqueda');

  } catch (error) {
    console.error('Error al consultar la API REST:', error);
    contenedor.innerHTML =
      '<p class="mensaje-error">Error al conectar con la API.</p>';
  }
}

/**
 * Limpia la búsqueda y vuelve al listado normal.
 */
function limpiarBusqueda() {
  terminoBusqueda = null;
  paginaActual = 1;
  document.getElementById('input-busqueda').value = '';
  cargarEquipos(paginaActual);
}

/* ============================================================
 *  HELPERS COMPARTIDOS
 * ============================================================ */

/**
 * Renderiza una lista de equipos dentro del contenedor dado.
 *
 * @param {Array} equipos lista de equipos.
 * @param {HTMLElement} contenedor elemento donde se insertan.
 */
function renderizarEquipos(equipos, contenedor) {
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
}

/**
 * Actualiza el texto de paginación y el estado de los botones.
 *
 * @param {number} total cantidad total de resultados.
 * @param {string} modo 'listado' o 'busqueda'.
 */
function actualizarPaginacion(total, modo) {
  const etiqueta = document.getElementById('numero-pagina');

  const totalPaginas = Math.ceil(
    total / equiposPorPagina
  );

  etiqueta.textContent = modo === 'busqueda'
    ? `Página ${paginaActual} de ${totalPaginas} — Resultados para "${terminoBusqueda}"`
    : `Página ${paginaActual} de ${totalPaginas}`;

  document.getElementById('btn-anterior').disabled =
    paginaActual === 1;

  document.getElementById('btn-siguiente').disabled =
    paginaActual >= totalPaginas;
}

/**
 * Escapa caracteres HTML para prevenir XSS.
 *
 * @param {string} str texto a escapar.
 * @returns {string} texto escapado.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================================
 *  ACCIONES DE TARJETA
 * ============================================================ */

function solicitarBaja(numeroInventario) {
  console.log('Iniciar proceso de baja para:', numeroInventario);
}

function editarEquipo(numeroInventario) {
  console.log('Editar equipo:', numeroInventario);
}