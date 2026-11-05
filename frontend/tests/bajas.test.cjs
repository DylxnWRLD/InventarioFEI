const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const JSZip = require('jszip');

const frontend = path.resolve(__dirname, '..');
const equipo = { numeroInventario: 'INV-123', numeroActivo: 'ACT-1',
    descripcion: 'Computadora', estadoOperativo: 'ACTIVO', marca: 'Marca',
    modelo: 'Modelo', noSerial: 'SERIE', ubicacion: 'CC1', fechaRegistro: '2025-01-10' };

async function abrirPagina(t, respuestaBaja = 201) {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    t.after(() => browser.close());
    const page = await browser.newPage({ acceptDownloads: true });
    const peticiones = [];
    const errores = [];
    page.on('pageerror', error => errores.push(error.message));
    page.on('dialog', dialog => dialog.dismiss());

    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('/Baja/Equipos')) {
            peticiones.push(route.request().postDataJSON());
            // Permite comprobar el bloqueo del botón mientras la petición está pendiente.
            await new Promise(resolve => setTimeout(resolve, 100));
            return route.fulfill({ status: respuestaBaja, contentType: 'application/json',
                body: JSON.stringify(respuestaBaja === 201
                    ? { mensaje: 'Bajas registradas correctamente.', registros: 1 }
                    : { mensaje: 'El equipo INV-123 ya tiene una baja registrada.' }) });
        }
        if (url.pathname.endsWith('/Dictamen')) {
            return route.fulfill({ json: [{ idArticulo: 3, articulo: 'Art. 54 Fracción III.' }] });
        }
        if (url.pathname.endsWith('/Equipos/Buscar')) {
            return route.fulfill({ json: { equipos: [equipo], total: 1 } });
        }
        if (url.pathname.endsWith('/jszip.min.js')) {
            return route.fulfill({ path: require.resolve('jszip/dist/jszip.min.js'),
                contentType: 'application/javascript' });
        }
        if (url.pathname.endsWith('/xlsx.full.min.js')) {
            // La vista previa se sustituye; el exportador usa el ZIP y XML reales de la plantilla.
            return route.fulfill({ contentType: 'application/javascript', body:
                "window.XLSX = { read: () => ({ Sheets: { 'Mobiliario -Herramientas': {} } }), utils: { sheet_to_html: () => '<table></table>' } };" });
        }
        if (url.hostname === 'inventario.test') {
            const archivo = path.resolve(frontend, '.' + decodeURIComponent(url.pathname));
            assert.ok(archivo.startsWith(frontend + path.sep));
            return route.fulfill({ path: archivo });
        }
        return route.abort();
    });

    await page.goto('http://inventario.test/HTML/bajas.html');
    await page.locator('#buscar-equipo').fill('INV-123');
    await page.locator('#btn-buscar-equipo').click();
    await page.getByRole('button', { name: 'AGREGAR', exact: true }).click();
    await page.locator('#combo-dictamen').selectOption('3');
    await page.locator('#dictaminador').fill('María Pérez');
    await page.locator('#fecha-baja').fill('2026-01-15');
    return { page, peticiones, errores };
}

test('registra los datos antes de descargar y conserva los mismos valores en el Excel', async t => {
    const { page, peticiones, errores } = await abrirPagina(t);
    await page.getByLabel('Motivo técnico de baja').fill('Fuente dañada & sin reparación');
    const descargaPendiente = page.waitForEvent('download');
    await page.locator('#btn-generar-excel').click();
    const descarga = await descargaPendiente;
    assert.equal(peticiones.length, 1);
    assert.equal(descarga.suggestedFilename(), 'formato_baja.xlsx');
    assert.deepEqual(peticiones[0], {
        dictaminador: 'María Pérez', ur: '0075',
        unidadResponsableOrigen: 'Facultad de Estadística e Informática',
        fechaBaja: '2026-01-15', idArticulo: 3,
        equipos: [{ numeroInventario: 'INV-123', motivoTecnicoBaja: 'Fuente dañada & sin reparación' }]
    });
    const chunks = [];
    for await (const chunk of await descarga.createReadStream()) chunks.push(chunk);
    const zip = await JSZip.loadAsync(Buffer.concat(chunks));
    const xml = await zip.file('xl/worksheets/sheet2.xml').async('string');
    const celdas = await page.evaluate(xml => {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        return Object.fromEntries(['E12', 'Z12', 'A25', 'A8', 'E8', 'AG4'].map(direccion => {
            const celda = doc.querySelector(`c[r="${direccion}"]`);
            return [direccion, celda.textContent];
        }));
    }, xml);
    assert.equal(celdas.E12, 'INV-123');
    assert.equal(celdas.Z12, 'Fuente dañada & sin reparación');
    assert.equal(celdas.A25, 'María Pérez');
    assert.equal(celdas.A8, '0075');
    assert.equal(celdas.E8, peticiones[0].unidadResponsableOrigen);
    assert.equal(Number(celdas.AG4), (Date.UTC(2026, 0, 15) - Date.UTC(1899, 11, 30)) / 86400000);
    await page.waitForFunction(() => document.getElementById('contador-equipos').textContent === '0');
    assert.equal(await page.getByRole('button', { name: 'EN PROCESO DE BAJA', exact: true }).isDisabled(), true);
    // Volver a descargar el archivo no registra otra baja.
    const segundaDescarga = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Volver a descargar el Excel' }).click();
    await segundaDescarga;
    assert.equal(peticiones.length, 1);
    assert.deepEqual(errores, []);
});

test('un error de la API impide descargar y conserva la selección para corregirla', async t => {
    const { page, peticiones, errores } = await abrirPagina(t, 409);
    let descargas = 0;
    page.on('download', () => descargas++);
    await page.getByLabel('Motivo técnico de baja').fill('Fuente dañada');
    await page.locator('#btn-generar-excel').click();
    await page.waitForFunction(() => document.getElementById('estado-baja').textContent.includes('ya tiene una baja'));
    assert.equal(peticiones.length, 1);
    assert.equal(descargas, 0);
    assert.equal(await page.locator('#contador-equipos').textContent(), '1');
    assert.equal(await page.getByLabel('Motivo técnico de baja').inputValue(), 'Fuente dañada');
    assert.equal(await page.locator('#btn-generar-excel').isEnabled(), true);
    assert.deepEqual(errores, []);
});

test('exige el motivo y evita solicitudes duplicadas mientras está registrando', async t => {
    const { page, peticiones, errores } = await abrirPagina(t);
    await page.locator('#btn-generar-excel').click();
    assert.equal(peticiones.length, 0);
    await page.getByLabel('Motivo técnico de baja').fill('Tarjeta dañada');
    const descarga = page.waitForEvent('download');
    await page.evaluate(() => { generarExcel(); generarExcel(); });
    assert.equal(await page.locator('#btn-generar-excel').isDisabled(), true);
    assert.equal(await page.locator('#dictaminador').isDisabled(), true);
    await descarga;
    assert.equal(peticiones.length, 1);
    assert.deepEqual(errores, []);
});
