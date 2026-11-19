package com.inventariofeicc.inventariofeicc.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.inventariofeicc.inventariofeicc.model.EquipoInventarioModel;
import com.inventariofeicc.inventariofeicc.repository.EquipoInventarioRepository;

/**
 * Pruebas del número de activo opcional en alta y edición.
 *
 * @author Dyl y Momen
 */
@ExtendWith(MockitoExtension.class)
class EquipoInventarioServiceTests {

    @Mock
    private EquipoInventarioRepository repositorio;

    private EquipoInventarioService servicio;

    @BeforeEach
    void preparar() {
        servicio = new EquipoInventarioService(repositorio);
    }

    @Test
    void numeroActivoVacioSeGuardaComoNullEnElAlta() {
        when(repositorio.verificarNumeroInventarioExistente("INV-1")).thenReturn(0);
        when(repositorio.verificarNumeroSerieExistente(null)).thenReturn(0);

        servicio.registrarNuevoEquipoService(equipoBase("   "));

        ArgumentCaptor<EquipoInventarioModel> captor = ArgumentCaptor.forClass(EquipoInventarioModel.class);
        verify(repositorio).registrarEquipo(captor.capture());
        assertNull(captor.getValue().getNumeroActivo());
    }

    @Test
    void numeroActivoVacioSeGuardaComoNullEnLaEdicion() {
        when(repositorio.obtenerEquipoPorNumeroInventario("INV-1"))
                .thenReturn(equipoBase("ACT-1"));

        EquipoInventarioModel cambios = equipoBase("   ");
        servicio.actualizarEquipoService("INV-1", cambios);

        ArgumentCaptor<EquipoInventarioModel> captor = ArgumentCaptor.forClass(EquipoInventarioModel.class);
        verify(repositorio).actualizarEquipo(any(), captor.capture());
        assertNull(captor.getValue().getNumeroActivo());
    }

    @Test
    void numeroActivoValidoSeConservaRecortado() {
        when(repositorio.verificarNumeroInventarioExistente("INV-1")).thenReturn(0);
        when(repositorio.verificarNumeroSerieExistente(null)).thenReturn(0);

        servicio.registrarNuevoEquipoService(equipoBase("  ACT-123  "));

        ArgumentCaptor<EquipoInventarioModel> captor = ArgumentCaptor.forClass(EquipoInventarioModel.class);
        verify(repositorio).registrarEquipo(captor.capture());
        assertEquals("ACT-123", captor.getValue().getNumeroActivo());
    }

    private EquipoInventarioModel equipoBase(String numeroActivo) {
        EquipoInventarioModel equipo = new EquipoInventarioModel();
        equipo.setNumeroInventario("INV-1");
        equipo.setNumeroActivo(numeroActivo);
        equipo.setTipoEquipo("Equipo de Cómputo");
        equipo.setEstadoOperativo("ACTIVO");
        equipo.setUbicacion("ALMACEN");
        equipo.setUrlImagen("https://idsdkpdonldeaqrfcttq.supabase.co/storage/v1/object/public/equipos_inventario/equipos/defecto2.png");
        return equipo;
    }

}
