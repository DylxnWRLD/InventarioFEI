/* ==========================================================================
 *  renderExcel.js — v1.0.0
 *  --------------------------------------------------------------------------
 *  Convierte una hoja de ExcelJS (worksheet) en una tabla HTML que conserva
 *  el formato del archivo .xlsx original:
 *
 *    - celdas combinadas (colspan / rowspan)
 *    - bordes, rellenos, fuentes, colores y alineación
 *    - ancho de columnas y alto de filas
 *    - imágenes flotantes (por ejemplo el logo de la Universidad)
 *    - ajuste automático de escala para que quepa en el contenedor
 *
 *  ExcelJS NO genera HTML por sí sola: esta librería es el "renderizador"
 *  que hace ese trabajo. SheetJS (xlsx) sí tenía una función parecida
 *  (sheet_to_html) pero descarta todos los estilos y las imágenes.
 *
 *  Uso:
 *      const libro = await RenderExcel.cargarFormato('../formatos/x.xlsx',
 *                                                  'Nombre de la hoja');
 *      const hoja  = libro.getWorksheet('Nombre de la hoja');
 *      RenderExcel.renderHoja(hoja, document.getElementById('visor-excel'));
 *
 *  Dependencias (cargar ANTES que este archivo):
 *      - ExcelJS   (obligatoria)
 *      - JSZip     (opcional; solo para acelerar la carga, ver cargarFormato)
 * ========================================================================== */
(function (global) {
  'use strict';

  /* ================================================================== *
   *  1. Constantes y conversiones
   * ================================================================== */

  var EMU_A_PX = 96 / 914400;   // EMU -> píxeles (1 pulgada = 914400 EMU = 96px)
  var PT_A_PX = 96 / 72;        // puntos -> píxeles (1pt = 1.333px)

  var ANCHO_BASE = 8.43;        // ancho por defecto de columna (en caracteres)
  var ALTO_BASE = 15;           // alto por defecto de fila (en puntos)
  var PX_POR_CHAR = 7;          // ancho aproximado de 1 carácter en píxeles
  var RELLENO_COL = 5;          // relleno lateral extra de la celda (px)

  // Paleta del tema "Office" (se usa si el archivo no trae theme1.xml).
  var PALETA_OFFICE = [
    'FFFFFF', '000000', 'EDEDED', '44546A', '4472C4', 'ED7D31',
    'A5A5A5', 'FFC000', '5B9BD5', '70AD47', '0563C1', '954F72'
  ];

  // Orden de los colores dentro de <a:clrScheme> (índices que usa Excel).
  var ORDEN_TEMA = [
    'lt1', 'dk1', 'lt2', 'dk2', 'accent1', 'accent2',
    'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'
  ];

  // Traducción de los estilos de borde de Excel a CSS.
  var ESTILO_BORDE = {
    thin: '1px solid',
    hair: '1px solid',
    dotted: '1px dotted',
    dashed: '1px dashed',
    medium: '2px solid',
    mediumDashed: '2px dashed',
    mediumDotted: '2px dotted',
    dashDot: '1px dashed',
    dashDotDot: '1px dotted',
    slantDashDot: '1px dashed',
    mediumDashDot: '2px dashed',
    mediumDashDotDot: '2px dotted',
    thick: '3px solid',
    double: '3px double'
  };

  var LADOS = ['top', 'right', 'bottom', 'left'];

  // Paleta del tema activa (la define cargarFormato leyendo el .xlsx).
  var paletaTema = null;

  /* ================================================================== *
   *  2. Colores y estilos
   * ================================================================== */

  /**
   * Aplica el "tint" de Excel (aclarado/oscurecido) a un color hexadecimal.
   *
   * @param {string} hex  color base "RRGGBB".
   * @param {number} tint valor entre -1 y 1.
   * @returns {string} color resultante "RRGGBB".
   */
  function aplicarTinte(hex, tint) {
    if (!tint) return hex;

    var n = parseInt(hex, 16);
    var canales = [(n >> 16) & 255, (n >> 8) & 255, n & 255];

    canales = canales.map(function (canal) {
      var valor = tint < 0
        ? canal * (1 + tint)              // oscurecer
        : canal + (255 - canal) * tint;   // aclarar
      return Math.max(0, Math.min(255, Math.round(valor)));
    });

    return canales
      .map(function (v) { return v.toString(16).padStart(2, '0'); })
      .join('')
      .toUpperCase();
  }

  /**
   * Convierte un color de ExcelJS en un color CSS (#RRGGBB).
   *
   * @param {Object} color objeto de color de ExcelJS.
   * @returns {string|null} color CSS o null si no se puede resolver.
   */
  function colorCSS(color) {
    if (!color) return null;

    // Color directo (lo más común).
    if (color.argb) return '#' + String(color.argb).slice(-6);

    // Color de tema: se resuelve con la paleta del archivo.
    if (color.theme != null) {
      var paleta = paletaTema || PALETA_OFFICE;
      var base = paleta[color.theme];
      if (!base) return null;
      return '#' + aplicarTinte(base, color.tint);
    }

    return null;
  }

  /**
   * Construye el CSS de los cuatro bordes de una celda.
   *
   * @param {Object} border bordes de ExcelJS.
   * @returns {string} declaraciones CSS.
   */
  function bordeCSS(border) {
    if (!border) return '';

    return LADOS.map(function (lado) {
      var borde = border[lado];
      if (!borde || !borde.style) return '';

      var grosor = ESTILO_BORDE[borde.style] || '1px solid';
      var color = colorCSS(borde.color) || '#000000';

      return 'border-' + lado + ':' + grosor + ' ' + color + ';';
    }).join('');
  }

  /**
   * Construye el CSS del relleno (color de fondo) de una celda.
   *
   * @param {Object} fill relleno de ExcelJS.
   * @returns {string} declaraciones CSS.
   */
  function rellenoCSS(fill) {
    if (!fill) return '';

    // Relleno sólido (el caso normal).
    if (fill.type === 'pattern') {
      var color = colorCSS(fill.fgColor) || colorCSS(fill.bgColor);
      return color ? 'background-color:' + color + ';' : '';
    }

    // Relleno degradado.
    if (fill.type === 'gradient' && fill.stops && fill.stops.length) {
      var paradas = fill.stops
        .map(function (parada) {
          var color = colorCSS(parada.color);
          if (!color) return null;
          return color + ' ' + Math.round((parada.position || 0) * 100) + '%';
        })
        .filter(Boolean);

      if (paradas.length) {
        var angulo = fill.degree != null ? fill.degree : 0;
        return 'background-image:linear-gradient(' + angulo + 'deg, ' +
          paradas.join(', ') + ');';
      }
    }

    return '';
  }

  /**
   * Construye el CSS de la fuente de una celda.
   *
   * @param {Object} font fuente de ExcelJS.
   * @returns {string} declaraciones CSS.
   */
  function fuenteCSS(font) {
    if (!font) return '';

    var css = 'font-family:';

    if (font.name) css += '"' + font.name + '", ';
    css += 'Calibri, Arial, sans-serif;';

    css += 'font-size:' + (font.size || 11) + 'pt;';

    if (font.bold) css += 'font-weight:700;';
    if (font.italic) css += 'font-style:italic;';

    var decoracion = [];
    if (font.underline) decoracion.push('underline');
    if (font.strike) decoracion.push('line-through');
    if (decoracion.length) css += 'text-decoration:' + decoracion.join(' ') + ';';

    var color = colorCSS(font.color);
    if (color) css += 'color:' + color + ';';

    if (font.vertAlign === 'superscript') css += 'vertical-align:super;font-size:smaller;';
    if (font.vertAlign === 'subscript') css += 'vertical-align:sub;font-size:smaller;';

    return css;
  }

  /**
   * Construye el CSS de alineación de una celda.
   *
   * @param {Object} alignment alineación de ExcelJS.
   * @returns {string} declaraciones CSS.
   */
  function alineacionCSS(alignment) {
    var a = alignment || {};

    var horizontales = {
      left: 'left', center: 'center', right: 'right',
      justify: 'justify', fill: 'justify',
      centerContinuous: 'center', distributed: 'justify'
    };

    var verticales = {
      top: 'top', middle: 'middle', bottom: 'bottom',
      distributed: 'middle', justify: 'middle'
    };

    var h = horizontales[a.horizontal] || 'left';
    var v = verticales[a.vertical] || 'bottom';

    var css = 'text-align:' + h + ';vertical-align:' + v + ';';

    if (a.wrapText) {
      css += 'white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;';
    } else {
      css += 'white-space:nowrap;';
    }

    if (a.indent) css += 'padding-left:' + (2 + a.indent * 8) + 'px;';

    if (a.textRotation === 255) {
      css += 'writing-mode:vertical-rl;';
    } else if (a.textRotation > 0 && a.textRotation <= 90) {
      css += 'transform:rotate(-' + a.textRotation + 'deg);';
    }

    return css;
  }

  /**
   * Reúne todas las declaraciones CSS de una celda.
   *
   * @param {Object} celda celda de ExcelJS.
   * @returns {string} declaraciones CSS.
   */
  function estiloCeldaCSS(celda) {
    var estilo = (celda && celda.style) || {};

    return 'padding:1px 2px;box-sizing:border-box;overflow:hidden;' +
      bordeCSS(estilo.border) +
      rellenoCSS(estilo.fill) +
      fuenteCSS(estilo.font) +
      alineacionCSS(estilo.alignment);
  }

  /* ================================================================== *
   *  3. Valores de las celdas
   * ================================================================== */

  /**
   * Indica si un formato de número de Excel representa una fecha u hora.
   *
   * @param {string} fmt formato (por ejemplo "dd/mm/yyyy").
   * @returns {boolean}
   */
  function esFormatoFecha(fmt) {
    if (!fmt) return false;

    // Quitar partes literales entre comillas y bloques entre corchetes.
    var limpio = String(fmt).replace(/\[[^\]]*\]/g, '').replace(/"[^"]*"/g, '');

    if (/^(general|@|text)$/i.test(limpio)) return false;

    return /[ydhs]/i.test(limpio) || (/m/i.test(limpio) && /[dy]/i.test(limpio));
  }

  /**
   * Convierte un número de serie de Excel en una fecha.
   *
   * @param {number} serie número de serie (días desde 1899-12-30).
   * @returns {Date}
   */
  function fechaDesdeSerie(serie) {
    return new Date(Math.round((serie - 25569) * 86400 * 1000));
  }

  /**
   * Formatea una fecha respetando (en lo posible) el formato de Excel.
   *
   * @param {Date} fecha fecha a formatear.
   * @param {string} fmt formato de Excel.
   * @returns {string}
   */
  function formatearFecha(fecha, fmt) {
    if (!fmt || fmt === 'General') {
      return fecha.toLocaleDateString('es-MX');
    }

    var dia = String(fecha.getUTCDate()).padStart(2, '0');
    var mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    var anio = fecha.getUTCFullYear();

    if (/[hH]/.test(fmt)) {
      var hora = String(fecha.getUTCHours()).padStart(2, '0');
      var minuto = String(fecha.getUTCMinutes()).padStart(2, '0');
      return dia + '/' + mes + '/' + anio + ' ' + hora + ':' + minuto;
    }

    // Si el formato pone el día antes que el mes, se respeta ese orden.
    if (fmt.indexOf('d') >= 0 && fmt.indexOf('d') < fmt.indexOf('m')) {
      return dia + '/' + mes + '/' + anio;
    }

    return mes + '/' + dia + '/' + anio;
  }

  /**
   * Formatea un número respetando (en lo posible) el formato de Excel.
   *
   * @param {number} valor número a formatear.
   * @param {string} fmt formato de Excel.
   * @returns {string}
   */
  function formatearNumero(valor, fmt) {
    if (!fmt || fmt === 'General' || fmt === '@') return String(valor);

    // Cantidad de decimales que pide el formato.
    var parteDecimal = fmt.split('.')[1] || '';
    var decimales = (parteDecimal.match(/[0#]/g) || []).length;

    if (fmt.indexOf('%') >= 0) {
      return (valor * 100).toFixed(decimales) + '%';
    }

    return valor.toLocaleString('es-MX', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  }

  /**
   * Extrae el texto que debe verse en una celda: resuelve fórmulas
   * (usa el resultado cacheado), texto enriquecido, hipervínculos,
   * fechas y formatos de número.
   *
   * @param {Object} celda celda de ExcelJS.
   * @returns {string}
   */
  function valorTexto(celda) {
    var valor = celda ? celda.value : null;
    var fmt = celda ? celda.numFmt : null;

    if (valor == null) return '';

    // Valores compuestos (fórmulas, texto enriquecido, enlaces...).
    if (typeof valor === 'object') {
      if (valor instanceof Date) return formatearFecha(valor, fmt);

      if (Array.isArray(valor.richText)) {
        return valor.richText.map(function (t) { return t.text || ''; }).join('');
      }

      if ('result' in valor) {
        valor = valor.result;               // fórmula -> resultado cacheado
      } else if ('text' in valor) {
        valor = valor.text;                 // hipervínculo
      } else if ('error' in valor) {
        valor = valor.error;
      }

      if (valor == null) return '';
      if (valor instanceof Date) return formatearFecha(valor, fmt);
    }

    if (typeof valor === 'number') {
      // Si el formato es de fecha pero ExcelJS no la convirtió.
      if (esFormatoFecha(fmt)) {
        return formatearFecha(fechaDesdeSerie(valor), fmt);
      }
      return formatearNumero(valor, fmt);
    }

    return String(valor);
  }

  /* ================================================================== *
   *  4. Rangos, columnas y filas
   * ================================================================== */

  /**
   * Convierte un número de columna (1) en su letra (A).
   *
   * @param {number} numero número de columna (1 = A).
   * @returns {string}
   */
  function colAAaaa(numero) {
    var letras = '';
    var n = numero;

    while (n > 0) {
      var resto = (n - 1) % 26;
      letras = String.fromCharCode(65 + resto) + letras;
      n = Math.floor((n - 1) / 26);
    }

    return letras;
  }

  /**
   * Convierte una letra de columna (A) en su número (1).
   *
   * @param {string} letras letras de la columna.
   * @returns {number}
   */
  function letraACol(letras) {
    var numero = 0;

    for (var i = 0; i < letras.length; i++) {
      numero = numero * 26 + (letras.charCodeAt(i) - 64);
    }

    return numero;
  }

  /**
   * Convierte una referencia ("A1:AI26") en índices numéricos.
   *
   * @param {string} ref referencia de Excel.
   * @returns {Object|null} {top, left, bottom, right}
   */
  function parsearRango(ref) {
    var coincidencia = /^\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/i.exec(
      String(ref).trim()
    );

    if (!coincidencia) return null;

    var izquierda = letraACol(coincidencia[1].toUpperCase());
    var arriba = parseInt(coincidencia[2], 10);
    var derecha = coincidencia[3]
      ? letraACol(coincidencia[3].toUpperCase())
      : izquierda;
    var abajo = coincidencia[4] ? parseInt(coincidencia[4], 10) : arriba;

    return { top: arriba, left: izquierda, bottom: abajo, right: derecha };
  }

  /**
   * Obtiene el rango usado de una hoja como índices numéricos.
   *
   * @param {Object} hoja hoja de ExcelJS.
   * @returns {Object} {top, left, bottom, right}
   */
  function rangoHoja(hoja) {
    var dimensiones = hoja.dimensions;

    if (typeof dimensiones === 'string') {
      dimensiones = parsearRango(dimensiones);
    }

    if (dimensiones && dimensiones.top != null) return dimensiones;

    return {
      top: 1,
      left: 1,
      bottom: hoja.rowCount || 1,
      right: hoja.columnCount || 1
    };
  }

  /**
   * Calcula el ancho en píxeles de una columna.
   *
   * @param {Object} hoja hoja de ExcelJS.
   * @param {number} columna número de columna (1 = A).
   * @returns {number} píxeles.
   */
  function anchoColumna(hoja, columna) {
    var col = hoja.getColumn(columna);
    var ancho = col && col.width != null
      ? col.width
      : (hoja.properties.defaultColWidth || ANCHO_BASE);

    return Math.round(ancho * PX_POR_CHAR) + RELLENO_COL;
  }

  /**
   * Calcula el alto en píxeles de una fila.
   *
   * @param {Object} hoja hoja de ExcelJS.
   * @param {number} fila número de fila (1 = primera).
   * @returns {number} píxeles.
   */
  function altoFila(hoja, fila) {
    var row = hoja.getRow(fila);
    var alto = row && row.height != null
      ? row.height
      : (hoja.properties.defaultRowHeight || ALTO_BASE);

    return Math.round(alto * PT_A_PX);
  }

  /**
   * Construye el mapa de celdas combinadas de una hoja.
   *
   * @param {Object} hoja hoja de ExcelJS.
   * @returns {Object} {anclas, cubiertas}
   *   anclas:   Map "fila:columna" -> {rowspan, colspan}
   *   cubiertas: Set "fila:columna" (celdas que no deben pintarse)
   */
  function mapaMerges(hoja) {
    var anclas = new Map();
    var cubiertas = new Set();

    var merges = (hoja.model && hoja.model.merges) || [];

    merges.forEach(function (merge) {
      var rango = typeof merge === 'string' ? parsearRango(merge) : merge;
      if (!rango || rango.top == null) return;

      var filas = rango.bottom - rango.top + 1;
      var columnas = rango.right - rango.left + 1;

      anclas.set(rango.top + ':' + rango.left, {
        rowspan: filas,
        colspan: columnas
      });

      for (var f = rango.top; f <= rango.bottom; f++) {
        for (var c = rango.left; c <= rango.right; c++) {
          if (f !== rango.top || c !== rango.left) cubiertas.add(f + ':' + c);
        }
      }
    });

    return { anclas: anclas, cubiertas: cubiertas };
  }

  /* ================================================================== *
   *  5. Imágenes flotantes (logos)
   * ================================================================== */

  /**
   * Normaliza el ancla de una imagen (ExcelJS cambia de nombre según versión).
   *
   * @param {Object} ancla ancla cruda.
   * @returns {Object} {col, row, colOff, rowOff}
   */
  function normalizarAncla(ancla) {
    var a = ancla || {};

    return {
      col: a.nativeCol != null ? a.nativeCol : (a.col || 0),
      row: a.nativeRow != null ? a.nativeRow : (a.row || 0),
      colOff: a.nativeColOff != null ? a.nativeColOff : (a.colOff || 0),
      rowOff: a.nativeRowOff != null ? a.nativeRowOff : (a.rowOff || 0)
    };
  }

  /**
   * Convierte el contenido de una imagen en una cadena base64.
   *
   * @param {*} buffer cadena base64, Uint8Array, ArrayBuffer...
   * @returns {string}
   */
  function aBase64(buffer) {
    if (!buffer) return '';
    if (typeof buffer === 'string') return buffer; // ya viene en base64

    var bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

    if (bytes && bytes.data) bytes = new Uint8Array(bytes.data); // {type, data}

    var binario = '';
    var tamano = 0x8000;

    for (var i = 0; i < bytes.length; i += tamano) {
      binario += String.fromCharCode.apply(null, bytes.subarray(i, i + tamano));
    }

    return global.btoa(binario);
  }

  /**
   * Recupera la imagen asociada a un ancla.
   *
   * @param {Object} libro libro de ExcelJS.
   * @param {Object} ancla ancla de imagen.
   * @returns {Object|null} {base64, extension}
   */
  function obtenerImagen(libro, ancla) {
    if (!libro) return null;

    var media = null;

    try {
      if (typeof libro.getImage === 'function') media = libro.getImage(ancla.imageId);
    } catch (e) { /* se intenta con el modelo */ }

    if (!media) {
      var lista = (libro.model && libro.model.media) || libro.media || [];
      media = lista[ancla.imageId] || lista[ancla.imageId - 1];
    }

    if (!media) return null;

    return {
      base64: aBase64(media.buffer),
      extension: String(media.extension || 'png').replace(/^\./, '')
    };
  }

  /**
   * Coloca las imágenes flotantes de la hoja sobre la tabla.
   *
   * @param {Object} hoja hoja de ExcelJS.
   * @param {Object} libro libro de ExcelJS.
   * @param {HTMLElement} capa contenedor absoluto donde se añaden.
   * @param {Object} rango rango usado de la hoja.
   * @param {Object} anchos anchos por columna (índice 1 = A).
   * @param {Object} alturas altos por fila (índice 1 = primera).
   */
  function agregarImagenes(hoja, libro, capa, rango, anchos, alturas) {
    var imagenes = [];

    try {
      imagenes = hoja.getImages() || [];
    } catch (e) {
      return;
    }

    // Posición acumulada de una columna base-cero.
    function xColumna(colBaseCero) {
      var x = 0;
      for (var c = 1; c <= colBaseCero; c++) {
        x += anchos[c] != null ? anchos[c] : (ANCHO_BASE * PX_POR_CHAR + RELLENO_COL);
      }
      return x;
    }

    // Posición acumulada de una fila base-cero.
    function yFila(filaBaseCero) {
      var y = 0;
      for (var f = 1; f <= filaBaseCero; f++) {
        y += alturas[f] != null ? alturas[f] : Math.round(ALTO_BASE * PT_A_PX);
      }
      return y;
    }

    imagenes.forEach(function (ancla) {
      var imagen = obtenerImagen(libro, ancla);
      if (!imagen || !imagen.base64) return;

      var rangoImg = ancla.range || {};
      var tl = normalizarAncla(rangoImg.tl);

      var izquierda = xColumna(tl.col) + tl.colOff * EMU_A_PX;
      var arriba = yFila(tl.row) + tl.rowOff * EMU_A_PX;

      var img = document.createElement('img');
      img.src = 'data:image/' + imagen.extension + ';base64,' + imagen.base64;
      img.alt = '';
      img.style.position = 'absolute';
      img.style.left = izquierda + 'px';
      img.style.top = arriba + 'px';

      if (rangoImg.br) {
        var br = normalizarAncla(rangoImg.br);
        img.style.width = (xColumna(br.col) + br.colOff * EMU_A_PX - izquierda) + 'px';
        img.style.height = (yFila(br.row) + br.rowOff * EMU_A_PX - arriba) + 'px';
      } else if (rangoImg.ext) {
        img.style.width = (rangoImg.ext.width * EMU_A_PX) + 'px';
        img.style.height = (rangoImg.ext.height * EMU_A_PX) + 'px';
      }

      capa.appendChild(img);
    });
  }

  /* ================================================================== *
   *  6. Renderizado de la hoja
   * ================================================================== */

  // Observadores de tamaño por contenedor (para re-escalar sin fugas).
  var observadores = new WeakMap();

  /**
   * Ajusta la escala del lienzo para que quepa en el ancho disponible.
   *
   * @param {HTMLElement} marco contenedor con overflow oculto.
   * @param {HTMLElement} lienzo bloque escalable (tabla + imágenes).
   * @param {HTMLElement} tabla tabla generada.
   * @param {HTMLElement} contenedor contenedor externo del visor.
   */
  function ajustarEscala(marco, lienzo, tabla, contenedor) {
    function aplicar() {
      var disponible = contenedor.clientWidth;
      var real = tabla.offsetWidth;

      if (!disponible || !real) return;

      var escala = Math.min(1, disponible / real);

      lienzo.style.transform = 'scale(' + escala + ')';
      marco.style.width = (real * escala) + 'px';
      marco.style.height = (tabla.offsetHeight * escala) + 'px';
    }

    global.requestAnimationFrame(aplicar);

    if (global.ResizeObserver) {
      var anterior = observadores.get(contenedor);
      if (anterior) anterior.disconnect();

      var observador = new ResizeObserver(aplicar);
      observador.observe(contenedor);
      observadores.set(contenedor, observador);
    }
  }

  /**
   * Dibuja una hoja de ExcelJS dentro de un contenedor conservando formato.
   *
   * @param {Object} hoja hoja de ExcelJS.
   * @param {HTMLElement|string} contenedor elemento o selector destino.
   * @param {Object} [libro] libro de ExcelJS (opcional; para las imágenes).
   * @returns {Object|null} referencias generadas.
   */
  function renderHoja(hoja, contenedor, libro) {
    var destino = typeof contenedor === 'string'
      ? document.querySelector(contenedor)
      : contenedor;

    if (!hoja || !destino) return null;

    destino.replaceChildren();

    var rango = rangoHoja(hoja);
    var merges = mapaMerges(hoja);
    var duenoLibro = libro || hoja.workbook || hoja._workbook;

    // Anchos de todas las columnas del rango.
    var anchos = [];
    for (var c = rango.left; c <= rango.right; c++) {
      anchos[c] = anchoColumna(hoja, c);
    }

    var tabla = document.createElement('table');
    tabla.className = 'excel-tabla';
    tabla.style.borderCollapse = 'collapse';
    tabla.style.tableLayout = 'fixed';
    tabla.style.backgroundColor = '#ffffff';

    var colgroup = document.createElement('colgroup');
    for (var k = rango.left; k <= rango.right; k++) {
      var col = document.createElement('col');
      col.style.width = anchos[k] + 'px';
      colgroup.appendChild(col);
    }
    tabla.appendChild(colgroup);

    // Altos de todas las filas del rango.
    var alturas = [];
    for (var f = rango.top; f <= rango.bottom; f++) {
      alturas[f] = altoFila(hoja, f);
    }

    var tbody = document.createElement('tbody');

    for (var fila = rango.top; fila <= rango.bottom; fila++) {
      var tr = document.createElement('tr');
      tr.style.height = alturas[fila] + 'px';

      for (var columna = rango.left; columna <= rango.right; columna++) {
        if (merges.cubiertas.has(fila + ':' + columna)) continue;

        var celda = hoja.getCell(fila, columna);
        var td = document.createElement('td');

        td.setAttribute('style', estiloCeldaCSS(celda));

        var ancla = merges.anclas.get(fila + ':' + columna);
        if (ancla) {
          if (ancla.colspan > 1) td.colSpan = ancla.colspan;
          if (ancla.rowspan > 1) td.rowSpan = ancla.rowspan;
        }

        var texto = valorTexto(celda);
        if (texto) td.textContent = texto;

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    tabla.appendChild(tbody);

    // Capa absoluta para las imágenes flotantes (logos).
    var capa = document.createElement('div');
    capa.className = 'excel-imagenes';
    capa.style.position = 'absolute';
    capa.style.top = '0';
    capa.style.left = '0';
    capa.style.pointerEvents = 'none';

    agregarImagenes(hoja, duenoLibro, capa, rango, anchos, alturas);

    // Lienzo: tabla + imágenes en el mismo sistema de coordenadas.
    var lienzo = document.createElement('div');
    lienzo.className = 'excel-lienzo';
    lienzo.style.position = 'relative';
    lienzo.style.display = 'inline-block';
    lienzo.style.transformOrigin = 'top left';
    lienzo.appendChild(tabla);
    lienzo.appendChild(capa);

    var marco = document.createElement('div');
    marco.className = 'excel-marco';
    marco.style.overflow = 'hidden';
    marco.style.background = '#ffffff';
    marco.appendChild(lienzo);

    destino.appendChild(marco);

    ajustarEscala(marco, lienzo, tabla, destino);

    return { tabla: tabla, lienzo: lienzo, marco: marco };
  }

  /* ================================================================== *
   *  7. Utilidades de ZIP (recorte del archivo para carga rápida)
   *     Muchos formatos oficiales traen hojas ocultas enormes que
   *     ExcelJS parsearía sin necesidad. cargarFormato recorta el .xlsx
   *     para dejar solo la hoja que se va a mostrar.
   * ================================================================== */

  /**
   * Normaliza una ruta relativa de ZIP.
   *
   * @param {string} ruta ruta con "." y "..".
   * @returns {string} ruta normalizada.
   */
  function normalizarRuta(ruta) {
    var partes = [];

    String(ruta).split('/').forEach(function (segmento) {
      if (!segmento || segmento === '.') return;
      if (segmento === '..') partes.pop();
      else partes.push(segmento);
    });

    return partes.join('/');
  }

  /**
   * Devuelve el directorio de una ruta.
   *
   * @param {string} ruta ruta del archivo.
   * @returns {string}
   */
  function dirname(ruta) {
    var i = ruta.lastIndexOf('/');
    return i < 0 ? '' : ruta.slice(0, i);
  }

  /**
   * Devuelve la ruta del archivo de relaciones de una parte.
   *
   * @param {string} ruta ruta de la parte.
   * @returns {string}
   */
  function rutaRelsDe(ruta) {
    var dir = dirname(ruta);
    var nombre = ruta.slice(dir ? dir.length + 1 : 0);
    return (dir ? dir + '/' : '') + '_rels/' + nombre + '.rels';
  }

  /**
   * Extrae las relaciones de un XML.
   *
   * @param {string} xml contenido de un archivo .rels.
   * @returns {Array<Object>} lista de relaciones.
   */
  function extraerRelaciones(xml) {
    var relaciones = [];
    var re = /<Relationship\b([^>]*?)\/?>/g;
    var coincidencia;

    while ((coincidencia = re.exec(xml))) {
      var objeto = {};
      var reAtributo = /([A-Za-z:]+)="([^"]*)"/g;
      var atributo;

      while ((atributo = reAtributo.exec(coincidencia[1]))) {
        objeto[atributo[1]] = atributo[2];
      }

      relaciones.push(objeto);
    }

    return relaciones;
  }

  /**
   * Lee un archivo de texto del ZIP.
   *
   * @param {Object} zip instancia de JSZip.
   * @param {string} ruta ruta dentro del ZIP.
   * @returns {Promise<string|null>}
   */
  async function leerArchivo(zip, ruta) {
    var archivo = zip.file(ruta);
    return archivo ? archivo.async('string') : null;
  }

  /**
   * Lee la paleta de colores del tema del libro.
   *
   * @param {Object} zip instancia de JSZip.
   * @returns {Promise<Array<string>|null>}
   */
  async function leerPaletaTema(zip) {
    var xml = null;
    var rels = await leerArchivo(zip, 'xl/_rels/workbook.xml.rels');

    if (rels) {
      var relacion = extraerRelaciones(rels).find(function (r) {
        return /\/theme$/.test(r.Type || '');
      });
      if (relacion) xml = await leerArchivo(zip, 'xl/' + relacion.Target);
    }

    if (!xml) xml = await leerArchivo(zip, 'xl/theme/theme1.xml');
    if (!xml) return null;

    var bloque = /<(?:[\w]+:)?clrScheme\b[^>]*>([\s\S]*?)<\/(?:[\w]+:)?clrScheme>/.exec(xml);
    if (!bloque) return null;

    var contenido = bloque[1];
    var paleta = [];

    ORDEN_TEMA.forEach(function (nombre) {
      var re = new RegExp(
        '<(?:[\\w]+:)?' + nombre + '\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w]+:)?' + nombre + '>'
      );
      var coincidencia = re.exec(contenido);
      if (!coincidencia) return;

      var srgb = /<(?:[\w]+:)?srgbClr\b[^>]*val="([0-9A-Fa-f]{6})"/.exec(coincidencia[1]);
      var sys = /<(?:[\w]+:)?sysClr\b[^>]*lastClr="([0-9A-Fa-f]{6})"/.exec(coincidencia[1]);

      paleta.push((srgb ? srgb[1] : (sys ? sys[1] : '000000')).toUpperCase());
    });

    return paleta.length ? paleta : null;
  }

  /**
   * Filtra [Content_Types].xml dejando solo las partes que se conservan.
   *
   * @param {string} xml contenido original.
   * @param {Set<string>} conservadas rutas conservadas.
   * @returns {string}
   */
  function filtrarContentTypes(xml, conservadas) {
    if (!xml) return xml;

    return xml.replace(/<Override\b[^>]*\/>/g, function (etiqueta) {
      var partName = /PartName="([^"]*)"/.exec(etiqueta);
      if (!partName) return etiqueta;

      var ruta = partName[1].replace(/^\//, '');
      return conservadas.has(ruta) ? etiqueta : '';
    });
  }

  /**
   * Recorta un .xlsx para dejar únicamente la hoja indicada y sus
   * dependencias (estilos, tema, cadenas, dibujos e imágenes).
   *
   * @param {Object} original ZIP de JSZip con el archivo completo.
   * @param {string} nombreHoja nombre de la hoja a conservar.
   * @returns {Promise<ArrayBuffer>}
   */
  async function recortarLibro(original, nombreHoja) {
    var workbookXml = await leerArchivo(original, 'xl/workbook.xml');
    var workbookRels = await leerArchivo(original, 'xl/_rels/workbook.xml.rels');

    if (!workbookXml || !workbookRels) {
      throw new Error('El archivo no tiene la estructura esperada.');
    }

    // Localizar la etiqueta <sheet> de la hoja pedida.
    var etiquetas = workbookXml.match(/<sheet\b[^>]*\/>/g) || [];
    var etiqueta = etiquetas.find(function (t) {
      var nombre = /name="([^"]*)"/.exec(t);
      return nombre && nombre[1] === nombreHoja;
    });

    if (!etiqueta) throw new Error('La hoja "' + nombreHoja + '" no existe.');

    var rid = /r:id="([^"]+)"/.exec(etiqueta)[1];

    // Relaciones del libro, sin las otras hojas ni la cadena de cálculo.
    var relsFiltradas = workbookRels.replace(
      /<Relationship\b([^>]*?)\/?>/g,
      function (etiquetaRel, attrs) {
        var tipo = /Type="([^"]*)"/.exec(attrs);
        var id = /Id="([^"]*)"/.exec(attrs);

        if (!tipo || !id) return etiquetaRel;
        if (/\/worksheet$/.test(tipo[1])) return id[1] === rid ? etiquetaRel : '';
        if (/\/calcChain$/.test(tipo[1])) return '';

        return etiquetaRel;
      }
    );

    // Nuevo workbook.xml: una sola hoja y sin nombres definidos.
    var nuevoWorkbookXml = workbookXml
      .replace(/<sheets\b[^>]*>[\s\S]*?<\/sheets>/, '<sheets>' + etiqueta + '</sheets>')
      .replace(/<definedNames>[\s\S]*?<\/definedNames>/, '')
      .replace(/activeTab="\d+"/, 'activeTab="0"');

    var nuevo = new global.JSZip();
    var conservadas = new Set();

    // Copia una parte y, recursivamente, sus dependencias.
    async function copiar(ruta) {
      ruta = normalizarRuta(ruta);
      if (conservadas.has(ruta)) return;

      var archivo = original.file(ruta);
      if (!archivo) return;

      conservadas.add(ruta);
      nuevo.file(ruta, await archivo.async('uint8array'));

      var relsRuta = rutaRelsDe(ruta);
      var relsArchivo = original.file(relsRuta);
      if (!relsArchivo) return;

      conservadas.add(relsRuta);
      nuevo.file(relsRuta, await relsArchivo.async('uint8array'));

      var xml = await relsArchivo.async('string');

      for (var relacion of extraerRelaciones(xml)) {
        if (!relacion.Target) continue;
        if (relacion.TargetMode === 'External') continue;
        if (/^[a-z][a-z0-9+.-]*:/i.test(relacion.Target)) continue;

        await copiar(dirname(ruta) + '/' + relacion.Target);
      }
    }

    // Partes base (ya reemplazadas por las versiones filtradas).
    conservadas.add('xl/workbook.xml');
    conservadas.add('xl/_rels/workbook.xml.rels');
    nuevo.file('xl/workbook.xml', nuevoWorkbookXml);
    nuevo.file('xl/_rels/workbook.xml.rels', relsFiltradas);

    for (var relacion of extraerRelaciones(relsFiltradas)) {
      if (!relacion.Target || relacion.TargetMode === 'External') continue;
      await copiar('xl/' + relacion.Target);
    }

    await copiar('_rels/.rels');
    await copiar('docProps/core.xml');
    await copiar('docProps/app.xml');

    var contentTypes = await leerArchivo(original, '[Content_Types].xml');
    if (contentTypes) {
      conservadas.add('[Content_Types].xml');
      nuevo.file('[Content_Types].xml', filtrarContentTypes(contentTypes, conservadas));
    }

    return nuevo.generateAsync({ type: 'arraybuffer' });
  }

  /* ================================================================== *
   *  8. API pública
   * ================================================================== */

  /**
   * Descarga un archivo .xlsx y lo convierte en un libro de ExcelJS.
   *
   * @param {string} url ruta del archivo de formato.
   * @param {string} [nombreHoja] hoja que se quiere conservar.
   * @returns {Promise<Object>} libro de ExcelJS.
   */
  async function cargarFormato(url, nombreHoja) {
    if (typeof global.ExcelJS === 'undefined') {
      throw new Error('La librería ExcelJS no está cargada.');
    }

    var respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error('No se pudo obtener el formato (' + respuesta.status + ').');
    }

    var buffer = await respuesta.arrayBuffer();
    var datos = buffer;

    if (global.JSZip) {
      try {
        var zip = await global.JSZip.loadAsync(buffer);

        var paleta = await leerPaletaTema(zip);
        if (paleta) paletaTema = paleta;

        if (nombreHoja) datos = await recortarLibro(zip, nombreHoja);
      } catch (error) {
        // Si el recorte falla, se usa el archivo completo (más lento).
        console.warn('[renderExcel] No se pudo optimizar el formato:', error);
        datos = buffer;
      }
    }

    var libro = new global.ExcelJS.Workbook();
    await libro.xlsx.load(datos);

    return libro;
  }

  /**
   * Define manualmente la paleta del tema (si no se lee del archivo).
   *
   * @param {Array<string>} paleta colores en formato "RRGGBB".
   */
  function usarTema(paleta) {
    paletaTema = paleta && paleta.length ? paleta : null;
  }

  global.RenderExcel = {
    version: '1.0.0',
    cargarFormato: cargarFormato,
    renderHoja: renderHoja,
    usarTema: usarTema,
    // Utilitarios expuestos por si se necesitan por separado.
    colorCSS: colorCSS,
    bordeCSS: bordeCSS,
    rellenoCSS: rellenoCSS,
    fuenteCSS: fuenteCSS,
    alineacionCSS: alineacionCSS,
    estiloCeldaCSS: estiloCeldaCSS,
    valorTexto: valorTexto,
    parsearRango: parsearRango,
    colAAaaa: colAAaaa,
    letraACol: letraACol
  };

})(window);
