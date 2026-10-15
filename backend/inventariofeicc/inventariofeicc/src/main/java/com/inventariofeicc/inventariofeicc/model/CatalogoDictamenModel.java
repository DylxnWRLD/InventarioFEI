package com.inventariofeicc.inventariofeicc.model;

/**
 * Modelo de datos que representa un articulo del catalogo de dictamen.
 *
 * Contiene el supuesto del articulo 54 del Reglamento para el Control de
 * Bienes Muebles e Inmuebles que sirve como motivo tecnico de baja.
 *
 * @author Dyl y Momen
 */
public class CatalogoDictamenModel {

    private int id_articulo;
    private String articulo;

    /**
     * Constructor por defecto para instanciacion sin argumentos.
     */
    public CatalogoDictamenModel() {
    }

    /**
     * Constructor completo para inicializar las propiedades de un articulo.
     *
     * @param id_articulo identificador unico del articulo en el catalogo.
     * @param articulo texto completo del supuesto que se aplica a la baja.
     */
    public CatalogoDictamenModel(int id_articulo, String articulo) {
        this.id_articulo = id_articulo;
        this.articulo = articulo;
    }

    public int getIdArticulo() {
        return id_articulo;
    }

    public void setIdArticulo(int id_articulo) {
        this.id_articulo = id_articulo;
    }

    public String getArticulo() {
        return articulo;
    }

    public void setArticulo(String articulo) {
        this.articulo = articulo;
    }
}
