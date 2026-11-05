package com.inventariofeicc.inventariofeicc.service;

import com.inventariofeicc.inventariofeicc.model.BajaInventarioRequest;
import com.inventariofeicc.inventariofeicc.model.BajaInventarioRequest.EquipoBaja;
import com.inventariofeicc.inventariofeicc.repository.BajaInventarioRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BajaInventarioService {

    private final BajaInventarioRepository repositorio;

    public BajaInventarioService(BajaInventarioRepository repositorio) {
        this.repositorio = repositorio;
    }

    /** Registra el formato completo; cualquier error revierte todas las bajas. */
    @Transactional
    public int registrarBajas(BajaInventarioRequest baja) {
        validarSolicitud(baja);
        if (!repositorio.existeArticulo(baja.idArticulo())) {
            throw new IllegalArgumentException("El dictamen seleccionado no existe.");
        }

        // Un orden común evita bloqueos cruzados entre solicitudes simultáneas.
        var equiposOrdenados = baja.equipos().stream()
                .sorted(Comparator.comparing(EquipoBaja::numeroInventario)).toList();
        for (EquipoBaja equipo : equiposOrdenados) {
            String numero = equipo.numeroInventario();
            String estado = repositorio.bloquearEquipo(numero);
            if (estado == null) {
                throw new IllegalArgumentException("No existe el equipo " + numero + ".");
            }
            if ("EN_PROCESO_DE_BAJA".equals(estado) || repositorio.existeBaja(numero)) {
                throw new IllegalStateException("El equipo " + numero + " ya tiene una baja registrada.");
            }
        }
        for (EquipoBaja equipo : equiposOrdenados) {
            repositorio.registrarBaja(baja, equipo);
        }
        return equiposOrdenados.size();
    }

    private void validarSolicitud(BajaInventarioRequest baja) {
        if (baja == null) {
            throw new IllegalArgumentException("La información de la baja es obligatoria.");
        }
        validarTexto(baja.dictaminador(), "El dictaminador", 150);
        validarTexto(baja.ur(), "La UR", 20);
        validarTexto(baja.unidadResponsableOrigen(), "La unidad responsable de origen", 150);
        if (baja.fechaBaja() == null || baja.fechaBaja().isAfter(
                LocalDate.now(ZoneId.of("America/Mexico_City")))) {
            throw new IllegalArgumentException("La fecha de baja es obligatoria y no puede ser futura.");
        }
        if (baja.idArticulo() == null || baja.idArticulo() <= 0) {
            throw new IllegalArgumentException("Debes seleccionar un dictamen válido.");
        }
        if (baja.equipos() == null || baja.equipos().isEmpty() || baja.equipos().size() > 10) {
            throw new IllegalArgumentException("Debes seleccionar entre 1 y 10 equipos.");
        }
        Set<String> numeros = new HashSet<>();
        for (EquipoBaja equipo : baja.equipos()) {
            if (equipo == null) {
                throw new IllegalArgumentException("La información de cada equipo es obligatoria.");
            }
            validarTexto(equipo.numeroInventario(), "El número de inventario", 50);
            if (!numeros.add(equipo.numeroInventario())) {
                throw new IllegalArgumentException("El formato contiene equipos repetidos.");
            }
            if (equipo.motivoTecnicoBaja() == null || equipo.motivoTecnicoBaja().isBlank()) {
                throw new IllegalArgumentException(
                        "Falta el motivo técnico de baja del equipo " + equipo.numeroInventario() + ".");
            }
        }
    }

    private void validarTexto(String valor, String nombre, int maximo) {
        if (valor == null || valor.isBlank() || valor.length() > maximo) {
            throw new IllegalArgumentException(nombre + " es obligatorio y admite hasta " + maximo + " caracteres.");
        }
    }
}
