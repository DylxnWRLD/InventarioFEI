package com.inventariofeicc.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * Aqui se realizarán todas las consultas a la base de datos relacionadas con el equipo de inventario.
 * Todo con la ayuda de la dependencia de MyBatis, que nos permite mapear las consultas SQL a métodos de Java.
 */
@Mapper 
public interface EquipoInventarioRepository {
    
    @Select ("SELECT descripcion FROM equipo_inventario WHERE numero_inventario = 'N00131257'")
    String obtenerDescripcion();
}
