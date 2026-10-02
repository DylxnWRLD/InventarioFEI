// Credenciales de Supabase
const SUPABASE_URL = 'https://idsdkpdonldeaqrfcttq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkc2RrcGRvbmxkZWFxcmZjdHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDMzMjIsImV4cCI6MjEwNTU3OTMyMn0.-II-i_C9dpKSqleN1E15eAiOQw_HVQA32gly2SPlN5M';
const BUCKET_NAME = 'equipos_inventario';

// URL base del backend
const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';

// Inicializar Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Referencias del DOM
const btnSubir = document.getElementById('btn-trigger-upload');
const inputImagen = document.getElementById('input-imagen');
const imgPreview = document.getElementById('preview-imagen');
const iconosUpload = document.getElementById('placeholder-iconos');
const inputUrlSupabase = document.getElementById('url-imagen-supabase');
const btnGuardar = document.getElementById('btn-guardar-equipo');

// Abrir selector al presionar "SUBIR IMAGEN"
btnSubir.addEventListener('click', () => {
  inputImagen.click();
});

// Subida a Supabase
inputImagen.addEventListener('change', async (event) => {
  const archivo = event.target.files[0];
  if (!archivo) return;

  btnSubir.disabled = true;
  btnSubir.textContent = 'Subiendo...';

  try {
    const fileExt = archivo.name.split('.').pop();
    const fileName = Date.now() + '_' + Math.random().toString(36).substring(2) + '.' + fileExt;
    const filePath = `equipos/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, archivo, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrlData } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('Imagen subida con éxito:', publicUrl);

    inputUrlSupabase.value = publicUrl;

    imgPreview.src = publicUrl;
    imgPreview.style.display = 'block';
    if (iconosUpload) {
      iconosUpload.style.display = 'none';
    }

    btnSubir.textContent = 'CAMBIAR IMAGEN';
    alert('Imagen cargada correctamente');

  } catch (err) {
    console.error('Error al subir a Supabase:', err);
    alert('Error al subir la imagen: ' + err.message);
    btnSubir.textContent = 'SUBIR IMAGEN';
  } finally {
    btnSubir.disabled = false;
  }
});

// Guardar equipo en Spring Boot
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
    const urlImagen = inputUrlSupabase?.value || null;

    if (!numeroInventario) {
      alert('Por favor ingresa el número de inventario.');
      return;
    }

    const nuevoEquipo = {
      numeroInventario,
      tipoEquipo,
      marca,
      modelo,
      noSerial,
      descripcion,
      ubicacion,
      estadoOperativo,
      urlImagen
    };

    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    try {
      const response = await fetch(`${API_BASE}/Equipos`, {
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

      alert('¡Equipo registrado con éxito!');
      window.location.href = '/';

    } catch (error) {
      console.error('Error al guardar el equipo:', error);
      alert('No se pudo guardar el equipo: ' + error.message);
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'GUARDAR EQUIPO';
    }
  });
}