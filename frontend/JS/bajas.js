const API_BASE = 'https://inventariofeicc-api.onrender.com/InventarioFEI';

const parametros = new URLSearchParams(window.location.search);
const numeroInventario = parametros.get('numeroInventario');
console.log('Equipo seleccionado:', numeroInventario);