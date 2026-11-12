package com.inventariofeicc.inventariofeicc.repository;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.inventariofeicc.inventariofeicc.model.BajaInventarioRequest;

@Mapper
public interface BajaInventarioRepository {

    @Select("""
        SELECT EXISTS (
            SELECT 1 FROM inventariofei.catalogo_dictamen WHERE id_articulo = #{idArticulo}
        )
        """)
    boolean existeArticulo(@Param("idArticulo") int idArticulo);

    // El bloqueo se conserva hasta terminar la transacción de todos los equipos.
    @Select("""
        SELECT estado_operativo::text FROM inventariofei.equipo_inventario
        WHERE numero_inventario = #{numeroInventario}
        FOR UPDATE
        """)
    String bloquearEquipo(@Param("numeroInventario") String numeroInventario);

    @Select("""
        SELECT EXISTS (
            SELECT 1 FROM inventariofei.baja_inventario_detalle
            WHERE numero_inventario = #{numeroInventario}
        )
        """)
    boolean existeBaja(@Param("numeroInventario") String numeroInventario);

    /*
     * La baja es el evento principal y se registra una sola vez por solicitud.
     * RETURNING permite recuperar el id generado sin una consulta adicional.
     * created_at usa su valor por defecto.
     */
    @Select("""
        INSERT INTO inventariofei.baja_inventario (
            fecha_baja, motivo_tecnico_baja, dictaminador, ur, unidad_responsable_origen
        ) VALUES (
            #{baja.fechaBaja}, #{motivoTecnicoBaja}, #{baja.dictaminador},
            #{baja.ur}, #{baja.unidadResponsableOrigen}
        )
        RETURNING id_baja
        """)
    int registrarBaja(@Param("baja") BajaInventarioRequest baja,
            @Param("motivoTecnicoBaja") String motivoTecnicoBaja);

    /*
     * Cada detalle relaciona un equipo con el evento de baja. El trigger
     * actualizar_estado_baja() se ejecuta después de este INSERT.
     */
    @Insert("""
        INSERT INTO inventariofei.baja_inventario_detalle (
            id_baja, numero_inventario, id_articulo, motivo_tecnico_baja
        ) VALUES (
            #{idBaja}, #{equipo.numeroInventario}, #{idArticulo},
            #{equipo.motivoTecnicoBaja}
        )
        """)
    void registrarDetalle(@Param("idBaja") int idBaja,
            @Param("idArticulo") int idArticulo,
            @Param("equipo") BajaInventarioRequest.EquipoBaja equipo);
}
