/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.inventariofeicc.inventariofeicc.model;

import java.time.LocalDate;
import java.util.List;

/**
 *
 * @author Dylxn
 */

public record PrestamoRequest(
    String nombreEntrega,
    String identificador,
    String dependencia,
    String nombreRecibe,
    LocalDate fecha,
    String justificacion,
    String nombreTitular,
    List<String> equipos
) {}