package com.inventariofeicc.inventariofeicc.repository;

import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.inventariofeicc.inventariofeicc.model.EquipoInventarioModel;

/**
 * Repositorio MyBatis para la persistencia y consulta de equipos de inventario.
 *
 * Provee metodos de acceso a datos para listados paginados y busquedas de
 * múltiples criterios sobre la tabla de equipos en la base de datos PostgreSQL.
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
        FROM inventariofei.equipo_inventario
        ORDER BY numero_inventario ASC
        LIMIT #{limite} OFFSET #{offset}
        """)
    List<EquipoInventarioModel> obtenerEquipos(
            @Param("limite") int limite,
            @Param("offset") int offset
    );

    /**
     * Obtiene la cantidad total de equipos registrados.
     *
     * @return cantidad total de equipos.
     */
    @Select("""
        SELECT COUNT(*)
        FROM inventariofei.equipo_inventario
        """)
    int contarEquipos();

    /**
     * Busca equipos de inventario que coincidan con un texto en diferentes
     * campos.
     *
     * @param textoBusqueda texto que se desea buscar.
     * @param limite cantidad máxima de resultados.
     * @param offset posición desde donde comenzar.
     * @return lista de equipos encontrados.
     */
    @Select("""
        SELECT *
        FROM inventariofei.equipo_inventario
        WHERE numero_inventario ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR marca ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR no_serial ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR modelo ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR descripcion ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR ubicacion::text ILIKE CONCAT('%', #{textoBusqueda}, '%')
        ORDER BY numero_inventario ASC
        LIMIT #{limite} OFFSET #{offset}
        """)
    List<EquipoInventarioModel> buscarEquipos(
            @Param("textoBusqueda") String textoBusqueda,
            @Param("limite") int limite,
            @Param("offset") int offset
    );

    /**
     * Obtiene la cantidad total de equipos que coinciden con el texto de
     * búsqueda.
     *
     * @param textoBusqueda texto que se desea buscar.
     * @return cantidad de resultados encontrados.
     */
    @Select("""
        SELECT COUNT(*)
        FROM inventariofei.equipo_inventario
        WHERE numero_inventario ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR marca ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR no_serial ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR modelo ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR descripcion ILIKE CONCAT('%', #{textoBusqueda}, '%')
           OR ubicacion::text ILIKE CONCAT('%', #{textoBusqueda}, '%')
        """)
    int contarEquiposBusqueda(
            @Param("textoBusqueda") String textoBusqueda
    );


    @Insert("""
        INSERT INTO inventariofei.equipo_inventario (
            numero_inventario,
            marca,
            no_serial,
            modelo,
            descripcion,
            ubicacion
        ) VALUES (
            #{equipo.numeroInventario},
            #{equipo.marca},
            #{equipo.noSerial},
            #{equipo.modelo},
            #{equipo.descripcion},
            #{equipo.ubicacion}
        )
        """)
        void registrarEquipo(EquipoInventarioModel equipo);
}
