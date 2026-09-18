package com.inventariofeicc.inventariofeicc.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import com.inventariofeicc.inventariofeicc.model.EquipoInventarioModel;
import java.util.List;

/**
 * Aqui se realizarán todas las consultas a la base de datos relacionadas con el equipo de inventario.
 * Todo con la ayuda de la dependencia de MyBatis, que nos permite mapear las consultas SQL a métodos de Java.
 */
@Mapper 
public interface EquipoInventarioRepository {
    
    @Select ("SELECT * FROM equipo_inventario")
    List<EquipoInventarioModel> obtenerEquipos();
}
