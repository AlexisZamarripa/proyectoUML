-- =========================
-- FIX: Cambiar tipo de columnas para soportar archivos base64 grandes
-- =========================
-- PROBLEMA: Cuando subes archivos en el frontend, se convierten a base64 
-- que puede ser muy grande (1MB -> 1.3MB de texto). La columna TEXT solo 
-- soporta ~64KB, necesitamos LONGTEXT que soporta hasta 4GB.
--
-- EJECUTAR ESTE SCRIPT en tu base de datos existente
-- =========================

-- Cambiar documentos_json de TEXT a LONGTEXT
-- (Almacena array de documentos con archivos base64)
ALTER TABLE documentos 
MODIFY COLUMN documentos_json LONGTEXT;

-- Cambiar hallazgos de TEXT a LONGTEXT
-- (Por consistencia y por si contiene mucho contenido)
ALTER TABLE documentos 
MODIFY COLUMN hallazgos LONGTEXT;

-- Cambiar url_ubicacion de TEXT a LONGTEXT también
-- (Por si se guarda un archivo base64 individual)
ALTER TABLE documentos 
MODIFY COLUMN url_ubicacion LONGTEXT;

-- Verificar los cambios
DESCRIBE documentos;

-- Deberías ver:
-- documentos_json: longtext
-- hallazgos: longtext
-- url_ubicacion: longtext
