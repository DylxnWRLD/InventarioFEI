/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.inventariofeicc.inventariofeicc.service;

import com.inventariofeicc.inventariofeicc.model.PrestamoRequest;
import com.inventariofeicc.inventariofeicc.repository.PrestamoRepository;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 *
 * @author Dylxn
 */

@Service
public class PrestamoService {

    private final PrestamoRepository repository;

    public PrestamoService(PrestamoRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Long registrarPrestamo(PrestamoRequest datos) {

        validarDatos(datos);

        // Ordenar los equipos y evitar duplicados
        List<String> equipos = datos.equipos().stream()
                .map(String::trim)
                .sorted()
                .toList();

        if (new HashSet<>(equipos).size() != equipos.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Hay equipos duplicados."
            );
        }

        // Verificar disponibilidad
        for (String numero : equipos) {
            String estado = repository.obtenerEstadoEquipo(numero);

            if (!"ACTIVO".equals(estado)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "El equipo " + numero + " no está disponible."
                );
            }
        }

        // Registrar préstamo y obtener su ID
        Long idPrestamo = repository.insertarPrestamo(datos);

        // Asociar equipos y actualizar estados
        for (String numero : equipos) {

            repository.insertarDetalle(idPrestamo, numero);

            if (repository.actualizarEstado(numero) != 1) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "No se pudo actualizar el equipo " + numero
                );
            }
        }

        return idPrestamo;
    }

    private void validarDatos(PrestamoRequest datos) {

        if (datos == null || datos.equipos() == null
                || datos.equipos().isEmpty()
                || datos.equipos().size() > 14) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debes seleccionar entre 1 y 14 equipos."
            );
        }

        for (String numero : datos.equipos()) {
            validarTexto(numero, 50, "Número de inventario");
        }

        validarTexto(datos.nombreEntrega(), 150, "Nombre de entrega");
        validarTexto(datos.identificador(), 20, "Identificador");
        validarTexto(datos.dependencia(), 150, "Dependencia");
        validarTexto(datos.nombreRecibe(), 150, "Nombre de quien recibe");
        validarTexto(datos.justificacion(), 5000, "Justificación");
        validarTexto(datos.nombreTitular(), 150, "Nombre del titular");

        if (!datos.identificador().trim().matches("[0-9]+")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El identificador debe contener solo números."
            );
        }

        if (datos.fecha() == null || datos.fecha().isAfter(
                LocalDate.now(ZoneId.of("America/Mexico_City")))) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Fecha de préstamo inválida."
            );
        }
    }

    private void validarTexto(String valor, int maximo, String campo) {

        if (valor == null || valor.isBlank()
                || valor.trim().length() > maximo) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Campo inválido: " + campo
            );
        }
    }
}
