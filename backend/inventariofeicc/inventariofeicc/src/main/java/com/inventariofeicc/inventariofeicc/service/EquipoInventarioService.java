package com.inventariofeicc.inventariofeicc.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.inventariofeicc.inventariofeicc.model.EquipoInventarioModel;
import com.inventariofeicc.inventariofeicc.model.EquipoInventarioResponse;
import com.inventariofeicc.inventariofeicc.repository.EquipoInventarioRepository;

/**
 * Servicio encargado de manejar la lógica relacionada con los equipos de
 * inventario.
 *
 * @author Dyl y Momen
 */
@Service
public class EquipoInventarioService {

    private final EquipoInventarioRepository EIR;

    /**
     * Cantidad máxima de equipos que se muestran por página.
     */
    private static final int LIMITE = 30;

    /**
     * Constructor del servicio.
     *
     * @param EIR repositorio encargado de realizar las consultas a la base de
     * datos.
     */
    public EquipoInventarioService(EquipoInventarioRepository EIR) {
        this.EIR = EIR;
    }

    /**
     * Obtiene los equipos correspondientes a una página junto con la cantidad
     * total de equipos registrados.
     *
     * @param pagina número de página solicitada.
     * @return equipos de la página y total de registros.
     */
    public EquipoInventarioResponse obtenerEquipos(int pagina) {
        if (pagina < 1) {
            throw new IllegalArgumentException("El número de página debe ser mayor o igual a 1.");
        }
        int offset = (pagina - 1) * LIMITE;
        List<EquipoInventarioModel> equipos = EIR.obtenerEquipos(LIMITE, offset);
        int total = EIR.contarEquipos();
        return new EquipoInventarioResponse(equipos, total);
    }

    /**
     * Busca equipos de inventario que coincidan con un texto y devuelve los
     * resultados de una página determinada.
     *
     * @param textoBusqueda texto que se desea buscar.
     * @param pagina número de página.
     * @return equipos encontrados y cantidad total de coincidencias.
     */
    public EquipoInventarioResponse buscarEquipos(
            String textoBusqueda,
            int pagina
    ) {

        if (pagina < 1) {
            throw new IllegalArgumentException("La página debe ser mayor o igual a 1."
            );
        }
        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto de búsqueda no puede estar vacío.");
        }
        int offset = (pagina - 1) * LIMITE;
        List<EquipoInventarioModel> equipos
                = EIR.buscarEquipos(
                        textoBusqueda,
                        LIMITE,
                        offset
                );
        int total = EIR.contarEquiposBusqueda(textoBusqueda);
        return new EquipoInventarioResponse(equipos, total);
    }
}
