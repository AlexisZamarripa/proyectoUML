CREATE DATABASE  IF NOT EXISTS `graficacion` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `graficacion`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: graficacion
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `documentos`
--

DROP TABLE IF EXISTS `documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentos` (
  `id_documento` int NOT NULL AUTO_INCREMENT,
  `titulo_analisis` varchar(150) DEFAULT NULL,
  `tipo_documento` varchar(100) DEFAULT NULL,
  `nombre_documento` varchar(150) DEFAULT NULL,
  `tipo_archivo` enum('pdf','word','excel') DEFAULT NULL,
  `url_ubicacion` text,
  `descripcion_documento` text,
  `hallazgos` text,
  `recomendaciones` text,
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `id_subproceso` int NOT NULL,
  `fuente` varchar(255) DEFAULT NULL,
  `documentos_json` longtext,
  PRIMARY KEY (`id_documento`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_proceso` (`id_proceso`),
  KEY `id_subproceso` (`id_subproceso`),
  CONSTRAINT `documentos_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `documentos_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `documentos_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentos`
--

LOCK TABLES `documentos` WRITE;
/*!40000 ALTER TABLE `documentos` DISABLE KEYS */;
INSERT INTO `documentos` VALUES (3,'asd','asd','informe2.pdf','pdf','/uploads/documentos/1774116920770-781247322.pdf','asd','[\"asd\"]','asd',1,1,10,'asd','[{\"nombre\":\"informe2.pdf\",\"tipo\":\"PDF\",\"url\":\"/uploads/documentos/1774116920770-781247322.pdf\",\"descripcion\":\"asd\"}]');
/*!40000 ALTER TABLE `documentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuestas`
--

DROP TABLE IF EXISTS `encuestas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encuestas` (
  `id_encuesta` int NOT NULL AUTO_INCREMENT,
  `titulo_encuesta` varchar(150) DEFAULT NULL,
  `descripcion` text,
  `numero_participantes_esperados` int DEFAULT NULL,
  `id_proyecto` int NOT NULL,
  `id_proceso` int DEFAULT NULL,
  `id_subproceso` int DEFAULT NULL,
  PRIMARY KEY (`id_encuesta`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_proceso` (`id_proceso`),
  KEY `id_subproceso` (`id_subproceso`),
  CONSTRAINT `encuestas_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `encuestas_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `encuestas_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuestas`
--

LOCK TABLES `encuestas` WRITE;
/*!40000 ALTER TABLE `encuestas` DISABLE KEYS */;
INSERT INTO `encuestas` VALUES (6,'asjdbaksjdb','kajsdb',1,1,NULL,NULL);
/*!40000 ALTER TABLE `encuestas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entrevistas`
--

DROP TABLE IF EXISTS `entrevistas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrevistas` (
  `id_entrevista` int NOT NULL AUTO_INCREMENT,
  `titulo_entrevista` varchar(150) DEFAULT NULL,
  `entrevistador` varchar(150) DEFAULT NULL,
  `entrevistado` varchar(150) DEFAULT NULL,
  `notas_contexto` text,
  `id_proyecto` int NOT NULL,
  `id_proceso` int DEFAULT NULL,
  `id_subproceso` int DEFAULT NULL,
  PRIMARY KEY (`id_entrevista`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_proceso` (`id_proceso`),
  KEY `id_subproceso` (`id_subproceso`),
  CONSTRAINT `entrevistas_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `entrevistas_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `entrevistas_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrevistas`
--

LOCK TABLES `entrevistas` WRITE;
/*!40000 ALTER TABLE `entrevistas` DISABLE KEYS */;
INSERT INTO `entrevistas` VALUES (6,'entre','aosid','asd','laknsd',1,NULL,NULL);
/*!40000 ALTER TABLE `entrevistas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `focus_group`
--

DROP TABLE IF EXISTS `focus_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `focus_group` (
  `id_focus` int NOT NULL AUTO_INCREMENT,
  `nombre_focus` varchar(150) DEFAULT NULL,
  `descripcion` text,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `modalidad` enum('presencial','virtual','hibrido') DEFAULT NULL,
  `lugar` varchar(200) DEFAULT NULL,
  `moderador` varchar(150) DEFAULT NULL,
  `numero_participantes` int DEFAULT NULL,
  `conclusiones` text,
  `estado` enum('planificacion','en_progreso','pausado','completado') DEFAULT NULL,
  `id_proyecto` int NOT NULL,
  PRIMARY KEY (`id_focus`),
  KEY `id_proyecto` (`id_proyecto`),
  CONSTRAINT `focus_group_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `focus_group`
--

LOCK TABLES `focus_group` WRITE;
/*!40000 ALTER TABLE `focus_group` DISABLE KEYS */;
INSERT INTO `focus_group` VALUES (2,'focus group','prueba','2026-03-03','2026-03-04','virtual','zoom','yo',1,'no se','en_progreso',1);
/*!40000 ALTER TABLE `focus_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historias_usuario`
--

DROP TABLE IF EXISTS `historias_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historias_usuario` (
  `id_historia` int NOT NULL AUTO_INCREMENT,
  `titulo_historia` varchar(150) DEFAULT NULL,
  `rol` varchar(100) DEFAULT NULL,
  `quiero` text,
  `para_que` text,
  `prioridad` enum('baja','media','alta') DEFAULT NULL,
  `estimacion` varchar(20) DEFAULT NULL,
  `criterios_aceptacion` text,
  `id_proyecto` int NOT NULL,
  `id_proceso` int DEFAULT NULL,
  `id_subproceso` int DEFAULT NULL,
  PRIMARY KEY (`id_historia`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_proceso` (`id_proceso`),
  KEY `id_subproceso` (`id_subproceso`),
  CONSTRAINT `historias_usuario_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `historias_usuario_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `historias_usuario_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historias_usuario`
--

LOCK TABLES `historias_usuario` WRITE;
/*!40000 ALTER TABLE `historias_usuario` DISABLE KEYS */;
INSERT INTO `historias_usuario` VALUES (2,'hsitoria','asd','asdasd','asd','baja','2','asd | 123',1,NULL,NULL);
/*!40000 ALTER TABLE `historias_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `observaciones`
--

DROP TABLE IF EXISTS `observaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `observaciones` (
  `id_observacion` int NOT NULL AUTO_INCREMENT,
  `nota_rapida` text,
  `titulo` varchar(150) DEFAULT NULL,
  `observaciones` text,
  `hallazgos_puntos_clave` text,
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `id_subproceso` int NOT NULL,
  PRIMARY KEY (`id_observacion`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_proceso` (`id_proceso`),
  KEY `id_subproceso` (`id_subproceso`),
  CONSTRAINT `observaciones_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `observaciones_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `observaciones_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `observaciones`
--

LOCK TABLES `observaciones` WRITE;
/*!40000 ALTER TABLE `observaciones` DISABLE KEYS */;
INSERT INTO `observaciones` VALUES (3,NULL,'observaciones','asd','',1,1,7);
/*!40000 ALTER TABLE `observaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pasos_proceso`
--

DROP TABLE IF EXISTS `pasos_proceso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pasos_proceso` (
  `id_paso` int NOT NULL AUTO_INCREMENT,
  `id_seguimiento` int DEFAULT NULL,
  `nombre_paso` varchar(100) DEFAULT NULL,
  `duracion` varchar(100) DEFAULT NULL,
  `problemas_identificados` text,
  `metricas` text,
  `responsable` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_paso`),
  KEY `id_seguimiento` (`id_seguimiento`),
  CONSTRAINT `pasos_proceso_ibfk_1` FOREIGN KEY (`id_seguimiento`) REFERENCES `seguimiento` (`id_seguimiento`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pasos_proceso`
--

LOCK TABLES `pasos_proceso` WRITE;
/*!40000 ALTER TABLE `pasos_proceso` DISABLE KEYS */;
/*!40000 ALTER TABLE `pasos_proceso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preguntas_encuesta`
--

DROP TABLE IF EXISTS `preguntas_encuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preguntas_encuesta` (
  `id_pregunta` int NOT NULL AUTO_INCREMENT,
  `id_encuesta` int DEFAULT NULL,
  `pregunta` text,
  `tipo_pregunta` enum('texto_abierto','opcion_multiple','escala','si_no') DEFAULT NULL,
  PRIMARY KEY (`id_pregunta`),
  KEY `id_encuesta` (`id_encuesta`),
  CONSTRAINT `preguntas_encuesta_ibfk_1` FOREIGN KEY (`id_encuesta`) REFERENCES `encuestas` (`id_encuesta`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preguntas_encuesta`
--

LOCK TABLES `preguntas_encuesta` WRITE;
/*!40000 ALTER TABLE `preguntas_encuesta` DISABLE KEYS */;
INSERT INTO `preguntas_encuesta` VALUES (5,6,'kajsdb','texto_abierto');
/*!40000 ALTER TABLE `preguntas_encuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preguntas_entrevista`
--

DROP TABLE IF EXISTS `preguntas_entrevista`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preguntas_entrevista` (
  `id_pregunta` int NOT NULL AUTO_INCREMENT,
  `id_entrevista` int DEFAULT NULL,
  `pregunta` text,
  `respuesta` text,
  PRIMARY KEY (`id_pregunta`),
  KEY `id_entrevista` (`id_entrevista`),
  CONSTRAINT `preguntas_entrevista_ibfk_1` FOREIGN KEY (`id_entrevista`) REFERENCES `entrevistas` (`id_entrevista`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preguntas_entrevista`
--

LOCK TABLES `preguntas_entrevista` WRITE;
/*!40000 ALTER TABLE `preguntas_entrevista` DISABLE KEYS */;
INSERT INTO `preguntas_entrevista` VALUES (11,6,'pregunta1','holaa'),(12,6,'pregunta2','hola1asdasd');
/*!40000 ALTER TABLE `preguntas_entrevista` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `procesos`
--

DROP TABLE IF EXISTS `procesos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procesos` (
  `id_proceso` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `nombre_proceso` varchar(150) DEFAULT NULL,
  `descripcion` text,
  `color` varchar(30) DEFAULT NULL,
  `peso` int DEFAULT NULL,
  `departamentos` varchar(150) DEFAULT NULL,
  `plazos_clave` date DEFAULT NULL,
  `id_stakeholder` int DEFAULT NULL,
  `pasos_clave` json DEFAULT NULL,
  PRIMARY KEY (`id_proceso`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_stakeholder` (`id_stakeholder`),
  CONSTRAINT `procesos_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `procesos_ibfk_2` FOREIGN KEY (`id_stakeholder`) REFERENCES `stakeholders` (`id_stakeholder`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procesos`
--

LOCK TABLES `procesos` WRITE;
/*!40000 ALTER TABLE `procesos` DISABLE KEYS */;
INSERT INTO `procesos` VALUES (1,1,'alexis','nose','blue',NULL,'[]',NULL,NULL,'[]');
/*!40000 ALTER TABLE `procesos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proyectos`
--

DROP TABLE IF EXISTS `proyectos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proyectos` (
  `id_proyecto` int NOT NULL AUTO_INCREMENT,
  `nombre_proyecto` varchar(150) NOT NULL,
  `descripcion` text,
  `fecha_inicio` date DEFAULT NULL,
  `estado` enum('planificacion','en_progreso','pausado','completado') DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id_proyecto`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proyectos`
--

LOCK TABLES `proyectos` WRITE;
/*!40000 ALTER TABLE `proyectos` DISABLE KEYS */;
INSERT INTO `proyectos` VALUES (1,'alexis','primero','2026-02-12','en_progreso','pink');
/*!40000 ALTER TABLE `proyectos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `respuestas_encuesta`
--

DROP TABLE IF EXISTS `respuestas_encuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `respuestas_encuesta`
--

LOCK TABLES `respuestas_encuesta` WRITE;
/*!40000 ALTER TABLE `respuestas_encuesta` DISABLE KEYS */;
INSERT INTO `respuestas_encuesta` VALUES (4,5,6,6,'holaaakjbas','2026-03-21 11:03:40');
/*!40000 ALTER TABLE `respuestas_encuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seguimiento`
--

DROP TABLE IF EXISTS `seguimiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seguimiento` (
  `id_seguimiento` int NOT NULL AUTO_INCREMENT,
  `titulo_seguimiento` varchar(150) DEFAULT NULL,
  `id_transaccion` varchar(100) DEFAULT NULL,
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `id_subproceso` int NOT NULL,
  `nombre_proceso` varchar(255) DEFAULT NULL,
  `proceso_vinculado` varchar(255) DEFAULT NULL,
  `subproceso_nombre` varchar(255) DEFAULT NULL,
  `problemas_json` longtext,
  `metricas_json` longtext,
  `fecha_creacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_seguimiento`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_proceso` (`id_proceso`),
  KEY `id_subproceso` (`id_subproceso`),
  CONSTRAINT `seguimiento_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `seguimiento_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `seguimiento_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seguimiento`
--

LOCK TABLES `seguimiento` WRITE;
/*!40000 ALTER TABLE `seguimiento` DISABLE KEYS */;
/*!40000 ALTER TABLE `seguimiento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stakeholders`
--

DROP TABLE IF EXISTS `stakeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stakeholders` (
  `id_stakeholder` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int DEFAULT NULL,
  `id_proceso` int DEFAULT NULL,
  `id_subproceso` int DEFAULT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `rol` varchar(100) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `contacto` varchar(150) DEFAULT NULL,
  `notas` text,
  `color` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id_stakeholder`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_proceso` (`id_proceso`),
  KEY `id_subproceso` (`id_subproceso`),
  CONSTRAINT `stakeholders_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `stakeholders_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `stakeholders_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stakeholders`
--

LOCK TABLES `stakeholders` WRITE;
/*!40000 ALTER TABLE `stakeholders` DISABLE KEYS */;
INSERT INTO `stakeholders` VALUES (2,1,NULL,NULL,'stakeholder','nose','nose','nose','nose','pink');
/*!40000 ALTER TABLE `stakeholders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subproceso_documento`
--

DROP TABLE IF EXISTS `subproceso_documento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subproceso_documento` (
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `id_subproceso` int NOT NULL,
  `id_documento` int NOT NULL,
  PRIMARY KEY (`id_subproceso`,`id_documento`),
  KEY `idx_proyecto` (`id_proyecto`),
  KEY `idx_proceso` (`id_proceso`),
  KEY `idx_documento` (`id_documento`),
  CONSTRAINT `subproceso_documento_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_documento_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_documento_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_documento_ibfk_4` FOREIGN KEY (`id_documento`) REFERENCES `documentos` (`id_documento`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subproceso_documento`
--

LOCK TABLES `subproceso_documento` WRITE;
/*!40000 ALTER TABLE `subproceso_documento` DISABLE KEYS */;
/*!40000 ALTER TABLE `subproceso_documento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subproceso_encuesta`
--

DROP TABLE IF EXISTS `subproceso_encuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subproceso_encuesta` (
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `id_subproceso` int NOT NULL,
  `id_encuesta` int NOT NULL,
  PRIMARY KEY (`id_subproceso`,`id_encuesta`),
  KEY `idx_proyecto` (`id_proyecto`),
  KEY `idx_proceso` (`id_proceso`),
  KEY `idx_encuesta` (`id_encuesta`),
  CONSTRAINT `subproceso_encuesta_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_encuesta_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_encuesta_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_encuesta_ibfk_4` FOREIGN KEY (`id_encuesta`) REFERENCES `encuestas` (`id_encuesta`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subproceso_encuesta`
--

LOCK TABLES `subproceso_encuesta` WRITE;
/*!40000 ALTER TABLE `subproceso_encuesta` DISABLE KEYS */;
INSERT INTO `subproceso_encuesta` VALUES (1,1,6,6);
/*!40000 ALTER TABLE `subproceso_encuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subproceso_entrevista`
--

DROP TABLE IF EXISTS `subproceso_entrevista`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subproceso_entrevista` (
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `id_subproceso` int NOT NULL,
  `id_entrevista` int NOT NULL,
  PRIMARY KEY (`id_subproceso`,`id_entrevista`),
  KEY `idx_proyecto` (`id_proyecto`),
  KEY `idx_proceso` (`id_proceso`),
  KEY `idx_entrevista` (`id_entrevista`),
  CONSTRAINT `subproceso_entrevista_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_entrevista_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_entrevista_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_entrevista_ibfk_4` FOREIGN KEY (`id_entrevista`) REFERENCES `entrevistas` (`id_entrevista`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subproceso_entrevista`
--

LOCK TABLES `subproceso_entrevista` WRITE;
/*!40000 ALTER TABLE `subproceso_entrevista` DISABLE KEYS */;
INSERT INTO `subproceso_entrevista` VALUES (1,1,7,6);
/*!40000 ALTER TABLE `subproceso_entrevista` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subproceso_focus`
--

DROP TABLE IF EXISTS `subproceso_focus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subproceso_focus` (
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `id_subproceso` int NOT NULL,
  `id_focus` int NOT NULL,
  PRIMARY KEY (`id_subproceso`,`id_focus`),
  KEY `idx_proyecto` (`id_proyecto`),
  KEY `idx_proceso` (`id_proceso`),
  KEY `idx_focus` (`id_focus`),
  CONSTRAINT `subproceso_focus_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_focus_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_focus_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_focus_ibfk_4` FOREIGN KEY (`id_focus`) REFERENCES `focus_group` (`id_focus`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subproceso_focus`
--

LOCK TABLES `subproceso_focus` WRITE;
/*!40000 ALTER TABLE `subproceso_focus` DISABLE KEYS */;
INSERT INTO `subproceso_focus` VALUES (1,1,10,2);
/*!40000 ALTER TABLE `subproceso_focus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subproceso_historia`
--

DROP TABLE IF EXISTS `subproceso_historia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subproceso_historia` (
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `id_subproceso` int NOT NULL,
  `id_historia` int NOT NULL,
  PRIMARY KEY (`id_subproceso`,`id_historia`),
  KEY `idx_proyecto` (`id_proyecto`),
  KEY `idx_proceso` (`id_proceso`),
  KEY `idx_historia` (`id_historia`),
  CONSTRAINT `subproceso_historia_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_historia_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_historia_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_historia_ibfk_4` FOREIGN KEY (`id_historia`) REFERENCES `historias_usuario` (`id_historia`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subproceso_historia`
--

LOCK TABLES `subproceso_historia` WRITE;
/*!40000 ALTER TABLE `subproceso_historia` DISABLE KEYS */;
INSERT INTO `subproceso_historia` VALUES (1,1,8,2);
/*!40000 ALTER TABLE `subproceso_historia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subproceso_observacion`
--

DROP TABLE IF EXISTS `subproceso_observacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subproceso_observacion` (
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `id_subproceso` int NOT NULL,
  `id_observacion` int NOT NULL,
  PRIMARY KEY (`id_subproceso`,`id_observacion`),
  KEY `idx_proyecto` (`id_proyecto`),
  KEY `idx_proceso` (`id_proceso`),
  KEY `idx_observacion` (`id_observacion`),
  CONSTRAINT `subproceso_observacion_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_observacion_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_observacion_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_observacion_ibfk_4` FOREIGN KEY (`id_observacion`) REFERENCES `observaciones` (`id_observacion`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subproceso_observacion`
--

LOCK TABLES `subproceso_observacion` WRITE;
/*!40000 ALTER TABLE `subproceso_observacion` DISABLE KEYS */;
INSERT INTO `subproceso_observacion` VALUES (1,1,13,3);
/*!40000 ALTER TABLE `subproceso_observacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subproceso_seguimiento`
--

DROP TABLE IF EXISTS `subproceso_seguimiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subproceso_seguimiento` (
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `id_subproceso` int NOT NULL,
  `id_seguimiento` int NOT NULL,
  PRIMARY KEY (`id_subproceso`,`id_seguimiento`),
  KEY `idx_proyecto` (`id_proyecto`),
  KEY `idx_proceso` (`id_proceso`),
  KEY `idx_seguimiento` (`id_seguimiento`),
  CONSTRAINT `subproceso_seguimiento_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_seguimiento_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_seguimiento_ibfk_3` FOREIGN KEY (`id_subproceso`) REFERENCES `subprocesos` (`id_subproceso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subproceso_seguimiento_ibfk_4` FOREIGN KEY (`id_seguimiento`) REFERENCES `seguimiento` (`id_seguimiento`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subproceso_seguimiento`
--

LOCK TABLES `subproceso_seguimiento` WRITE;
/*!40000 ALTER TABLE `subproceso_seguimiento` DISABLE KEYS */;
/*!40000 ALTER TABLE `subproceso_seguimiento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subprocesos`
--

DROP TABLE IF EXISTS `subprocesos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subprocesos` (
  `id_subproceso` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `id_proceso` int NOT NULL,
  `nombre_subproceso` varchar(150) DEFAULT NULL,
  `descripcion` text,
  `id_stakeholder` int DEFAULT NULL,
  PRIMARY KEY (`id_subproceso`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_proceso` (`id_proceso`),
  KEY `fk_subproceso_stakeholder` (`id_stakeholder`),
  CONSTRAINT `fk_subproceso_stakeholder` FOREIGN KEY (`id_stakeholder`) REFERENCES `stakeholders` (`id_stakeholder`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `subprocesos_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subprocesos_ibfk_2` FOREIGN KEY (`id_proceso`) REFERENCES `procesos` (`id_proceso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subprocesos`
--

LOCK TABLES `subprocesos` WRITE;
/*!40000 ALTER TABLE `subprocesos` DISABLE KEYS */;
INSERT INTO `subprocesos` VALUES (6,1,1,'kasjbd','kajsb',NULL),(7,1,1,'entrevista','asldnjn',NULL),(8,1,1,'historiaUsuario','asd',NULL),(10,1,1,'Focus group','prueba',NULL),(13,1,1,'observaciones','asdih',2);
/*!40000 ALTER TABLE `subprocesos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-14 21:26:44
