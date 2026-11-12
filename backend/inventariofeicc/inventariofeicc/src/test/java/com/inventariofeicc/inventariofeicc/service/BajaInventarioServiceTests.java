package com.inventariofeicc.inventariofeicc.service;

import com.inventariofeicc.inventariofeicc.model.BajaInventarioRequest;
import com.inventariofeicc.inventariofeicc.model.BajaInventarioRequest.EquipoBaja;
import com.inventariofeicc.inventariofeicc.repository.BajaInventarioRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BajaInventarioServiceTests {

    @Mock
    private BajaInventarioRepository repositorio;
    private BajaInventarioService servicio;

    @BeforeEach
    void preparar() {
        servicio = new BajaInventarioService(repositorio);
    }

    private BajaInventarioRequest solicitud(List<EquipoBaja> equipos) {
        return new BajaInventarioRequest("Dictaminador", "0075", "FEI",
                LocalDate.of(2026, 1, 15), 3, equipos);
    }

    @Test
    void registraCadaEquipoConLosDatosDelFormatoYBloqueaEnOrden() {
        var primero = new EquipoBaja("INV-1", "Fuente dañada");
        var segundo = new EquipoBaja("INV-2", "Tarjeta dañada");
        var baja = solicitud(List.of(segundo, primero));
        when(repositorio.existeArticulo(3)).thenReturn(true);
        when(repositorio.bloquearEquipo(anyString())).thenReturn("ACTIVO");
        when(repositorio.registrarBaja(any(BajaInventarioRequest.class), nullable(String.class))).thenReturn(10);

        assertEquals(2, servicio.registrarBajas(baja));

        var orden = inOrder(repositorio);
        orden.verify(repositorio).existeArticulo(3);
        orden.verify(repositorio).bloquearEquipo("INV-1");
        orden.verify(repositorio).existeBaja("INV-1");
        orden.verify(repositorio).bloquearEquipo("INV-2");
        orden.verify(repositorio).existeBaja("INV-2");
        // Motivos distintos: la cabecera queda sin un motivo común.
        orden.verify(repositorio).registrarBaja(eq(baja), isNull());
        orden.verify(repositorio).registrarDetalle(10, 3, primero);
        orden.verify(repositorio).registrarDetalle(10, 3, segundo);
    }

    @Test
    void guardaElMotivoEnLaCabeceraCuandoTodosLosEquiposCompartenElMismo() {
        var primero = new EquipoBaja("INV-1", "Falla general");
        var segundo = new EquipoBaja("INV-2", "Falla general");
        var baja = solicitud(List.of(primero, segundo));
        when(repositorio.existeArticulo(3)).thenReturn(true);
        when(repositorio.bloquearEquipo(anyString())).thenReturn("ACTIVO");
        when(repositorio.registrarBaja(baja, "Falla general")).thenReturn(10);

        servicio.registrarBajas(baja);

        verify(repositorio).registrarBaja(baja, "Falla general");
        verify(repositorio).registrarDetalle(10, 3, primero);
        verify(repositorio).registrarDetalle(10, 3, segundo);
    }

    @Test
    void noInsertaNingunoSiOtroEquipoYaTieneBaja() {
        var baja = solicitud(List.of(new EquipoBaja("INV-1", "Falla"), new EquipoBaja("INV-2", "Falla")));
        when(repositorio.existeArticulo(3)).thenReturn(true);
        when(repositorio.bloquearEquipo(anyString())).thenReturn("ACTIVO");
        when(repositorio.existeBaja("INV-1")).thenReturn(false);
        when(repositorio.existeBaja("INV-2")).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> servicio.registrarBajas(baja));
        verify(repositorio, never()).registrarBaja(any(), any());
        verify(repositorio, never()).registrarDetalle(anyInt(), anyInt(), any());
    }

    @Test
    void rechazaEquipoEnProcesoDeBajaAunqueNoTengaRegistro() {
        when(repositorio.existeArticulo(3)).thenReturn(true);
        when(repositorio.bloquearEquipo("INV-1")).thenReturn("EN_PROCESO_DE_BAJA");

        assertThrows(IllegalStateException.class, () -> servicio.registrarBajas(
                solicitud(List.of(new EquipoBaja("INV-1", "Falla")))));
        verify(repositorio, never()).registrarBaja(any(), any());
        verify(repositorio, never()).registrarDetalle(anyInt(), anyInt(), any());
    }

    @Test
    void rechazaEquipoInexistente() {
        when(repositorio.existeArticulo(3)).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> servicio.registrarBajas(
                solicitud(List.of(new EquipoBaja("INV-1", "Falla")))));
        verify(repositorio, never()).registrarBaja(any(), any());
        verify(repositorio, never()).registrarDetalle(anyInt(), anyInt(), any());
    }

    @Test
    void rechazaDictamenInexistenteSinBloquearEquipos() {
        assertThrows(IllegalArgumentException.class, () -> servicio.registrarBajas(
                solicitud(List.of(new EquipoBaja("INV-1", "Falla")))));
        verify(repositorio, never()).bloquearEquipo(anyString());
    }

    @Test
    void rechazaEquiposRepetidosAntesDeConsultarLaBase() {
        var equipo = new EquipoBaja("INV-1", "Falla");
        assertThrows(IllegalArgumentException.class,
                () -> servicio.registrarBajas(solicitud(List.of(equipo, equipo))));
        verifyNoInteractions(repositorio);
    }

    @Test
    void exigeMotivoTecnicoPorEquipo() {
        assertThrows(IllegalArgumentException.class, () -> servicio.registrarBajas(
                solicitud(List.of(new EquipoBaja("INV-1", "  ")))));
        verifyNoInteractions(repositorio);
    }

    @Test
    void rechazaFormatoVacioODemasiadosEquipos() {
        assertThrows(IllegalArgumentException.class, () -> servicio.registrarBajas(solicitud(List.of())));
        var equipos = java.util.stream.IntStream.range(0, 11)
                .mapToObj(i -> new EquipoBaja("INV-" + i, "Falla")).toList();
        assertThrows(IllegalArgumentException.class, () -> servicio.registrarBajas(solicitud(equipos)));
        verifyNoInteractions(repositorio);
    }

    @Test
    void rechazaFechaFuturaYCamposQueExcedenLaTabla() {
        var equipos = List.of(new EquipoBaja("INV-1", "Falla"));
        assertThrows(IllegalArgumentException.class, () -> servicio.registrarBajas(
                new BajaInventarioRequest("Dictaminador", "0075", "FEI", LocalDate.of(2999, 1, 1), 3, equipos)));
        assertThrows(IllegalArgumentException.class, () -> servicio.registrarBajas(
                new BajaInventarioRequest("Dictaminador", "1".repeat(21), "FEI", LocalDate.of(2026, 1, 15), 3, equipos)));
        verifyNoInteractions(repositorio);
    }
}
