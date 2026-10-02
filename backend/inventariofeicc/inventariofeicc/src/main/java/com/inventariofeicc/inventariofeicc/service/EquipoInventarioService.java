package com.inventariofeicc.inventariofeicc.service;

import java.util.List;
import java.util.Set;

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

    private static final Set<String> Ubicaciones = Set.of(
          "CC1",
          "CC2",
          "CC3",
          "CC4",
          "AULA 4",
          "AULA 5",
          "AULA 6",
          "AULA 102",
          "AULA 105",
          "AULA 107",   
          "AULA 111",
          "AULA 112",
          "AULA 113",
          "AULA F101",
          "AULA F103",
          "AULA F402",
          "AULA F403",
          "CUBICULO_42",
          "CUBICULO_44",
          "AREA_COMUN_CC",
          "JEFATURA_CC",
          "LAB. INNOVACION EN SOFTWARE",
          "AUDIOVISUAL",
          "ALMACEN"
    );

    private static final Set<String> EstadosOperativos = Set.of(
          "ACTIVO",
          "EN_PROCESO_DE_BAJA",
          "PRESTAMO"
    );

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
    public EquipoInventarioResponse buscarEquipos(String textoBusqueda, int pagina) {
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

    /**
     * Registra un nuevo equipo en el inventario después de validar sus datos.
     * 
     * @param equipo // Objeto que contiene la información del equipo a registrar.
     */
    public void registrarNuevoEquipoService(EquipoInventarioModel equipo) {
        if(equipo.getNumeroInventario() == null || equipo.getNumeroInventario().isEmpty()) {
            throw new IllegalArgumentException("El número de inventario es obligatorio.");
        }
        if(equipo.getEstadoOperativo() == null || equipo.getEstadoOperativo().isEmpty()) {
            throw new IllegalArgumentException("El estado operativo es obligatorio.");
        }
        if(!EstadosOperativos.contains(equipo.getEstadoOperativo())) {
            throw new IllegalArgumentException("El estado operativo proporcionado no es válido.");
        }
        if(equipo.getUbicacion() == null || equipo.getUbicacion().isEmpty()) {
            throw new IllegalArgumentException("La ubicación es obligatoria.");
        }
        if(!Ubicaciones.contains(equipo.getUbicacion())) {
            throw new IllegalArgumentException("La ubicación proporcionada no es válida.");
        }
        if(equipo.getUrlImagen() == null || equipo.getUrlImagen().isEmpty()) {
            throw new IllegalArgumentException("La URL de la imagen es obligatoria.");
        }
        EIR.registrarEquipo(equipo);
    }
}
