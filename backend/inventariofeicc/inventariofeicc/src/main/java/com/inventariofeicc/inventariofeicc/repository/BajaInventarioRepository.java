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
            SELECT 1 FROM inventariofei.baja_inventario
            WHERE numero_inventario = #{numeroInventario}
        )
        """)
    boolean existeBaja(@Param("numeroInventario") String numeroInventario);

    // created_at usa su valor por defecto y el trigger actualiza el estado del equipo.
    @Insert("""
        INSERT INTO inventariofei.baja_inventario (
            numero_inventario, dictaminador, ur, unidad_responsable_origen,
            fecha_baja, motivo_tecnico_baja, id_articulo
        ) VALUES (
            #{equipo.numeroInventario}, #{baja.dictaminador}, #{baja.ur},
            #{baja.unidadResponsableOrigen}, #{baja.fechaBaja},
            #{equipo.motivoTecnicoBaja}, #{baja.idArticulo}
        )
        """)
    void registrarBaja(@Param("baja") BajaInventarioRequest baja,
            @Param("equipo") BajaInventarioRequest.EquipoBaja equipo);
}
