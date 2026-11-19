package com.inventariofeicc.inventariofeicc.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;

import tools.jackson.databind.cfg.CoercionAction;
import tools.jackson.databind.cfg.CoercionInputShape;

/**
 * Configuración de serialización JSON.
 *
 * Permite que una fecha de registro vacía llegue como null en lugar de
 * provocar un error de deserialización al mapper.
 *
 * @author Dyl y Momen
 */
@Configuration
public class JacksonConfig {

    /**
     * Interpreta cadenas vacías o con solo espacios como null para fechas.
     *
     * @return personalizador del mapper JSON.
     */
    @Bean
    public JsonMapperBuilderCustomizer fechaVaciaComoNull() {
        return builder -> builder.withCoercionConfig(
                LocalDate.class,
                config -> config
                        .setAcceptBlankAsEmpty(true)
                        .setCoercion(CoercionInputShape.EmptyString, CoercionAction.AsNull)
        );
    }

}
