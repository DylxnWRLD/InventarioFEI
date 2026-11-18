const SUPABASE_URL = 'https://idsdkpdonldeaqrfcttq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkc2RrcGRvbmxkZWFxcmZjdHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDMzMjIsImV4cCI6MjEwNTU3OTMyMn0.-II-i_C9dpKSqleN1E15eAiOQw_HVQA32gly2SPlN5M';
const BUCKET_NAME = 'equipos_inventario';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Página que se está mostrando actualmente
let paginaActual = 1;

// Cantidad máxima de equipos por página.
const equiposPorPagina = 30;

// Timer para retrasar la búsqueda mientras el usuario escribe.
let temporizadorBusqueda;

// Término de búsqueda activo (null = modo listado normal).
let terminoBusqueda = null;

// URL base de la API.
const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';
//const API_BASE = 'http://localhost:8080/InventarioFEI';

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

  // Enter en el input dispara la búsqueda.
  document.getElementById('input-busqueda').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ejecutarBusqueda();
    }
  });

  // Cada que busca
  document.getElementById('input-busqueda').addEventListener('input', () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
      ejecutarBusqueda();
    }, 500); // Retraso de 500 ms
  });

  // Boton de Registro de Equipo
  document.getElementById('btn-registrar-equipo').addEventListener('click', () => {
    window.location.href = './HTML/altas.html';
  });

  // Boton de Bajas de Equipo
  document.getElementById('btn-bajas-equipo').addEventListener('click', () => {
    window.location.href = './HTML/bajas.html';
  });

  // Boton de Transferencias
  document.getElementById('btn-transferencias').addEventListener('click', () => {
    window.location.href = './HTML/transferencias.html';
  });


  // EVENTOS DEL MODAL DE EDICIÓN
  const modalEdicion = document.getElementById('modal-editar-equipo');

  // Cerrar mediante el botón X.
  document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
    modalEdicion.close();
  });

  // Cerrar mediante el botón Cancelar.
  document.getElementById('btn-cancelar-edicion').addEventListener('click', () => {
    modalEdicion.close();
  });


  // Vista previa de la nueva imagen seleccionada.
  document.getElementById('editar-imagen').addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const formatosPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    const mensaje = document.getElementById('mensaje-edicion');

    if (!formatosPermitidos.includes(archivo.type)) {
      mensaje.textContent =
        'Solo se permiten imágenes JPG, JPEG, PNG y WebP.';
      e.target.value = '';
      return;
    }

    // Tamaño máximo de 5 MB.
    if (archivo.size > 5 * 1024 * 1024) {
      mensaje.textContent =
        'La imagen no puede superar los 5 MB.';
      e.target.value = '';
      return;
    }

    mensaje.textContent = '';

    const imagen = document.getElementById('editar-imagen-preview');
    imagen.src = URL.createObjectURL(archivo);

    imagen.onload = () => {
      URL.revokeObjectURL(imagen.src);
    };
  });


  /* ============================================================
   * GUARDAR CAMBIOS DEL EQUIPO
   * ============================================================ */

  document.getElementById('form-editar-equipo')
    .addEventListener('submit', async (e) => {
      e.preventDefault();

      const modal = document.getElementById('modal-editar-equipo');
      const mensaje = document.getElementById('mensaje-edicion');
      const botonGuardar = document.getElementById('btn-guardar-edicion');

      if (botonGuardar.disabled) return;

      const numeroInventario =
        document.getElementById('editar-numero-inventario').value;

      const archivoImagen =
        document.getElementById('editar-imagen').files[0];

      // Recopilar los campos editables.
      const equipoActualizado = {
        tipoEquipo: document.getElementById('editar-tipo-equipo').value,
        marca: document.getElementById('editar-marca').value.trim(),
        modelo: document.getElementById('editar-modelo').value.trim(),
        noSerial: document.getElementById('editar-serial').value.trim(),
        descripcion: document.getElementById('editar-descripcion').value.trim(),
        ubicacion: document.getElementById('editar-ubicacion').value,
        urlImagen: null
      };

      botonGuardar.disabled = true;
      botonGuardar.textContent = 'GUARDANDO...';
      mensaje.textContent = '';

      let imagenSubida = null;
      let respuestaConfirmada = false;

      try {
        // 1. Subir imagen únicamente si seleccionó una nueva.
        if (archivoImagen) {
          imagenSubida = await subirImagenEdicion(archivoImagen);
          equipoActualizado.urlImagen = imagenSubida.url;
        }

        // 2. Actualizar el equipo en PostgreSQL.
        const response = await fetch(
          `${API_BASE}/Equipos/${encodeURIComponent(numeroInventario)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(equipoActualizado)
          }
        );

        // 3. Si el servidor rechaza la actualización, eliminar la imagen recién subida.
        if (!response.ok) {
          respuestaConfirmada = true;
          const errorTexto = await response.text();
          throw new Error(errorTexto || `Error HTTP ${response.status}`);
        }

        // 4. Confirmar que el equipo se actualizó.
        modal.close();
        alert('Equipo actualizado correctamente.');

        // 5. Actualizar el listado.
        if (terminoBusqueda) {
          await buscarEquipos(paginaActual);
        } else {
          await cargarEquipos(paginaActual);
        }

      } catch (error) {
        console.error('Error durante la actualización:', error);

        // Eliminar una imagen nueva solo cuando sabemos que el servidor rechazó la actualización.
        if (imagenSubida && respuestaConfirmada) {
          const { error: errorEliminar } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .remove([imagenSubida.path]);

          if (errorEliminar) {
            console.error(
              'No se pudo eliminar la imagen nueva:',
              errorEliminar
            );
          }
        }

        if (modal.open) {
          mensaje.textContent = error.message;
        }

      } finally {
        botonGuardar.disabled = false;
        botonGuardar.textContent = 'GUARDAR CAMBIOS';
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

    const data = await response.json();

    // La API devuelve:
    // {
    //   equipos: [...],
    //   total: 123
    // }
    const equipos = data.equipos;
    const total = data.total;

    contenedor.innerHTML = '';

    if (!Array.isArray(equipos)) {
      throw new Error('La API no devolvió una lista de equipos.');
    }

    if (equipos.length === 0) {
      if (paginaActual > 1) {
        paginaActual--;
        buscarEquipos(paginaActual);
        return;
      }

      contenedor.innerHTML =
        `<p>No se encontraron resultados para "<strong>${escapeHtml(terminoBusqueda)}</strong>".</p>`;

      actualizarPaginacion(0, 'busqueda');
      return;
    }

    renderizarEquipos(equipos, contenedor);
    actualizarPaginacion(total, 'busqueda');

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
          <button type="button" class="btn-editar">
            Editar
        </button>
        </div>
      </div>
    `;

    tarjeta.querySelector('.btn-editar').addEventListener('click', () => {
      editarEquipo(equipo.numeroInventario);
    });

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
  window.location.href = `HTML/bajas.html?numeroInventario=${encodeURIComponent(numeroInventario)}`;
}


/* ============================================================
 * EDICIÓN DE EQUIPOS
 * ============================================================ */

/**
 * Consulta la información de un equipo y abre el modal de edición.
 *
 * @param {string} numeroInventario - Identificador del equipo.
 * @returns {Promise<void>}
 */
async function editarEquipo(numeroInventario) {
  const modal = document.getElementById('modal-editar-equipo');
  const formulario = document.getElementById('form-editar-equipo');
  const mensaje = document.getElementById('mensaje-edicion');

  if (!numeroInventario) return;

  try {
    formulario.reset();
    mensaje.textContent = '';

    // Consultar el equipo seleccionado.
    const response = await fetch(
      `${API_BASE}/Equipos/${encodeURIComponent(numeroInventario)}`
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const equipo = await response.json();

    // Número de inventario (no editable).
    document.getElementById('editar-numero-inventario').value =
      equipo.numeroInventario ?? '';

    // Información general.
    document.getElementById('editar-numero-activo').value =
      equipo.numeroActivo ?? '';

    document.getElementById('editar-tipo-equipo').value =
      equipo.tipoEquipo ?? '';

    document.getElementById('editar-marca').value =
      equipo.marca ?? '';

    document.getElementById('editar-modelo').value =
      equipo.modelo ?? '';

    document.getElementById('editar-serial').value =
      equipo.noSerial ?? '';

    document.getElementById('editar-descripcion').value =
      equipo.descripcion ?? '';

    document.getElementById('editar-ubicacion').value =
      equipo.ubicacion ?? '';

    // Estado operativo (no editable).
    document.getElementById('editar-estado').value =
      equipo.estadoOperativo ?? '';

    // Fecha de registro (no editable).
    document.getElementById('editar-fecha-registro').value =
      equipo.fechaRegistro
        ? String(equipo.fechaRegistro).substring(0, 10)
        : '';

    // Imagen actual.
    const imagen = document.getElementById('editar-imagen-preview');

    imagen.onerror = () => {
      imagen.onerror = null;
      imagen.src = './images/noEncontrado.png';
    };

    imagen.src = equipo.urlImagen || './images/noEncontrado.png';

    // Mostrar el modal.
    modal.showModal();

  } catch (error) {
    console.error('Error al consultar el equipo:', error);
    alert('No fue posible cargar la información del equipo.');
  }
}


/**
 * Sube una nueva imagen a Supabase Storage.
 *
 * @param {File} archivo archivo seleccionado.
 * @returns {Promise<{url: string, path: string}>}
 */
async function subirImagenEdicion(archivo) {
  const extensiones = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };

  const extension = extensiones[archivo.type];

  if (!extension || archivo.size > 5 * 1024 * 1024) {
    throw new Error(
      'La imagen debe ser JPG, PNG o WebP y no superar 5 MB.'
    );
  }

  const nombreArchivo = `${crypto.randomUUID()}.${extension}`;
  const rutaArchivo = `equipos/${nombreArchivo}`;

  const { error } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .upload(rutaArchivo, archivo, {
      cacheControl: '3600',
      upsert: false,
      contentType: archivo.type
    });

  if (error) {
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }

  const { data } = supabaseClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(rutaArchivo);

  return {
    url: data.publicUrl,
    path: rutaArchivo
  };
}

