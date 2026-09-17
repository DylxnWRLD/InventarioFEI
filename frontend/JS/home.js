document.addEventListener('DOMContentLoaded', () => {
  cargarEquipos();
});

async function cargarEquipos() {
  const contenedor = document.getElementById('contenedorTarjetas');
  contenedor.innerHTML = '<p>Cargando equipos del inventario...</p>';

  try {
    const response = await fetch('http://localhost:8080/api/equipos');
    
    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }
    const equipos = await response.json();
    contenedor.innerHTML = ''; 

    if (equipos.length === 0) {
      contenedor.innerHTML = '<p>No hay equipos registrados en el sistema.</p>';
      return;
    }

    equipos.forEach(equipo => {
      // Si el equipo tiene url_imagen se usa, si no, se usa el icono por defecto
      const imagenSrc = equipo.urlImagen 
        ? equipo.urlImagen 
        : '../images/noEncontrado.png';

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-image">
          <img src="${imagenSrc}" alt="${equipo.modelo || 'Equipo'}" />
        </div>
        <div class="card-info">
          <h3>${equipo.marca || ''} ${equipo.modelo || 'Sin modelo'}</h3>
          <p><strong>Número de inventario:</strong> ${equipo.numeroInventario}</p>
          <p><strong>Código Serial:</strong> ${equipo.noSerial || 'S/N'}</p>
          <p><strong>Ubicación:</strong> ${equipo.ubicacion}</p>
          <p><strong>Estado:</strong> ${equipo.estadoOperativo}</p>
          <div class="card-buttons">
            <button class="btn-card btn-red" onclick="solicitarBaja('${equipo.numeroInventario}')">Dar Baja</button>
            <button class="btn-card btn-blue-card" onclick="editarEquipo('${equipo.numeroInventario}')">Editar</button>
          </div>
        </div>
      `;
      contenedor.appendChild(card);
    });

  } catch (error) {
    console.error('Error al consultar la API REST:', error);
    contenedor.innerHTML = '<p style="color: red;">Error al conectar con la base de datos local.</p>';
  }
}

function solicitarBaja(numeroInventario) {
  console.log('Iniciar proceso de baja para:', numeroInventario);
}

function editarEquipo(numeroInventario) {
  console.log('Editar equipo:', numeroInventario);
}