/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.inventariofeicc.inventariofeicc.controller;

import com.inventariofeicc.inventariofeicc.model.PrestamoRequest;
import com.inventariofeicc.inventariofeicc.service.PrestamoService;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 *
 * @author Dylxn
 */
@RestController
@RequestMapping("/Prestamo")
public class PrestamoController {

    private final PrestamoService service;

    public PrestamoController(PrestamoService service) {
        this.service = service;
    }

    @PostMapping("/Equipos")
    public ResponseEntity<Map<String, Object>> registrar(@RequestBody PrestamoRequest datos) {
        Long id = service.registrarPrestamo(datos);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of("mensaje", "Préstamo registrado correctamente.", "idPrestamo", id)
        );
    }
}
