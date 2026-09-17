package com.inventariofeicc.inventariofeicc;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class InventariofeiccApplication {

	public static void main(String[] args) {
		SpringApplication.run(InventariofeiccApplication.class, args);
	}

	@Bean
    CommandLineRunner probarMyBatis(ProductoRepository productoRepository) {
        return args -> {
            System.out.println("=====================================================");
            String versionPostgres = productoRepository.obtenerDescripcion();
            System.out.println("Versión de PostgreSQL vía MyBatis: " + versionPostgres);
            System.out.println("=====================================================");
        };
    }
}
