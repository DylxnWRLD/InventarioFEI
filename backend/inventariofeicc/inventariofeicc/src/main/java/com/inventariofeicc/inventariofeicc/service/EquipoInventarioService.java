package com.inventariofeicc.inventariofeicc.service;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.inventariofeicc.inventariofeicc.model.EquipoInventarioModel;
import com.inventariofeicc.inventariofeicc.model.EquipoInventarioResponse;
import com.inventariofeicc.inventariofeicc.repository.EquipoInventarioRepository;

/**
 * Servicio encargado de gestionar las operaciones relacionadas con los equipos
 * de inventario.
 *
 * @author Dylan y Gustavo
 */
@Service
public class EquipoInventarioService {

    /**
     * Caracteres permitidos para los identificadores de equipos.
     */
    private static final String CARACTERES_IDENTIFICADORES
            = "^[A-Za-z0-9_/-]+$";

    /**
     * Caracteres permitidos para los campos de texto.
     */
    private static final String CARACTERES_TEXTO
            = "^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9_ ./()-]+$";

    /**
     * Ubicaciones válidas para los equipos de inventario.
     */
    private static final Set<String> UBICACIONES = Set.of(
            "CC1",
            "CC2",
            "CC3",
            "CC4",
            "AULA 4",
            "AULA 5",
            "AULA 6",
            "AULA 102",
            "AULA 103",
            "AULA 105",
            "AULA 106",
            "AULA 107",
            "AULA 111",
            "AULA 112",
            "AULA 113",
            "AULA F101",
            "AULA F102",
            "AULA F103",
            "AULA F402",
            "AULA F403",
            "AULA F404",
            "CUBICULO_42",
            "CUBICULO_44",
            "AREA_COMUN_CC",
            "JEFATURA_CC",
            "LAB. INNOVACION EN SOFTWARE",
            "AUDIOVISUAL",
            "ALMACEN"
    );

    /**
     * Estados operativos permitidos para los equipos.
     */
    private static final Set<String> ESTADOS_OPERATIVOS = Set.of(
            "ACTIVO",
            "EN_PROCESO_DE_BAJA",
            "PRESTAMO"
    );

    /**
     * Cantidad máxima de equipos por página.
     */
    private static final int LIMITE = 30;

    /**
     * Repositorio para el acceso a los datos de inventario.
     */
    private final EquipoInventarioRepository EIR;

    /**
     * Constructor para la inyección del repositorio.
     *
     * @param EIR repositorio de equipos de inventario.
     */
    public EquipoInventarioService(EquipoInventarioRepository EIR) {
        this.EIR = EIR;
    }

    /**
     * Obtiene una lista paginada de equipos.
     *
     * @param pagina número de página solicitado.
     * @return equipos encontrados y total de registros.
     * @throws IllegalArgumentException si la página es inválida.
     */
    public EquipoInventarioResponse obtenerEquipos(int pagina) {

        if (pagina < 1) {
            throw new IllegalArgumentException("El número de página debe ser mayor o igual a 1");
        }
        int offset = (pagina - 1) * LIMITE;
        List<EquipoInventarioModel> equipos = EIR.obtenerEquipos(LIMITE, offset);
        int total = EIR.contarEquipos();
        return new EquipoInventarioResponse(equipos, total);
    }

    /**
     * Busca equipos mediante un texto de búsqueda.
     *
     * @param textoBusqueda texto utilizado para la búsqueda.
     * @param pagina número de página solicitado.
     * @return equipos coincidentes y total de resultados.
     * @throws IllegalArgumentException si los parámetros son inválidos.
     */
    public EquipoInventarioResponse buscarEquipos(String textoBusqueda, int pagina) {

        if (pagina < 1) {
            throw new IllegalArgumentException("La página debe ser mayor o igual a 1");
        }

        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto de búsqueda no puede estar vacío.");
        }

        int offset = (pagina - 1) * LIMITE;
        String textoNormalizado = textoBusqueda.trim();

        List<EquipoInventarioModel> equipos = EIR.buscarEquipos(
                        textoNormalizado,
                        LIMITE,
                        offset
                );

        int total = EIR.contarEquiposBusqueda(textoNormalizado);
        return new EquipoInventarioResponse(equipos, total);
    }

    /**
     * Obtiene un equipo mediante su número de inventario.
     *
     * @param numeroInventario número de inventario del equipo.
     * @return equipo encontrado o null si no existe.
     * @throws IllegalArgumentException si el número es inválido.
     */
    public EquipoInventarioModel obtenerEquipoPorNumeroInventario(String numeroInventario) {

        if (numeroInventario == null || numeroInventario.isBlank()) {
            throw new IllegalArgumentException("El número de inventario es obligatorio.");
        }

        return EIR.obtenerEquipoPorNumeroInventario(numeroInventario.trim());
    }

    /**
     * Valida y registra un nuevo equipo de inventario.
     *
     * @param equipo información del equipo que se desea registrar.
     * @throws IllegalArgumentException si los datos son inválidos o el equipo
     * ya existe.
     */
    public void registrarNuevoEquipoService(EquipoInventarioModel equipo) {

        if (equipo == null) {
            throw new IllegalArgumentException("La información del equipo es obligatoria.");
        }

        if (equipo.getNumeroInventario() == null || equipo.getNumeroInventario().isBlank()) {
            throw new IllegalArgumentException("El número de inventario es obligatorio.");
        }

        int noInventarioIgual = EIR.verificarNumeroInventarioExistente(equipo.getNumeroInventario() );

        if (noInventarioIgual > 0) {
            throw new IllegalArgumentException("El número de inventario ya existe en la base de datos.");
        }

        if (!equipo.getNumeroInventario().matches(CARACTERES_IDENTIFICADORES)) {
            throw new IllegalArgumentException( "El número de inventario contiene caracteres no permitidos.");
        }

        if (equipo.getNoSerial() != null && !equipo.getNoSerial().isEmpty() && !equipo.getNoSerial().matches(CARACTERES_TEXTO)) {
            throw new IllegalArgumentException("El número de serie contiene caracteres no permitidos.");
        }

        int noSerialIgual = EIR.verificarNumeroSerieExistente(equipo.getNoSerial());

        if (noSerialIgual > 0) {
            throw new IllegalArgumentException("El número de serie ya existe en la base de datos.");
        }

        if (equipo.getMarca() != null && !equipo.getMarca().isEmpty() && !equipo.getMarca().matches(CARACTERES_TEXTO)) {
            throw new IllegalArgumentException("La marca contiene caracteres no permitidos.");
        }

        if (equipo.getModelo() != null && !equipo.getModelo().isEmpty()&& !equipo.getModelo().matches(CARACTERES_TEXTO)) {
            throw new IllegalArgumentException("El modelo contiene caracteres no permitidos.");
        }

        if (equipo.getEstadoOperativo() == null || equipo.getEstadoOperativo().isBlank()) {
            throw new IllegalArgumentException( "El estado operativo es obligatorio.");
        }

        if (!ESTADOS_OPERATIVOS.contains(equipo.getEstadoOperativo())) {
            throw new IllegalArgumentException("El estado operativo proporcionado no es válido.");
        }

        if (equipo.getUbicacion() == null || equipo.getUbicacion().isBlank()) {

            throw new IllegalArgumentException("La ubicación es obligatoria.");
        }

        if (!UBICACIONES.contains(equipo.getUbicacion())) {
            throw new IllegalArgumentException("La ubicación proporcionada no es válida." );
        }

        if (equipo.getUrlImagen() == null || equipo.getUrlImagen().isBlank()) {
            throw new IllegalArgumentException("Se necesita una imagen para dar de alta al equipo.");
        }

        // Registrar equipo
        EIR.registrarEquipo(equipo);
    }
}
