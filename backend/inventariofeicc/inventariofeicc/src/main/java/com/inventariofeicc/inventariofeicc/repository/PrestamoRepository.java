/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.inventariofeicc.inventariofeicc.repository;

import com.inventariofeicc.inventariofeicc.model.PrestamoRequest;
import org.apache.ibatis.annotations.*;

/**
 *
 * @author Dylxn
 */

@Mapper
public interface PrestamoRepository {

    // Consultar y bloquear equipo
    @Select("""
        SELECT estado_operativo::text
        FROM inventariofei.equipo_inventario
        WHERE numero_inventario = #{numero}
        FOR UPDATE
        """)
    String obtenerEstadoEquipo(@Param("numero") String numero);

    // Registrar préstamo y devolver su ID
    @Select(value = """
        INSERT INTO inventariofei.prestamo_inventario (
            nombre_entrega,
            identificador_dependencia,
            dependencia,
            nombre_recibe,
            fecha_prestamo,
            justificacion,
            nombre_titular
        )
        VALUES (
            #{nombreEntrega},
            #{identificador},
            #{dependencia},
            #{nombreRecibe},
            #{fecha},
            #{justificacion},
            #{nombreTitular}
        )
        RETURNING id_prestamo
        """, affectData = true)
    @Options(flushCache = Options.FlushCachePolicy.TRUE)
    Long insertarPrestamo(PrestamoRequest datos);

    // Asociar equipo al préstamo
    @Insert("""
        INSERT INTO inventariofei.detalle_prestamo
        (id_prestamo, numero_inventario)
        VALUES (#{idPrestamo}, #{numero})
        """)
    int insertarDetalle(
        @Param("idPrestamo") Long idPrestamo,
        @Param("numero") String numero
    );

    // Actualizar estado operativo
    @Update("""
        UPDATE inventariofei.equipo_inventario
        SET estado_operativo = 'PRESTAMO'
        WHERE numero_inventario = #{numero}
          AND estado_operativo = 'ACTIVO'
        """)
    int actualizarEstado(@Param("numero") String numero);
}


