-- =========================
-- PROYECTOS
-- =========================
CREATE TABLE proyectos (
    id_proyecto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_proyecto VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    estado ENUM('planificacion','en_progreso','pausado','completado'),
    color VARCHAR(30)
);

-- =========================
-- STAKEHOLDERS
-- =========================
CREATE TABLE stakeholders (
    id_stakeholder INT AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    id_proyecto INT NULL,
    id_proceso INT  NULL,
    id_subproceso INT  NULL,

    -- Datos del stakeholder
    nombre_completo VARCHAR(150) NOT NULL,
    rol VARCHAR(100),
    area VARCHAR(100),
    contacto VARCHAR(150),
    notas TEXT,
    color VARCHAR(30),

    -- Llaves foráneas
FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
    ON DELETE SET NULL ON UPDATE CASCADE,  -- 👈 SET NULL porque es opcional
FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
    ON DELETE SET NULL ON UPDATE CASCADE   -- 👈 SET NULL porque es opcional
);

-- =========================
-- PROCESOS
-- =========================
CREATE TABLE procesos (
    id_proceso INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto INT NOT NULL,
    nombre_proceso VARCHAR(150),
    descripcion TEXT,
    color VARCHAR(30),
    peso INT,
    departamentos VARCHAR(150),
    plazos_clave DATE,
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================
-- SUBPROCESOS
-- =========================
CREATE TABLE subprocesos (
    id_subproceso INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    nombre_subproceso VARCHAR(150),
    descripcion TEXT,
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
    ON DELETE CASCADE ON UPDATE CASCADE);

-- =========================
-- ENTREVISTAS
-- =========================
CREATE TABLE entrevistas (
    id_entrevista INT AUTO_INCREMENT PRIMARY KEY,
    titulo_entrevista VARCHAR(150),
    entrevistador VARCHAR(150),
    entrevistado VARCHAR(150),
    notas_contexto TEXT,
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE preguntas_entrevista (
    id_pregunta INT AUTO_INCREMENT PRIMARY KEY,
    id_entrevista INT,
    pregunta TEXT,
FOREIGN KEY (id_entrevista) REFERENCES entrevistas(id_entrevista)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================
-- ENCUESTAS
-- =========================
CREATE TABLE encuestas (
    id_encuesta INT AUTO_INCREMENT PRIMARY KEY,
    titulo_encuesta VARCHAR(150),
    descripcion TEXT,
    numero_participantes_esperados INT,
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE preguntas_encuesta (
    id_pregunta INT AUTO_INCREMENT PRIMARY KEY,
    id_encuesta INT,
    pregunta TEXT,
    tipo_pregunta ENUM('texto_abierto','opcion_multiple','escala','si_no'),
FOREIGN KEY (id_encuesta) REFERENCES encuestas(id_encuesta)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================
-- OBSERVACIONES
-- =========================
CREATE TABLE observaciones (
    id_observacion INT AUTO_INCREMENT PRIMARY KEY,
    nota_rapida TEXT,
    titulo VARCHAR(150),
    observaciones TEXT,
    hallazgos_puntos_clave TEXT,
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================
-- FOCUS GROUP
-- =========================
CREATE TABLE focus_group (
    id_focus INT AUTO_INCREMENT PRIMARY KEY,
    nombre_focus VARCHAR(150),
    descripcion TEXT,
    fecha_inicio DATE,
    estado ENUM('planificacion','en_progreso','pausado','completado'),
    color VARCHAR(30),
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================
-- HISTORIAS DE USUARIO
-- =========================
CREATE TABLE historias_usuario (
    id_historia INT AUTO_INCREMENT PRIMARY KEY,
    titulo_historia VARCHAR(150),
    rol VARCHAR(100),
    quiero TEXT,
    para_que TEXT,
    prioridad ENUM('baja','media','alta'),
    estimacion VARCHAR(20),
    criterios_aceptacion TEXT,
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================
-- DOCUMENTOS
-- =========================
CREATE TABLE documentos (
    id_documento INT AUTO_INCREMENT PRIMARY KEY,
    titulo_analisis VARCHAR(150),
    tipo_documento VARCHAR(100),
    nombre_documento VARCHAR(150),
    tipo_archivo ENUM('pdf','word','excel'),
    url_ubicacion TEXT,
    descripcion_documento TEXT,
    hallazgos TEXT,
    recomendaciones TEXT,
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================
-- SEGUIMIENTO
-- =========================
CREATE TABLE seguimiento (
    id_seguimiento INT AUTO_INCREMENT PRIMARY KEY,
    titulo_seguimiento VARCHAR(150),
    id_transaccion VARCHAR(100),
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
    ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE pasos_proceso (
    id_paso INT AUTO_INCREMENT PRIMARY KEY,
    id_seguimiento INT,
    nombre_paso VARCHAR(100),
    duracion INT,
    problemas_identificados TEXT,
    metricas TEXT,
FOREIGN KEY (id_seguimiento) REFERENCES seguimiento(id_seguimiento)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================
-- SUBPROCESO ↔ HERRAMIENTA
-- =========================

CREATE TABLE subproceso_entrevista (
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
    id_entrevista INT NOT NULL,
    PRIMARY KEY (id_subproceso, id_entrevista),
    
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_entrevista) REFERENCES entrevistas(id_entrevista)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Índices adicionales para optimizar consultas
    INDEX idx_proyecto (id_proyecto),
    INDEX idx_proceso (id_proceso),
    INDEX idx_entrevista (id_entrevista)
);

CREATE TABLE subproceso_encuesta (
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
    id_encuesta INT NOT NULL,
    PRIMARY KEY (id_subproceso, id_encuesta),
    
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_encuesta) REFERENCES encuestas(id_encuesta)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_proyecto (id_proyecto),
    INDEX idx_proceso (id_proceso),
    INDEX idx_encuesta (id_encuesta)
);

CREATE TABLE subproceso_observacion (
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
    id_observacion INT NOT NULL,
    PRIMARY KEY (id_subproceso, id_observacion),
    
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_observacion) REFERENCES observaciones(id_observacion)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_proyecto (id_proyecto),
    INDEX idx_proceso (id_proceso),
    INDEX idx_observacion (id_observacion)
);

CREATE TABLE subproceso_focus (
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
    id_focus INT NOT NULL,
    PRIMARY KEY (id_subproceso, id_focus),
    
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_focus) REFERENCES focus_group(id_focus)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_proyecto (id_proyecto),
    INDEX idx_proceso (id_proceso),
    INDEX idx_focus (id_focus)
);

CREATE TABLE subproceso_historia (
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
    id_historia INT NOT NULL,
    PRIMARY KEY (id_subproceso, id_historia),
    
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_historia) REFERENCES historias_usuario(id_historia)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_proyecto (id_proyecto),
    INDEX idx_proceso (id_proceso),
    INDEX idx_historia (id_historia)
);

CREATE TABLE subproceso_documento (
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
    id_documento INT NOT NULL,
    PRIMARY KEY (id_subproceso, id_documento),
    
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_documento) REFERENCES documentos(id_documento)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_proyecto (id_proyecto),
    INDEX idx_proceso (id_proceso),
    INDEX idx_documento (id_documento)
);

CREATE TABLE subproceso_seguimiento (
    id_proyecto INT NOT NULL,
    id_proceso INT NOT NULL,
    id_subproceso INT NOT NULL,
    id_seguimiento INT NOT NULL,
    PRIMARY KEY (id_subproceso, id_seguimiento),
    
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_subproceso) REFERENCES subprocesos(id_subproceso)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_seguimiento) REFERENCES seguimiento(id_seguimiento)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_proyecto (id_proyecto),
    INDEX idx_proceso (id_proceso),
    INDEX idx_seguimiento (id_seguimiento)
);