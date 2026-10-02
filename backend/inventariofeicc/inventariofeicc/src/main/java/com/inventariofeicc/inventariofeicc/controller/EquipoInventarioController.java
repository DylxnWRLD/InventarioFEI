package com.inventariofeicc.inventariofeicc.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.inventariofeicc.inventariofeicc.model.EquipoInventarioModel;
import com.inventariofeicc.inventariofeicc.model.EquipoInventarioResponse;
import com.inventariofeicc.inventariofeicc.service.EquipoInventarioService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


/**
 * Controlador REST para la gestion y consulta de equipos de inventario.
 *
 * Provee endpoints para paginar el listado general de equipos y realizar
 * busquedas filtradas por texto.
 *
 * @author Dyl y Momen
 */
@RestController
@RequestMapping("/InventarioFEI")
@CrossOrigin(origins = "*")
public class EquipoInventarioController {

    private final EquipoInventarioService EIS;

    /**
     * Constructor para la ineycción de dependencias del servicio de inventario.
     *
     * @param EIS servicio encargado de manejar los equipos.
     */
    public EquipoInventarioController(EquipoInventarioService EIS) {
        this.EIS = EIS;
    }

    /**
     * Obtiene los equipos correspondientes a una página.
     *
     * @param pagina número de página.
     * @return equipos y cantidad total de registros.
     */
    @GetMapping("/Equipos")
    public EquipoInventarioResponse obtenerEquipos(@RequestParam(defaultValue = "1") int pagina) {
        return EIS.obtenerEquipos(pagina);
    }

    /**
     * Busca equipos de inventario según un texto de búsqueda.
     *
     * @param q texto de búsqueda.
     * @param pagina número de página.
     * @return equipos encontrados y cantidad total de coincidencias.
     */
    @GetMapping("/Equipos/Buscar")
    public ResponseEntity<?> buscarEquipos(
            @RequestParam(
                    value = "q",
                    required = false,
                    defaultValue = ""
            ) String q,
            @RequestParam(
                    value = "pagina",
                    defaultValue = "1"
            ) int pagina
    ) {
        try {
            EquipoInventarioResponse respuesta = EIS.buscarEquipos(q, pagina);
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity
                    .badRequest()
                    .body(iae.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .internalServerError()
                    .body("Ocurrió un error al buscar los equipos.");
        }
    }

    @PostMapping("/Alta/Equipo")
    public ResponseEntity<?> altaEquipos(@RequestBody EquipoInventarioModel equipo) {
        try {
            EIS.registrarNuevoEquipoService(equipo);
            // EL RESPONSE ENTITY SIRVE PARA CHECAR LA RESPUESTA QUE SE OBTENGA DE LA PETICIÓN
            return ResponseEntity.ok("Registro Exitoso de Nuevo Equipo: " + equipo.getNumeroInventario());

        } catch (IllegalArgumentException iae) {
            // ERROR EN CASO DE QUE FALTE ALGUN PARAMETRO EN EL BODY
            return ResponseEntity.badRequest().body(iae.getMessage());

        } catch (Exception e) {
            // ERROR POR SI LA BASE DE DATOS TIENE ALGUN PROBLEMA
            return ResponseEntity.internalServerError().body("Ocurrió un error al guardar el equipo.");
        }
    }
    
}
