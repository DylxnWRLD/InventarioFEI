package com.inventariofeicc.inventariofeicc.controller;

import com.inventariofeicc.inventariofeicc.model.EquipoInventarioModel;
import com.inventariofeicc.inventariofeicc.service.EquipoInventarioService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 
 * @author Dyl y Momen
 */
@RestController
@RequestMapping("/InventarioFEI")
@CrossOrigin(origins = "*")
public class EquipoInventarioController {

    private final EquipoInventarioService EIS;

    /**
     * Constructor del controlador.
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
     * @return lista de equipos.
     */
    @GetMapping("/Equipos")
    public ResponseEntity<?> listaEquipos(
            @RequestParam(defaultValue = "1") int pagina) {

        try {
            List<EquipoInventarioModel> equipos = EIS.obtenerEquipos(pagina);
            return ResponseEntity.ok(equipos);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity
                    .badRequest()
                    .body(iae.getMessage());
        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .body("Ocurrió un error al listar los equipos.");
        }
    }
}