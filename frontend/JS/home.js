document.addEventListener('DOMContentLoaded', () => {
  cargarEquipos();
});

async function cargarEquipos() {
  const contenedor = document.getElementById('tablita-equipos');
  contenedor.innerHTML = '<p>Cargando equipos del inventario...</p>';

  try {
    const response = await fetch('http://localhost:8080/InventarioFEI/Equipos');
    
    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }
    const equipos = await response.json();
    contenedor.innerHTML = ''; 

    if (equipos.length === 0) {
      contenedor.innerHTML = '<p>No hay equipos registrados en el sistema.</p>';
      return;
    }

    // Vamos a hacer por el momento filas de una tabla, luego usamos tarjetas
    equipos.forEach(equipo => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${equipo.descripcion || 'Sin descripción'}</td>
        <td>${equipo.marca || 'Sin marca'}</td>
        <td>${equipo.modelo || 'Sin modelo'}</td>
        <td>${equipo.noSerial || 'S/N'}</td>
        <td>${equipo.ubicacion || 'Sin ubicación'}</td>
      `;
      contenedor.appendChild(fila);
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