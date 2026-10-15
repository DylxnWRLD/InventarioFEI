package com.inventariofeicc.inventariofeicc.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.inventariofeicc.inventariofeicc.model.CatalogoDictamenModel;
import com.inventariofeicc.inventariofeicc.repository.CatalogoDictamenRepository;

/**
 * Servicio encargado de manejar la logica relacionada con el catalogo de
 * dictamen.
 *
 * @author Dyl y Momen
 */
@Service
public class CatalogoDictamenService {

    private final CatalogoDictamenRepository CDR;

    /**
     * Constructor del servicio.
     *
     * @param CDR repositorio encargado de realizar las consultas a la base de
     * datos.
     */
    public CatalogoDictamenService(CatalogoDictamenRepository CDR) {
        this.CDR = CDR;
    }

    /**
     * Obtiene el listado completo de articulos del catalogo de dictamen.
     *
     * @return lista de articulos disponibles para el dictamen.
     */
    public List<CatalogoDictamenModel> obtenerCatalogo() {
        return CDR.obtenerCatalogoDictamen();
    }
}
