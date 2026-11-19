const SUPABASE_URL = 'https://idsdkpdonldeaqrfcttq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkc2RrcGRvbmxkZWFxcmZjdHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDMzMjIsImV4cCI6MjEwNTU3OTMyMn0.-II-i_C9dpKSqleN1E15eAiOQw_HVQA32gly2SPlN5M';
const BUCKET_NAME = 'equipos_inventario';

const IMAGEN_PREDETERMINADA = 'https://idsdkpdonldeaqrfcttq.supabase.co/storage/v1/object/public/equipos_inventario/equipos/defecto2.png';

const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const btnSubir = document.getElementById('btn-trigger-upload');
const inputImagen = document.getElementById('input-imagen');
const imgPreview = document.getElementById('preview-imagen');
imgPreview.src = IMAGEN_PREDETERMINADA;
imgPreview.style.display = 'block';

const btnGuardar = document.getElementById('btn-guardar-equipo');


let archivoSeleccionado = null;
let urlPreview = null;

// Abrir explorador de archivos.
btnSubir.addEventListener('click', () => {
  inputImagen.click();
});

// Selección y vista previa de imagen.
inputImagen.addEventListener('change', (event) => {
  const archivo = event.target.files[0];
  if (!archivo) return;

  const formatosPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  // Validar formato y tamaño.
  if (!formatosPermitidos.includes(archivo.type) ||
      archivo.size > 5 * 1024 * 1024) {

    alert('Solo se permiten imágenes JPG, PNG y WebP de máximo 5 MB.');

    archivoSeleccionado = null;
    inputImagen.value = '';

    // Liberar vista previa anterior.
    if (urlPreview) {
      URL.revokeObjectURL(urlPreview);
      urlPreview = null;
    }

    // Restaurar imagen predeterminada.
    imgPreview.src = IMAGEN_PREDETERMINADA;
    btnSubir.textContent = 'CAMBIAR IMAGEN';
    return;
  }

  archivoSeleccionado = archivo;

  // Liberar URL anterior si existe.
  if (urlPreview) {
    URL.revokeObjectURL(urlPreview);
  }

  // Crear nueva vista previa.
  urlPreview = URL.createObjectURL(archivo);
  imgPreview.src = urlPreview;
  imgPreview.style.display = 'block';

  btnSubir.textContent = 'CAMBIAR IMAGEN';
});



async function subirImagen() {
  if (!archivoSeleccionado) return null;

  const fileExt = archivoSeleccionado.name.split('.').pop();
  const fileName = Date.now() + '_' +
    Math.random().toString(36).substring(2) + '.' + fileExt;
  const filePath = `equipos/${fileName}`;

  const { error } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .upload(filePath, archivoSeleccionado, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    url: data.publicUrl,
    path: filePath
  };
}

if (btnGuardar) {
  btnGuardar.addEventListener('click', async () => {
    const numeroInventario = document.getElementById('numero-inventario')?.value.trim();
    // Un valor vacío se envía como null (no como cadena vacía).
    const numeroActivo = document.getElementById('numero-activo')?.value.trim() || null;
    const tipoEquipo = document.getElementById('tipo-equipo')?.value;
    const marca = document.getElementById('marca-equipo')?.value.trim();
    const modelo = document.getElementById('modelo-equipo')?.value.trim();
    const noSerial = document.getElementById('numero-serie')?.value.trim();
    const descripcion = document.getElementById('descripcion-equipo')?.value.trim();
    const ubicacion = document.getElementById('ubicacion-equipo')?.value;
    const estadoOperativo = document.getElementById('estado-operativo')?.value;
    // Un input de fecha vacío se envía como null (no como cadena vacía).
    const fechaRegistro = document.getElementById('fecha-registro')?.value.trim() || null;


    if (!numeroInventario) {
      alert('Por favor ingresa el número de inventario.');
      return;
    }

    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    let imagenSubida = null;

    try {
      imagenSubida = await subirImagen();

      const nuevoEquipo = {
        numeroInventario,
        numeroActivo,
        tipoEquipo,
        marca,
        modelo,
        noSerial,
        descripcion,
        ubicacion,
        estadoOperativo,
        fechaRegistro,
        urlImagen: imagenSubida?.url || IMAGEN_PREDETERMINADA
      };

      const response = await fetch(`${API_BASE}/Equipo/Alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoEquipo)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }

      console.log('¡Equipo registrado con éxito!');
      window.location.href = '/';

    } catch (error) {
      if (imagenSubida) {
        const { error: errorEliminar } = await supabaseClient.storage
          .from(BUCKET_NAME)
          .remove([imagenSubida.path]);

        if (errorEliminar) {
          console.error('No se pudo eliminar la imagen:', errorEliminar);
        }
      }

      console.error('Error al guardar el equipo:', error);
      alert('No se pudo guardar el equipo: ' + error.message);

    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'GUARDAR EQUIPO';
    }
  });
}