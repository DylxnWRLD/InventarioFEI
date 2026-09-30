/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.inventariofeicc.inventariofeicc.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuracion de seguridad web para el sistema de inventario.
 *
 * Define los filtros de seguridad y las reglas de autorizacion de peticiones
 * HTTP mediante Spring Security.
 *
 * @author dyl
 */
@Configuration
public class SecurityConfig {

    /**
     * Configura la cadena de filtros de seguridad de la aplicacion.
     *
     * Deshabilita la proteccion CSRF (Cross-Site Request Forgery) y se habilita
     * el acceso publico sin restricciones a todas las rutas y recursos.
     *
     * @param http instancia de HttpSecurity empleada para construir las reglas
     * de seguridad.
     * @return la cadena de filtros de seguridad configurada.
     * @throws Exception si se produce un error durante la construccion de la
     * cadena de filtros.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
                );
        return http.build();
    }
}
