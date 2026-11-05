package com.inventariofeicc.inventariofeicc.model;

import java.time.LocalDate;
import java.util.List;

/** Datos comunes del formato y motivo técnico de cada equipo seleccionado. */
public record BajaInventarioRequest(
        String dictaminador,
        String ur,
        String unidadResponsableOrigen,
        LocalDate fechaBaja,
        Integer idArticulo,
        List<EquipoBaja> equipos
) {
    public record EquipoBaja(String numeroInventario, String motivoTecnicoBaja) {
    }
}
