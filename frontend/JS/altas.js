const SUPABASE_URL = 'https://idsdkpdonldeaqrfcttq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkc2RrcGRvbmxkZWFxcmZjdHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDMzMjIsImV4cCI6MjEwNTU3OTMyMn0.-II-i_C9dpKSqleN1E15eAiOQw_HVQA32gly2SPlN5M';
const BUCKET_NAME = 'equipos_inventario';

const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const btnSubir = document.getElementById('btn-trigger-upload');
const inputImagen = document.getElementById('input-imagen');
const imgPreview = document.getElementById('preview-imagen');
const iconosUpload = document.getElementById('placeholder-iconos');
const inputUrlSupabase = document.getElementById('url-imagen-supabase');
const btnGuardar = document.getElementById('btn-guardar-equipo');

let archivoSeleccionado = null;

btnSubir.addEventListener('click', () => {
  inputImagen.click();
});

inputImagen.addEventListener('change', (event) => {
  const archivo = event.target.files[0];
  if (!archivo) return;

  if (!archivo.type.startsWith('image/')) {
    alert('Selecciona un archivo de imagen válido.');
    inputImagen.value = '';
    return;
  }

  archivoSeleccionado = archivo;

  imgPreview.src = URL.createObjectURL(archivo);
  imgPreview.style.display = 'block';

  if (iconosUpload) {
    iconosUpload.style.display = 'none';
  }

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
    const tipoEquipo = document.getElementById('tipo-equipo')?.value;
    const marca = document.getElementById('marca-equipo')?.value.trim();
    const modelo = document.getElementById('modelo-equipo')?.value.trim();
    const noSerial = document.getElementById('numero-serie')?.value.trim();
    const descripcion = document.getElementById('descripcion-equipo')?.value.trim();
    const ubicacion = document.getElementById('ubicacion-equipo')?.value;
    const estadoOperativo = document.getElementById('estado-operativo')?.value;
    const fechaRegistro = document.getElementById('fecha-registro')?.value;


    if (!numeroInventario) {
      alert('Por favor ingresa el número de inventario.');
      return;
    }

    if (!fechaRegistro) {
      alert('Por favor selecciona la fecha de registro del equipo.');
      return;
    }

    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    let imagenSubida = null;

    try {
      imagenSubida = await subirImagen();

      const nuevoEquipo = {
        numeroInventario,
        tipoEquipo,
        marca,
        modelo,
        noSerial,
        descripcion,
        ubicacion,
        estadoOperativo,
        urlImagen: imagenSubida?.url || null,
        fechaRegistro,
      };

      const response = await fetch(`${API_BASE}/Alta/Equipo`, {
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