package com.inventariofeicc.inventariofeicc.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import com.inventariofeicc.inventariofeicc.model.EquipoInventarioModel;
import java.util.List;
import org.apache.ibatis.annotations.Param;

/**
 * 
 * @author Dyl y Momen
 */

@Mapper
public interface EquipoInventarioRepository {

    /**
     * Obtiene una cantidad limitada de equipos de inventario comenzando desde
     * un desplazamiento determinado.
     *
     * @param limite cantidad máxima de equipos a obtener.
     * @param offset posición desde donde comenzar a obtener equipos.
     * @return lista de equipos de inventario.
     */
    @Select("""
        SELECT *
        FROM equipo_inventario
        ORDER BY numero_inventario ASC
        LIMIT #{limite} OFFSET #{offset}
        """)
    List<EquipoInventarioModel> obtenerEquipos(
            @Param("limite") int limite,
            @Param("offset") int offset
    );


    /**
     * Busqueda de equipos de inventario que coincidan con un texto de búsqueda en varios campos.
     * 
     * @param textoBusqueda
     * @param limite
     * @param offset
     * @return
     */
    @Select ("""
        SELECT *
        FROM equipo_inventario
        WHERE numero_inventario ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR marca ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR modelo ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR ubicacion::text ILIKE CONCAT('%', #{textoBusqueda}, '%')
        ORDER BY numero_inventario ASC
        LIMIT #{limite} OFFSET #{offset}
        """)
    List<EquipoInventarioModel> buscarEquipos(
            @Param("textoBusqueda") String textoBusqueda,
            @Param("limite") int limite,
            @Param("offset") int offset
    );
}
