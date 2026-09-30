package com.inventariofeicc.inventariofeicc.model;

import java.util.List;

/**
 * Respuesta utilizada para devolver los equipos de una página junto con la
 * cantidad total de registros.
 *
 * @author Dyl y Momen
 */
public class EquipoInventarioResponse {

    private List<EquipoInventarioModel> equipos;
    private int total;

    /**
     * Constructor de la respuesta.
     *
     * @param equipos lista de equipos.
     * @param total cantidad total de equipos.
     */
    public EquipoInventarioResponse(List<EquipoInventarioModel> equipos, int total) {
        this.equipos = equipos;
        this.total = total;
    }

    public List<EquipoInventarioModel> getEquipos() {
        return equipos;
    }

    public void setEquipos(List<EquipoInventarioModel> equipos) {
        this.equipos = equipos;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }
}
