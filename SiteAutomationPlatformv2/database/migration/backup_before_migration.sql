-- MySQL dump 10.13  Distrib 9.3.0, for Linux (x86_64)
--
-- Host: localhost    Database: avancement2
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `equipment_categories`
--

DROP TABLE IF EXISTS `equipment_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `category_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_code` (`category_code`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_categories`
--

LOCK TABLES `equipment_categories` WRITE;
/*!40000 ALTER TABLE `equipment_categories` DISABLE KEYS */;
INSERT INTO `equipment_categories` VALUES (1,'AERO','Aérotherme','Systèmes de chauffage aérotherme'),(2,'CLIM_IR','Climatisation IR','Climatisation avec télécommande infrarouge'),(3,'CLIM_WIRE','Climatisation Filaire','Climatisation avec contrôle filaire'),(4,'ROOFTOP','Rooftop','Unités de toit climatisation/chauffage'),(5,'LIGHTING','Éclairage','Systèmes d\'éclairage intérieur/extérieur'),(6,'AERO_EAU','Aérotherme Eau','Systèmes de chauffage aérotherme à eau'),(7,'AERO_GAZ','Aérotherme Gaz','Systèmes de chauffage aérotherme à gaz'),(8,'CLIM_FILAIRE_SIMPLE','Climatisation Filaire Simple','Climatisation filaire individuelle'),(9,'CLIM_FILAIRE_GROUPE','Climatisation Filaire Groupe','Climatisation filaire en groupe'),(10,'COMPTAGE_FROID','Comptage Froid','Systèmes de comptage de froid'),(11,'COMPTAGE_ECLAIRAGE','Comptage Éclairage','Systèmes de comptage éclairage'),(12,'ECLAIRAGE_GENERAL','Éclairage Général','Systèmes d\'éclairage général');
/*!40000 ALTER TABLE `equipment_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_configs`
--

DROP TABLE IF EXISTS `equipment_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_id` int NOT NULL,
  `category_id` int NOT NULL,
  `quantity_total` int DEFAULT '0',
  `quantity_ir` int DEFAULT '0',
  `quantity_wire` int DEFAULT '0',
  `zones` text COLLATE utf8mb4_unicode_ci,
  `equipment_types` text COLLATE utf8mb4_unicode_ci,
  `has_thermostat` tinyint(1) DEFAULT '0',
  `has_remote_control` tinyint(1) DEFAULT '0',
  `has_modbus` tinyint(1) DEFAULT '0',
  `has_electrical_panel` tinyint(1) DEFAULT '0',
  `has_timer` tinyint(1) DEFAULT '0',
  `operational_status` enum('operational','maintenance','out_of_service','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'operational',
  `maintenance_status` enum('up_to_date','required','overdue','not_applicable') COLLATE utf8mb4_unicode_ci DEFAULT 'not_applicable',
  `comments` text COLLATE utf8mb4_unicode_ci,
  `telecomande_modbus_rooftop` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_rooftop_1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_rooftop_2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_rooftop_3` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pos_x` float DEFAULT NULL,
  `pos_y` float DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_site_category` (`site_id`,`category_id`),
  KEY `idx_site_id` (`site_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_equipment_configs_site_category` (`site_id`,`category_id`),
  CONSTRAINT `equipment_configs_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `equipment_configs_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `equipment_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_configs`
--

LOCK TABLES `equipment_configs` WRITE;
/*!40000 ALTER TABLE `equipment_configs` DISABLE KEYS */;
INSERT INTO `equipment_configs` VALUES (1,7,1,5,0,0,'Zone A, Zone B, Zone C','Type 1, Type 2',1,0,0,1,0,'operational','up_to_date','Test comment for Aero',NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(2,7,2,3,3,0,'Zone X, Zone Y','Split, Cassette',0,0,0,1,0,'operational','required','Test comment for Clim',NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(3,7,3,2,0,2,'Zone X, Zone Y','Split, Cassette',0,0,0,1,0,'operational','required','Test comment for Clim',NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(4,7,4,2,0,0,'Main Zone, North, South','Type RT1, Type RT2',1,0,1,1,0,'operational','not_applicable','Test comment for Rooftop','Modbus RTU','Type RT2',NULL,NULL,NULL,NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58');
/*!40000 ALTER TABLE `equipment_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_references`
--

DROP TABLE IF EXISTS `equipment_references`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_references` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_id` int NOT NULL,
  `reference_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serial_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `installation_zone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `installation_date` date DEFAULT NULL,
  `position_index` int DEFAULT '0',
  `technical_specs` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `condition_rating` enum('excellent','good','fair','poor','needs_replacement') COLLATE utf8mb4_unicode_ci DEFAULT 'good',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_config_id` (`config_id`),
  KEY `idx_reference_code` (`reference_code`),
  KEY `idx_position` (`position_index`),
  KEY `idx_equipment_refs_config` (`config_id`),
  KEY `idx_equipment_refs_active` (`is_active`),
  CONSTRAINT `equipment_references_ibfk_1` FOREIGN KEY (`config_id`) REFERENCES `equipment_configs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_references`
--

LOCK TABLES `equipment_references` WRITE;
/*!40000 ALTER TABLE `equipment_references` DISABLE KEYS */;
INSERT INTO `equipment_references` VALUES (1,1,'marque_aerotherme_0','Brand A',NULL,NULL,NULL,NULL,0,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(2,1,'marque_aerotherme_1','Brand B',NULL,NULL,NULL,NULL,1,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(3,1,'marque_aerotherme_2','Brand C',NULL,NULL,NULL,NULL,2,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(4,1,'marque_aerotherme_3','Brand D',NULL,NULL,NULL,NULL,3,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(5,1,'marque_aerotherme_4','Brand E',NULL,NULL,NULL,NULL,4,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(6,2,'clim_ir_ref_0','Daikin Model A',NULL,NULL,NULL,NULL,0,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(7,2,'clim_ir_ref_1','Mitsubishi Model B',NULL,NULL,NULL,NULL,1,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(8,2,'clim_ir_ref_2','Samsung Model C',NULL,NULL,NULL,NULL,2,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(9,3,'clim_wire_ref_0','LG Wire Model 1',NULL,NULL,NULL,NULL,0,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(10,3,'clim_wire_ref_1','Fujitsu Wire Model 2',NULL,NULL,NULL,NULL,1,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(11,4,'marque_rooftop_0','Carrier Rooftop',NULL,NULL,NULL,NULL,0,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58'),(12,4,'marque_rooftop_1','Trane Rooftop',NULL,NULL,NULL,NULL,1,NULL,1,'good',NULL,'2025-10-14 12:37:58','2025-10-14 12:37:58');
/*!40000 ALTER TABLE `equipment_references` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_sql`
--

DROP TABLE IF EXISTS `form_sql`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_sql` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `client` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `number1` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `number2` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `submitted_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `zone_aerotherme` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `nb_aerotherme` int DEFAULT NULL,
  `thermostat_aerotherme` int DEFAULT NULL,
  `nb_contacts_aerotherme` int DEFAULT NULL,
  `coffret_aerotherme` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `coffret_horloge_aerotherme` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `type_aerotherme` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Fonctionement_aerotherme` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Maintenance_aerotherme` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `commentaire_aero` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `marque_aerotherme_0` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_aerotherme_1` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_aerotherme_2` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_aerotherme_3` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_aerotherme_4` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_aerotherme_5` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_aerotherme_6` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_aerotherme_7` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_aerotherme_8` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_aerotherme_9` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `zone_rooftop_1` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `zone_rooftop_2` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `zone_rooftop_3` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `zone_rooftop_4` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `nb_rooftop` int DEFAULT NULL,
  `thermostat_rooftop` int DEFAULT NULL,
  `telecomande_modbus_rooftop` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `coffret_rooftop` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `type_rooftop_1` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `type_rooftop_2` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `type_rooftop_3` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Fonctionement_rooftop` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Maintenance_rooftop` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `marque_rooftop_0` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_rooftop_1` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_rooftop_2` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_rooftop_3` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_rooftop_4` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_rooftop_5` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_rooftop_6` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_rooftop_7` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_rooftop_8` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marque_rooftop_9` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `zone_clim` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `nb_clim_ir` int DEFAULT NULL,
  `nb_clim_wire` int DEFAULT NULL,
  `coffret_clim` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `type_clim` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Fonctionement_clim` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Maintenance_clim` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `nb_telecommande_clim_smartwire` int DEFAULT NULL,
  `nb_telecommande_clim_wire` int DEFAULT NULL,
  `clim_ir_ref_0` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_ir_ref_1` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_ir_ref_2` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_ir_ref_3` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_ir_ref_4` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_ir_ref_5` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_ir_ref_6` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_ir_ref_7` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_ir_ref_8` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_ir_ref_9` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_wire_ref_0` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_wire_ref_1` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_wire_ref_2` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_wire_ref_3` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_wire_ref_4` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_wire_ref_5` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_wire_ref_6` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_wire_ref_7` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_wire_ref_8` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `clim_wire_ref_9` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `zone_rooftop` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Eclairage_interieur` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Eclairage_contacteur` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Eclairage_exterieur` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Eclairage_horloge` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `type_rooftop` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `pos_x` int DEFAULT NULL,
  `pos_y` int DEFAULT NULL,
  `commentaire_clim` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `refs` json DEFAULT NULL,
  `sondes` int DEFAULT NULL,
  `sondesPresentes` int DEFAULT NULL,
  `gazCompteur` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Izit` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `modules` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `aeroeau` int DEFAULT NULL,
  `aerogaz` int DEFAULT NULL,
  `clim ir` int DEFAULT NULL,
  `clim filaire simple` int DEFAULT NULL,
  `clim filaire groupe` int DEFAULT NULL,
  `rooftop` int DEFAULT NULL,
  `Comptage Froid` int DEFAULT NULL,
  `Comptage Eclairage` int DEFAULT NULL,
  `eclairage` int DEFAULT NULL,
  `ref_aeroeau` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_aerogaz` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_clim_ir` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `clim_filaire_simple` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `clim_filaire_groupe` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_rooftop` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Comptage_Froid` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_Comptage_Eclairage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_eclairage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_sondes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_sondesPresentes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_gazCompteur` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_Izit` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `clim_ir` int DEFAULT NULL,
  `ref_Comptage_Froid` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_clim_filaire_groupe` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ref_clim_filaire_simple` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Comptage_Eclairage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `commentaire_eclairage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `commentaire_rooftop` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `td_aerotherme` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `td_clim` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_site` (`site`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_sql`
--

LOCK TABLES `form_sql` WRITE;
/*!40000 ALTER TABLE `form_sql` DISABLE KEYS */;
INSERT INTO `form_sql` VALUES (1,'Bricomarché Provins','Provins','41 Rue du Dauphiné','03767820245',NULL,'nathanhad111@gmail.com','2025-10-14 11:48:36','surface_de_vente, Galerie_marchande',2,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1one ','2',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'site2','nom2',NULL,NULL,NULL,NULL,'2025-10-14 15:05:14',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `form_sql` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `image_sql`
--

DROP TABLE IF EXISTS `image_sql`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `image_sql` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `url_viewer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `shapes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `url_thumb` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `url_medium` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `delete_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `datetime` datetime DEFAULT NULL,
  `card_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `x` int DEFAULT NULL,
  `y` int DEFAULT NULL,
  `label` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `image_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `module_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `crop_transform_x` int DEFAULT '0',
  `crop_transform_y` int DEFAULT '0',
  `crop_transform_width` int DEFAULT '0',
  `crop_transform_height` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `image_sql`
--

LOCK TABLES `image_sql` WRITE;
/*!40000 ALTER TABLE `image_sql` DISABLE KEYS */;
/*!40000 ALTER TABLE `image_sql` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sites`
--

DROP TABLE IF EXISTS `sites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `client_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `phone_primary` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `phone_secondary` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_name` (`site_name`),
  KEY `idx_site_name` (`site_name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sites`
--

LOCK TABLES `sites` WRITE;
/*!40000 ALTER TABLE `sites` DISABLE KEYS */;
INSERT INTO `sites` VALUES (1,'Bricomarché Provins','Provins','41ttt Rue du Dauphiné',NULL,NULL,NULL,'2025-10-14 11:52:17','2025-10-14 12:03:07'),(5,'tes','test',NULL,NULL,NULL,NULL,'2025-10-14 12:02:59','2025-10-14 12:02:59'),(7,'test_site_normalized','Test Client','123 Test Street','1234567890','0987654321','test@example.com','2025-10-14 12:35:59','2025-10-14 12:37:58');
/*!40000 ALTER TABLE `sites` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-14 15:29:57
