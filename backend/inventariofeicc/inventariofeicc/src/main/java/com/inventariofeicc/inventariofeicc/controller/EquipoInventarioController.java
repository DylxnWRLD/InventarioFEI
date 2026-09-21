package com.inventariofeicc.inventariofeicc.controller;

import com.inventariofeicc.inventariofeicc.model.EquipoInventarioModel;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.inventariofeicc.inventariofeicc.service.EquipoInventarioService;
import com.inventariofeicc.inventariofeicc.repository.EquipoInventarioRepository;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/InventarioFEI")
@CrossOrigin(origins = "*")
public class EquipoInventarioController {
    
    public final EquipoInventarioService IFS;
    public final EquipoInventarioRepository EIR;

    public EquipoInventarioController(EquipoInventarioService IFS, EquipoInventarioRepository EIR){
        this.IFS = IFS;
        this.EIR = EIR;
    }

    @GetMapping("/Equipos")
    public ResponseEntity<?> listaEquipos(){
        try{
            List<EquipoInventarioModel> Equipos = EIR.obtenerEquipos();
            return ResponseEntity.ok(Equipos);
            
        } catch (IllegalArgumentException iae) {
            // CAPTURA EL ERROR QUE SE MANDA DESDE EL SERVICE
            return ResponseEntity.badRequest().body(iae.getMessage());

        } catch (Exception e) {
            // ERROR POR SI LA BASE DE DATOS TIENE ALGUN PROBLEMA
            return ResponseEntity.internalServerError().body("Ocurrió un error al listar los equipos.");
        }
    }
}