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