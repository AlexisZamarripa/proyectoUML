use graficacion;
ALTER TABLE procesos 
ADD COLUMN id_stakeholder INT,
ADD COLUMN pasos_clave JSON,
ADD FOREIGN KEY (id_stakeholder) REFERENCES stakeholders(id_stakeholder)
    ON DELETE SET NULL ON UPDATE CASCADE;
    
-- Columna faltante en subprocesos
ALTER TABLE subprocesos 
ADD COLUMN id_stakeholder INT NULL;

ALTER TABLE subprocesos
ADD CONSTRAINT fk_subproceso_stakeholder 
FOREIGN KEY (id_stakeholder) REFERENCES stakeholders(id_stakeholder)
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE documentos ADD COLUMN fuente VARCHAR(255) NULL;
describe documentos;
ALTER TABLE documentos ADD COLUMN documentos_json LONGTEXT NULL;
  
describe seguimiento;
ALTER TABLE seguimiento
  ADD COLUMN nombre_proceso VARCHAR(255) NULL,
  ADD COLUMN proceso_vinculado VARCHAR(255) NULL,
  ADD COLUMN subproceso_nombre VARCHAR(255) NULL,
  ADD COLUMN problemas_json LONGTEXT NULL,
  ADD COLUMN metricas_json LONGTEXT NULL,
  ADD COLUMN fecha_creacion DATETIME NULL;
  
describe pasos_proceso;
ALTER TABLE pasos_proceso ADD COLUMN responsable VARCHAR(255) NULL;

ALTER TABLE pasos_proceso MODIFY COLUMN duracion VARCHAR(100) NULL;

use graficacion;
CREATE TABLE `respuestas_encuesta` (
  `id_respuesta` int NOT NULL AUTO_INCREMENT,
  `id_pregunta` int NOT NULL,
  `id_encuesta` int NOT NULL,
  `id_subproceso` int NOT NULL,
  `respuesta` text,
  `fecha_respuesta` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_respuesta`),
  KEY `id_pregunta` (`id_pregunta`),
  KEY `id_encuesta` (`id_encuesta`),
  KEY `id_subproceso` (`id_subproceso`),
  CONSTRAINT `respuestas_ibfk_1` FOREIGN KEY (`id_pregunta`) REFERENCES `preguntas_encuesta` (`id_pregunta`) ON DELETE CASCADE,
  CONSTRAINT `respuestas_ibfk_2` FOREIGN KEY (`id_encuesta`) REFERENCES `encuestas` (`id_encuesta`) ON DELETE CASCADE,
  CONSTRAINT `respuestas_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE encuestas MODIFY id_proceso INT NULL;
ALTER TABLE encuestas MODIFY id_subproceso INT NULL;

ALTER TABLE entrevistas MODIFY id_proceso INT NULL;
ALTER TABLE entrevistas MODIFY id_subproceso INT NULL;
ALTER TABLE preguntas_entrevista ADD COLUMN respuesta TEXT NULL;