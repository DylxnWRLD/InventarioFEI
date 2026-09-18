package com.inventariofeicc.inventariofeicc.model;

public class EquipoInventarioModel{

    private String numero_inventario;
    private String marca;
    private String descripcion;
    private String modelo;
    private String numero_activo;
    private String no_serial;
    private String tipo_equipo;
    private String estado_operativo;
    private String ubicacion;
    private String url_imagen;

    public EquipoInventarioModel(){}

    public EquipoInventarioModel(String numero_inventario, String marca, String descripcion, String modelo, String numero_activo, 
        String no_serial, String tipo_equipo, String estado_operativo, String ubicacion, String url_imagen){

        this.numero_inventario = numero_inventario;
        this.marca = marca;
        this.descripcion = descripcion;
        this.modelo = modelo;
        this.numero_activo = numero_activo;
        this.no_serial = no_serial;
        this.tipo_equipo = tipo_equipo;
        this.estado_operativo = estado_operativo;
        this.ubicacion = ubicacion;
        this.url_imagen = url_imagen;
    }
    
    public String getNumeroInventario() {
        return numero_inventario;
    }

    public void setNumeroInventario(String numeroInventario) {
        this.numero_inventario = numeroInventario;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public String getNumeroActivo() {
        return numero_activo;
    }

    public void setNumeroActivo(String numeroActivo) {
        this.numero_activo = numeroActivo;
    }

    public String getNoSerial() {
        return no_serial;
    }

    public void setNoSerial(String noSerial) {
        this.no_serial = noSerial;
    }

    public String getTipoEquipo() {
        return tipo_equipo;
    }

    public void setTipoEquipo(String tipoEquipo) {
        this.tipo_equipo = tipoEquipo;
    }

    public String getEstadoOperativo() {
        return estado_operativo;
    }

    public void setEstadoOperativo(String estadoOperativo) {
        this.estado_operativo = estadoOperativo;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public String getUrlImagen() {
        return url_imagen;
    }

    public void setUrlImagen(String urlImagen) {
        this.url_imagen = urlImagen;
    }
}