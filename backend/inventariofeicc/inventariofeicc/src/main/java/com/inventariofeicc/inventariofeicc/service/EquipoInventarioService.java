package com.inventariofeicc.inventariofeicc.service;

import com.inventariofeicc.inventariofeicc.model.EquipoInventarioModel;
import com.inventariofeicc.inventariofeicc.repository.EquipoInventarioRepository;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * @author Dyl y Momen
 * Servicio encargado de manejar la lógica relacionada
 * con los equipos de inventario.
 */
@Service
public class EquipoInventarioService {

    private final EquipoInventarioRepository EIR;

    /**
     * Constructor del servicio.
     *
     * @param EIR repositorio encargado de realizar las consultas
     *           a la base de datos.
     */
    public EquipoInventarioService(EquipoInventarioRepository EIR) {
        this.EIR = EIR;
    }

    /**
     * Obtiene los equipos correspondientes a una página.
     *
     * Cada página contiene un máximo de 30 equipos.
     *
     * @param pagina número de página que se desea consultar.
     * @return lista de equipos correspondiente a la página.
     */
    public List<EquipoInventarioModel> obtenerEquipos(int pagina) {
        if (pagina < 1) {
            throw new IllegalArgumentException(
                "La página debe ser mayor o igual a 1."
            );
        }
        int limite = 30;
        int offset = (pagina - 1) * limite;
        return EIR.obtenerEquipos(limite, offset);
    }

    /**
     * Validaciones necesarias para realizar la busqueda
     * 
     * @param textoBusqueda
     * @param pagina
     * @return
     */
    public List<EquipoInventarioModel> buscarEquipos(String textoBusqueda, int pagina) {
        if (pagina < 1) {
            throw new IllegalArgumentException(
                "La página debe ser mayor o igual a 1."
            );
        }

        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "El texto de búsqueda no puede estar vacío."
            );
        }

        int limite = 30;
        int offset = (pagina - 1) * limite;
        return EIR.buscarEquipos(textoBusqueda, limite, offset);
    }
}