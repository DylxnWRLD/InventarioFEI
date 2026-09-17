package com.inventariofeicc.inventariofeicc;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper 
public interface ProductoRepository {
    
    @Select ("SELECT descripcion FROM equipo_inventario WHERE numero_inventario = 'N00131257'")
    String obtenerDescripcion();
}
