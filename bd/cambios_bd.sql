-- =========================
-- SCRIPT DE MIGRACIÓN
-- Actualiza la estructura de las tablas para el nuevo diseño de procesos
-- =========================

-- PASO 1: Modificar la tabla stakeholders
-- Eliminar columnas id_proceso e id_subproceso (esto también elimina las foreign keys)
SET @sql1 = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() AND table_name = 'stakeholders' AND column_name = 'id_proceso') > 0,
    'ALTER TABLE stakeholders DROP COLUMN id_proceso',
    'SELECT "Column id_proceso does not exist"');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @sql2 = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() AND table_name = 'stakeholders' AND column_name = 'id_subproceso') > 0,
    'ALTER TABLE stakeholders DROP COLUMN id_subproceso',
    'SELECT "Column id_subproceso does not exist"');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- PASO 2: Modificar la tabla procesos
-- Agregar columna id_stakeholder
SET @sql3 = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() AND table_name = 'procesos' AND column_name = 'id_stakeholder') = 0,
    'ALTER TABLE procesos ADD COLUMN id_stakeholder INT NULL AFTER id_proyecto',
    'SELECT "Column id_stakeholder already exists"');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Cambiar tipo de columna departamentos a TEXT
ALTER TABLE procesos MODIFY COLUMN departamentos TEXT;

-- Eliminar columnas peso y plazos_clave
SET @sql4 = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() AND table_name = 'procesos' AND column_name = 'peso') > 0,
    'ALTER TABLE procesos DROP COLUMN peso',
    'SELECT "Column peso does not exist"');
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

SET @sql5 = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() AND table_name = 'procesos' AND column_name = 'plazos_clave') > 0,
    'ALTER TABLE procesos DROP COLUMN plazos_clave',
    'SELECT "Column plazos_clave does not exist"');
PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

-- Agregar columna pasos_clave
SET @sql6 = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() AND table_name = 'procesos' AND column_name = 'pasos_clave') = 0,
    'ALTER TABLE procesos ADD COLUMN pasos_clave TEXT AFTER departamentos',
    'SELECT "Column pasos_clave already exists"');
PREPARE stmt6 FROM @sql6;
EXECUTE stmt6;
DEALLOCATE PREPARE stmt6;

-- Agregar foreign key hacia stakeholders (si no existe)
SET @sql7 = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE table_schema = DATABASE() AND table_name = 'procesos' AND constraint_name = 'fk_procesos_stakeholder') = 0,
    'ALTER TABLE procesos ADD CONSTRAINT fk_procesos_stakeholder FOREIGN KEY (id_stakeholder) REFERENCES stakeholders(id_stakeholder) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "Foreign key fk_procesos_stakeholder already exists"');
PREPARE stmt7 FROM @sql7;
EXECUTE stmt7;
DEALLOCATE PREPARE stmt7;

-- PASO 3: Modificar la tabla subprocesos
-- Agregar columna id_stakeholder
SET @sql8 = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = DATABASE() AND table_name = 'subprocesos' AND column_name = 'id_stakeholder') = 0,
    'ALTER TABLE subprocesos ADD COLUMN id_stakeholder INT NULL AFTER id_proceso',
    'SELECT "Column id_stakeholder already exists"');
PREPARE stmt8 FROM @sql8;
EXECUTE stmt8;
DEALLOCATE PREPARE stmt8;

-- Agregar foreign key hacia stakeholders (si no existe)
SET @sql9 = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE table_schema = DATABASE() AND table_name = 'subprocesos' AND constraint_name = 'fk_subprocesos_stakeholder') = 0,
    'ALTER TABLE subprocesos ADD CONSTRAINT fk_subprocesos_stakeholder FOREIGN KEY (id_stakeholder) REFERENCES stakeholders(id_stakeholder) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "Foreign key fk_subprocesos_stakeholder already exists"');
PREPARE stmt9 FROM @sql9;
EXECUTE stmt9;
DEALLOCATE PREPARE stmt9;

-- =========================
-- VERIFICACIÓN (opcional)
-- Ejecuta estos comandos para verificar la estructura
-- =========================

-- Ver estructura de procesos
-- DESCRIBE procesos;

-- Ver estructura de subprocesos
-- DESCRIBE subprocesos;

-- Ver estructura de stakeholders
-- DESCRIBE stakeholders;
