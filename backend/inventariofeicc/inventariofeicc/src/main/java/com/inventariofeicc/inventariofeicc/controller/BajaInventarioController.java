package com.inventariofeicc.inventariofeicc.controller;

import com.inventariofeicc.inventariofeicc.model.BajaInventarioRequest;
import com.inventariofeicc.inventariofeicc.service.BajaInventarioService;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/InventarioFEI")
@CrossOrigin(origins = "*")
public class BajaInventarioController {

    private static final Logger LOGGER = LoggerFactory.getLogger(BajaInventarioController.class);
    private final BajaInventarioService servicio;

    public BajaInventarioController(BajaInventarioService servicio) {
        this.servicio = servicio;
    }

    @PostMapping("/Baja/Equipos")
    public ResponseEntity<?> registrarBajas(@RequestBody BajaInventarioRequest baja) {
        try {
            int registros = servicio.registrarBajas(baja);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "mensaje", "Bajas registradas correctamente.", "registros", registros));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("mensaje", e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("mensaje",
                    "Los datos de inventario o dictamen cambiaron. Actualiza la búsqueda e inténtalo de nuevo."));
        } catch (Exception e) {
            LOGGER.error("No se pudo registrar el formato de baja", e);
            return ResponseEntity.internalServerError().body(Map.of("mensaje",
                    "No se pudieron registrar las bajas. Inténtalo de nuevo."));
        }
    }
}
