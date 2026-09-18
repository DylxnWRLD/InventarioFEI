package com.inventariofeicc.inventariofeicc.model;

public class EquipoInventarioModel{

    private String numeroInventario;
    private String marca;
    private String descripcion;
    private String modelo;
    private String numeroActivo;
    private String noSerial;
    private String tipoEquipo;
    private String estadoOperativo;
    private String ubicacion;
    private String urlImagen;

    public EquipoInventarioModel(){}

    public EquipoInventarioModel(String numero_inventario, String marca, String descripcion, String modelo, String numero_activo, 
        String no_Serial, String tipo_Equipo, String estado_operativo, String ubicacion, String url_imagen){

        this.numeroInventario = numero_inventario;
        this.marca = marca;
        this.descripcion = descripcion;
        this.modelo = modelo;
        this.numeroActivo = numero_activo;
        this.noSerial = no_Serial;
        this.tipoEquipo = tipo_Equipo;
        this.estadoOperativo = estado_operativo;
        this.ubicacion = ubicacion;
        this.urlImagen = url_imagen;
    }
    
    public String getNumeroInventario() {
        return numeroInventario;
    }

    public void setNumeroInventario(String numeroInventario) {
        this.numeroInventario = numeroInventario;
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
        return numeroActivo;
    }

    public void setNumeroActivo(String numeroActivo) {
        this.numeroActivo = numeroActivo;
    }

    public String getNoSerial() {
        return noSerial;
    }

    public void setNoSerial(String noSerial) {
        this.noSerial = noSerial;
    }

    public String getTipoEquipo() {
        return tipoEquipo;
    }

    public void setTipoEquipo(String tipoEquipo) {
        this.tipoEquipo = tipoEquipo;
    }

    public String getEstadoOperativo() {
        return estadoOperativo;
    }

    public void setEstadoOperativo(String estadoOperativo) {
        this.estadoOperativo = estadoOperativo;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public String getUrlImagen() {
        return urlImagen;
    }

    public void setUrlImagen(String urlImagen) {
        this.urlImagen = urlImagen;
    }
}