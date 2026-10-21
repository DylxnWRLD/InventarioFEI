package com.inventariofeicc.inventariofeicc.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.inventariofeicc.inventariofeicc.model.CatalogoDictamenModel;
import com.inventariofeicc.inventariofeicc.service.CatalogoDictamenService;

/**
 * Controlador REST para la consulta del catalogo de dictamen.
 *
 * Provee el endpoint que devuelve los articulos del supuesto del articulo 54,
 * los cuales se muestran en el combo box del formato de baja.
 *
 * @author Dyl y Momen
 */
@RestController
@RequestMapping("/InventarioFEI")
@CrossOrigin(origins = "*")
public class CatalogoDictamenController {

    private final CatalogoDictamenService CDS;

    /**
     * Constructor para la inyeccion de dependencias del servicio de dictamen.
     *
     * @param CDS servicio encargado de manejar el catalogo de dictamen.
     */
    public CatalogoDictamenController(CatalogoDictamenService CDS) {
        this.CDS = CDS;
    }

    /**
     * Obtiene el listado completo de articulos del catalogo de dictamen.
     *
     * @return lista de articulos del catalogo de dictamen.
     */
    @GetMapping("/Dictamen")
    public ResponseEntity<?> obtenerCatalogoDictamen() {
        try {
            List<CatalogoDictamenModel> catalogo = CDS.obtenerCatalogo();
            return ResponseEntity.ok(catalogo);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .internalServerError()
                    .body("Ocurrió un error al obtener el catálogo de dictamen.");
        }
    }
}
