package com.inventariofeicc.inventariofeicc.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import com.inventariofeicc.inventariofeicc.model.CatalogoDictamenModel;

/**
 * Repositorio MyBatis para la consulta del catalogo de dictamen.
 *
 * Provee metodos de acceso a datos para obtener los articulos del supuesto
 * del articulo 54 que se usan como motivos tecnicos de baja.
 *
 * @author Dyl y Momen
 */
@Mapper
public interface CatalogoDictamenRepository {

    /**
     * Obtiene todos los articulos del catalogo de dictamen ordenados de forma
     * ascendente por su identificador.
     *
     * @return lista de articulos del catalogo de dictamen.
     */
    @Select("""
        SELECT id_articulo, articulo
        FROM inventariofei.catalogo_dictamen
        ORDER BY id_articulo ASC
        """)
    List<CatalogoDictamenModel> obtenerCatalogoDictamen();
}
