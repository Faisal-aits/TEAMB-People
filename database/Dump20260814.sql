-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: aits
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `ai_document_generated_documents`
--

DROP TABLE IF EXISTS `ai_document_generated_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_document_generated_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL DEFAULT '1',
  `template_id` int NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `form_data_json` longtext NOT NULL,
  `generated_file_path` varchar(500) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_doc_generated_tenant` (`tenant_id`,`created_at`),
  KEY `idx_ai_doc_generated_employee` (`employee_id`),
  KEY `fk_ai_generated_template` (`template_id`),
  CONSTRAINT `fk_ai_generated_template` FOREIGN KEY (`template_id`) REFERENCES `ai_document_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_document_generated_documents`
--

LOCK TABLES `ai_document_generated_documents` WRITE;
/*!40000 ALTER TABLE `ai_document_generated_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_document_generated_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_document_templates`
--

DROP TABLE IF EXISTS `ai_document_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_document_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL DEFAULT '1',
  `name` varchar(255) NOT NULL,
  `document_type` varchar(100) DEFAULT 'custom',
  `original_file_name` varchar(255) DEFAULT NULL,
  `uploaded_file_path` varchar(500) DEFAULT NULL,
  `schema_json` longtext NOT NULL,
  `status` varchar(50) DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_doc_templates_tenant_status` (`tenant_id`,`status`),
  KEY `idx_ai_doc_templates_type` (`document_type`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_document_templates`
--

LOCK TABLES `ai_document_templates` WRITE;
/*!40000 ALTER TABLE `ai_document_templates` DISABLE KEYS */;
INSERT INTO `ai_document_templates` VALUES (1,1,'Expense Bill','custom','Expense Bill.docx','C:\\Users\\ADMIN\\Documents\\GitHub\\Work_Desk\\backend\\src\\features\\uploads\\ai-documents\\1\\1780483909198-Expense_Bill.docx','{\"document_title\":\"Expense Bill\",\"document_type\":\"custom\",\"sections\":[{\"section_title\":\"Document Details\",\"order\":1,\"fields\":[{\"label\":\"Full Name\",\"key\":\"full_name\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Employee full name\",\"options\":[],\"validation\":{}},{\"label\":\"Date\",\"key\":\"date\",\"type\":\"date\",\"required\":true,\"placeholder\":\"Enter Date\",\"options\":[],\"validation\":{}},{\"label\":\"Employee Name (Dropdown existing employees)\",\"key\":\"employee_name_dropdown_existing_employees\",\"type\":\"dropdown\",\"required\":true,\"placeholder\":\"Enter Employee Name (Dropdown existing employees)\",\"options\":[],\"validation\":{}},{\"label\":\"Expense amount\",\"key\":\"expense_amount\",\"type\":\"number\",\"required\":true,\"placeholder\":\"Enter Expense amount\",\"options\":[],\"validation\":{}},{\"label\":\"Expense Category\",\"key\":\"expense_category\",\"type\":\"dropdown\",\"required\":true,\"placeholder\":\"Enter Expense Category\",\"options\":[],\"validation\":{}},{\"label\":\"Receipt (Upload)\",\"key\":\"receipt_upload\",\"type\":\"file\",\"required\":true,\"placeholder\":\"Enter Receipt (Upload)\",\"options\":[],\"validation\":{}}]}],\"content_blocks\":[{\"type\":\"heading\",\"text\":\"Expense Bill\"},{\"type\":\"paragraph\",\"text\":\"Date: {{blank}}\"},{\"type\":\"paragraph\",\"text\":\"Employee Name (Dropdown existing employees): {{blank}}\"},{\"type\":\"paragraph\",\"text\":\"Expense amount: {{blank}}\"},{\"type\":\"paragraph\",\"text\":\"Expense Category: {{blank}}\"},{\"type\":\"paragraph\",\"text\":\"Receipt (Upload): {{blank}}\"}]}','active',1,'2026-06-03 10:52:54','2026-06-03 10:52:54');
/*!40000 ALTER TABLE `ai_document_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_keys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `api_key` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_key` (`api_key`),
  KEY `idx_api_keys_tenant` (`tenant_id`),
  KEY `idx_api_keys_project` (`project_id`),
  KEY `idx_api_keys_key` (`api_key`),
  KEY `idx_api_keys_status` (`status`),
  CONSTRAINT `fk_api_keys_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_api_keys_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_keys`
--

LOCK TABLES `api_keys` WRITE;
/*!40000 ALTER TABLE `api_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_history`
--

DROP TABLE IF EXISTS `attendance_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `employee_id` varchar(20) NOT NULL,
  `date` date NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('Present','Delayed','On Leave','Absent') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `employee_id` (`employee_id`),
  KEY `idx_attendance_history_tenant` (`tenant_id`),
  CONSTRAINT `attendance_history_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_history_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_history`
--

LOCK TABLES `attendance_history` WRITE;
/*!40000 ALTER TABLE `attendance_history` DISABLE KEYS */;
INSERT INTO `attendance_history` VALUES (89,1,'AITS0054','2026-07-21','dsjfld','On Leave','2026-07-20 05:29:06'),(90,1,'AITS0054','2026-07-22','dsjfld','On Leave','2026-07-20 05:29:06');
/*!40000 ALTER TABLE `attendance_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_regularization_requests`
--

DROP TABLE IF EXISTS `attendance_regularization_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_regularization_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `attendance_id` int DEFAULT NULL,
  `request_date` date NOT NULL,
  `requested_check_in` datetime DEFAULT NULL,
  `requested_check_out` datetime DEFAULT NULL,
  `requested_status` varchar(30) DEFAULT NULL,
  `reason` text NOT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `admin_remarks` text,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reg_tenant` (`tenant_id`),
  KEY `idx_reg_employee` (`employee_id`),
  KEY `idx_reg_status` (`status`),
  KEY `idx_reg_date` (`request_date`),
  CONSTRAINT `fk_reg_requests_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reg_requests_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_regularization_requests`
--

LOCK TABLES `attendance_regularization_requests` WRITE;
/*!40000 ALTER TABLE `attendance_regularization_requests` DISABLE KEYS */;
INSERT INTO `attendance_regularization_requests` VALUES (1,1,'AITS0054',NULL,'2026-07-17','2026-07-17 10:00:00','2026-07-17 19:10:00','Present','i was came to office before 10 am but forgot to login','Rejected','i am sorry this will not change',1,'2026-07-22 13:05:22','2026-07-22 06:47:15','2026-07-22 07:35:22'),(2,1,'AITS0054',NULL,'2026-07-17','2026-07-17 10:00:00','2026-07-17 19:10:00','Present','i was came to office before 10 am but forgot to login','Approved','done',1,'2026-07-22 13:13:03','2026-07-22 06:47:16','2026-07-22 07:43:03'),(3,1,'AITS0054',83,'2026-07-21','2026-07-21 09:53:00','2026-07-21 19:20:00','Present','i am on time','Approved','done',1,'2026-07-22 13:36:34','2026-07-22 08:05:14','2026-07-22 08:06:34'),(4,1,'AITS0054',NULL,'2026-07-09','2026-07-09 09:00:00','2026-07-09 19:20:00','Present','Dhdhdh','Approved','Done',1,'2026-07-23 16:55:28','2026-07-23 11:24:06','2026-07-23 11:25:28');
/*!40000 ALTER TABLE `attendance_regularization_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_regularization_settings`
--

DROP TABLE IF EXISTS `attendance_regularization_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_regularization_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `monthly_limit` int NOT NULL DEFAULT '4',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_id` (`tenant_id`),
  CONSTRAINT `fk_reg_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_regularization_settings`
--

LOCK TABLES `attendance_regularization_settings` WRITE;
/*!40000 ALTER TABLE `attendance_regularization_settings` DISABLE KEYS */;
INSERT INTO `attendance_regularization_settings` VALUES (1,1,6,1,'2026-07-27 12:57:09');
/*!40000 ALTER TABLE `attendance_regularization_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_interactions`
--

DROP TABLE IF EXISTS `client_interactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_interactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `client_id` int NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `participants` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_client_interactions_tenant` (`tenant_id`),
  KEY `fk_client_interactions_client` (`client_id`),
  CONSTRAINT `fk_client_interactions_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_client_interactions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_interactions`
--

LOCK TABLES `client_interactions` WRITE;
/*!40000 ALTER TABLE `client_interactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_interactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `assigned_manager` varchar(255) DEFAULT NULL,
  `status` enum('active','prospective','inactive') DEFAULT 'prospective',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `company` varchar(255) DEFAULT NULL,
  `assigned_manager_user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_clients_manager_user` (`assigned_manager_user_id`),
  KEY `fk_clients_tenant` (`tenant_id`),
  CONSTRAINT `fk_clients_assigned_manager_user` FOREIGN KEY (`assigned_manager_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_clients_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,1,'Edunovaa Rahuri','Technology',NULL,NULL,NULL,NULL,NULL,'active','2026-05-15 00:12:54','2026-05-23 16:47:46','Ubed',NULL);
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_challan_history`
--

DROP TABLE IF EXISTS `delivery_challan_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_challan_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `challan_id` int NOT NULL,
  `date` date NOT NULL,
  `action` varchar(100) NOT NULL,
  `user` varchar(100) NOT NULL,
  `follow_up` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_challan_id` (`challan_id`),
  KEY `idx_date` (`date`),
  KEY `idx_delivery_history_tenant` (`tenant_id`),
  CONSTRAINT `delivery_challan_history_ibfk_1` FOREIGN KEY (`challan_id`) REFERENCES `delivery_challans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_delivery_history_challan` FOREIGN KEY (`challan_id`) REFERENCES `delivery_challans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_delivery_history_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_challan_history`
--

LOCK TABLES `delivery_challan_history` WRITE;
/*!40000 ALTER TABLE `delivery_challan_history` DISABLE KEYS */;
INSERT INTO `delivery_challan_history` VALUES (3,NULL,3,'2026-05-28','Delivery challan created','Admin','Initial delivery challan setup completed','2026-05-28 23:57:53');
/*!40000 ALTER TABLE `delivery_challan_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_challan_items`
--

DROP TABLE IF EXISTS `delivery_challan_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_challan_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `challan_id` int NOT NULL,
  `sr_no` int NOT NULL,
  `description` text NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_challan_id` (`challan_id`),
  KEY `idx_delivery_items_tenant` (`tenant_id`),
  CONSTRAINT `delivery_challan_items_ibfk_1` FOREIGN KEY (`challan_id`) REFERENCES `delivery_challans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_delivery_items_challan` FOREIGN KEY (`challan_id`) REFERENCES `delivery_challans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_delivery_items_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_challan_items`
--

LOCK TABLES `delivery_challan_items` WRITE;
/*!40000 ALTER TABLE `delivery_challan_items` DISABLE KEYS */;
INSERT INTO `delivery_challan_items` VALUES (5,NULL,3,1,'dsf',1.00,'2026-05-28 23:57:53');
/*!40000 ALTER TABLE `delivery_challan_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_challans`
--

DROP TABLE IF EXISTS `delivery_challans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_challans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `service_id` int DEFAULT NULL,
  `challan_no` varchar(50) NOT NULL,
  `challan_date` date NOT NULL,
  `destination` varchar(255) NOT NULL,
  `dispatched_through` varchar(100) DEFAULT 'By Hand',
  `to_address` text NOT NULL,
  `from_address` text,
  `contact_info` text,
  `payment_info` varchar(100) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `challan_no` (`challan_no`),
  KEY `idx_challan_date` (`challan_date`),
  KEY `idx_destination` (`destination`),
  KEY `idx_challan_no` (`challan_no`),
  KEY `idx_delivery_challans_tenant` (`tenant_id`),
  KEY `idx_delivery_challans_client` (`client_id`),
  KEY `idx_delivery_challans_project` (`project_id`),
  KEY `idx_delivery_challans_service` (`service_id`),
  KEY `fk_delivery_challans_created_by` (`created_by`),
  CONSTRAINT `fk_delivery_challans_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_delivery_challans_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_delivery_challans_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_delivery_challans_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_delivery_challans_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_challans`
--

LOCK TABLES `delivery_challans` WRITE;
/*!40000 ALTER TABLE `delivery_challans` DISABLE KEYS */;
INSERT INTO `delivery_challans` VALUES (3,1,NULL,NULL,NULL,'2026/D-1608','2026-05-28','afsad','By Hand','sadfads','Above Being Healthy Gym, Near Surbhi Hospital, Nagar Sambhajinagar Road, Ahilyanagar [Ahmednagar] Maharashtra 414003','info@arhamitsolution.in\n9322195628','100% against delivery',1,'2026-05-28 23:57:53','2026-05-28 23:57:53');
/*!40000 ALTER TABLE `delivery_challans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `manager` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_departments_tenant` (`tenant_id`),
  CONSTRAINT `fk_departments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,1,'HR',NULL,'Sharjeel','2026-05-23 10:08:26','2026-05-23 10:08:26'),(2,1,'Developement',NULL,'Aniruddha Manmode','2026-05-28 10:50:46','2026-05-28 10:50:46');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_departments`
--

DROP TABLE IF EXISTS `employee_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_departments` (
  `employee_id` varchar(20) NOT NULL,
  `department_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`,`department_id`,`tenant_id`),
  KEY `idx_employee_departments_department` (`department_id`),
  KEY `idx_employee_departments_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_departments`
--

LOCK TABLES `employee_departments` WRITE;
/*!40000 ALTER TABLE `employee_departments` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_details`
--

DROP TABLE IF EXISTS `employee_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_details` (
  `id` varchar(20) NOT NULL,
  `tenant_id` int DEFAULT NULL,
  `employee_id` int NOT NULL,
  `department_id` int DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text,
  `emergency_contact` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `aadhar_number` varchar(20) DEFAULT NULL,
  `face_encoding` longtext,
  `status` enum('active','inactive') DEFAULT 'active',
  `default_shift_id` int DEFAULT NULL,
  `employment_type` varchar(50) DEFAULT NULL,
  `last_working_date` date DEFAULT NULL,
  `salary_basic` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_hra` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_medical_allowance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_travel_allowance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_other_allowance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_gross` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_pf` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_esic` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_professional_tax` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_lwf` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_total_deduction` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salary_net` decimal(12,2) NOT NULL DEFAULT '0.00',
  `employer_pf` decimal(12,2) NOT NULL DEFAULT '0.00',
  `employer_esic` decimal(12,2) NOT NULL DEFAULT '0.00',
  `auto_checkout_enabled` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`employee_id`),
  KEY `department_id` (`department_id`),
  KEY `fk_employee_default_shift` (`default_shift_id`),
  KEY `idx_employee_details_tenant` (`tenant_id`),
  CONSTRAINT `employee_details_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_details_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_employee_default_shift` FOREIGN KEY (`default_shift_id`) REFERENCES `tb_shifts` (`shift_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_employee_details_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_details`
--

LOCK TABLES `employee_details` WRITE;
/*!40000 ALTER TABLE `employee_details` DISABLE KEYS */;
INSERT INTO `employee_details` VALUES ('AD001',1,1,NULL,'admin',NULL,NULL,NULL,NULL,NULL,'2026-05-04 12:12:55','2026-05-09 11:36:01',NULL,NULL,NULL,NULL,NULL,'active',14,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('AITS003',1,52,2,'Full stack developer (Manager)',10000.00,'2025-06-01','2005-02-15',NULL,NULL,'2026-05-29 06:14:39','2026-05-29 06:14:39',NULL,NULL,NULL,NULL,NULL,'active',NULL,'Full-time',NULL,10000.00,0.00,0.00,0.00,0.00,10000.00,1200.00,75.00,0.00,0.00,1275.00,8725.00,1300.00,325.00,0),('AITS0054',1,57,2,'Full Stack Developer',80000.00,'2026-04-21',NULL,'ahmednagar',NULL,'2026-06-02 07:53:59','2026-07-22 08:03:54',NULL,NULL,NULL,NULL,NULL,'active',NULL,'Full-time',NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP001',1,30,2,'Software Engineer',750000.00,'2023-01-15',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-29 00:32:52',NULL,NULL,NULL,NULL,NULL,'active',NULL,'Full-time',NULL,10000.00,0.00,0.00,0.00,0.00,10000.00,1200.00,75.00,0.00,0.00,1275.00,8725.00,1300.00,325.00,0),('EMP002',1,31,NULL,'HR Manager',680000.00,'2022-07-20',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP003',1,32,NULL,'Accountant',550000.00,'2021-11-05',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP004',1,33,NULL,'Marketing Executive',620000.00,'2024-02-10',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP005',1,34,NULL,'Sales Manager',800000.00,'2020-09-18',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP006',1,35,NULL,'Frontend Developer',700000.00,'2023-06-25',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP007',1,36,NULL,'Operations Lead',720000.00,'2021-03-12',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP008',1,37,NULL,'Customer Support Executive',450000.00,'2024-01-08',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP009',1,38,NULL,'Backend Developer',780000.00,'2022-05-30',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP010',1,39,NULL,'Financial Analyst',670000.00,'2023-08-14',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP011',1,40,NULL,'Legal Advisor',900000.00,'2019-12-01',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP012',1,41,NULL,'Content Strategist',580000.00,'2024-03-11',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP013',1,42,NULL,'Business Development Executive',640000.00,'2022-10-22',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP014',1,43,NULL,'Recruiter',500000.00,'2023-09-05',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP015',1,44,NULL,'DevOps Engineer',850000.00,'2021-06-17',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP016',1,45,NULL,'UI/UX Designer',610000.00,'2024-04-09',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP017',1,46,NULL,'Supply Chain Analyst',590000.00,'2022-02-28',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP018',1,47,NULL,'Technical Support Engineer',530000.00,'2023-11-19',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP019',1,48,NULL,'Data Analyst',720000.00,'2021-08-23',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0),('EMP020',1,49,NULL,'Office Administrator',480000.00,'2020-04-15',NULL,NULL,NULL,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0);
/*!40000 ALTER TABLE `employee_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_reports`
--

DROP TABLE IF EXISTS `employee_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `user_id` int NOT NULL,
  `report_date` date NOT NULL,
  `report_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `remark_updated_by` int DEFAULT NULL,
  `remark_updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_reports_tenant_date` (`tenant_id`,`report_date`),
  KEY `idx_employee_reports_user_date` (`user_id`,`report_date`),
  KEY `idx_employee_reports_tenant_user` (`tenant_id`,`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_reports`
--

LOCK TABLES `employee_reports` WRITE;
/*!40000 ALTER TABLE `employee_reports` DISABLE KEYS */;
INSERT INTO `employee_reports` VALUES (1,1,57,'2026-08-13','hi i have done landscap of 201 , tommorrow i will continue other thing','ok',1,'2026-08-13 13:42:32','2026-08-13 13:42:07','2026-08-13 13:42:32');
/*!40000 ALTER TABLE `employee_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `limit_amount` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_categories_tenant` (`tenant_id`),
  CONSTRAINT `fk_expense_categories_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=181 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` VALUES (179,1,'Travel',NULL,10000.00,'2026-05-24 18:47:20'),(180,1,'Food',NULL,5000.00,'2026-05-24 18:47:36');
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `category_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `payment_status` enum('paid','pending','cancelled') DEFAULT 'pending',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_expenses_tenant` (`tenant_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_expenses_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (42,1,30,179,4000.00,'Denger','/uploads/expenses/expense_1779648496643_Ai Fine Tunning.png',NULL,'pending','paid','2026-05-24 18:48:16',NULL,NULL,'2026-05-24 18:48:16','2026-05-24 18:52:57'),(43,1,52,179,1000.00,'jkldfaljksfda','/uploads/expenses/expense_1780035380272_aits logo.png',NULL,'pending','paid','2026-05-29 06:16:20',NULL,NULL,'2026-05-29 06:16:20','2026-05-29 06:16:58');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `experience_letters`
--

DROP TABLE IF EXISTS `experience_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experience_letters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `ref_number` varchar(100) DEFAULT NULL,
  `date_of_issue` date NOT NULL,
  `date_of_joining` date NOT NULL,
  `last_working_day` date NOT NULL,
  `designation` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `employment_type` enum('Full-time','Part-time','Contract','Internship') NOT NULL,
  `custom_note` text,
  `letter_url` varchar(500) NOT NULL,
  `generated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_el_user` (`generated_by`),
  KEY `idx_experience_letters_tenant` (`tenant_id`),
  KEY `idx_experience_letters_employee` (`employee_id`),
  CONSTRAINT `fk_el_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_el_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_el_user` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `experience_letters`
--

LOCK TABLES `experience_letters` WRITE;
/*!40000 ALTER TABLE `experience_letters` DISABLE KEYS */;
/*!40000 ALTER TABLE `experience_letters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gst_details`
--

DROP TABLE IF EXISTS `gst_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gst_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `tax_type` varchar(50) DEFAULT NULL,
  `percentage` decimal(8,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gst_details_invoice` (`invoice_id`),
  CONSTRAINT `fk_gst_details_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gst_details`
--

LOCK TABLES `gst_details` WRITE;
/*!40000 ALTER TABLE `gst_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `gst_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_holidays_tenant_date` (`tenant_id`,`date`),
  KEY `idx_holidays_tenant_date` (`tenant_id`,`date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `industries`
--

DROP TABLE IF EXISTS `industries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `industries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `name` varchar(120) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_industries_tenant_name` (`tenant_id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `industries`
--

LOCK TABLES `industries` WRITE;
/*!40000 ALTER TABLE `industries` DISABLE KEYS */;
/*!40000 ALTER TABLE `industries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integration_audit_logs`
--

DROP TABLE IF EXISTS `integration_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `integration_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `api_key_id` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `ticket_id` int DEFAULT NULL,
  `status_code` int NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_tenant` (`tenant_id`),
  KEY `idx_audit_key` (`api_key_id`),
  KEY `idx_audit_ticket` (`ticket_id`),
  CONSTRAINT `fk_audit_api_key` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integration_audit_logs`
--

LOCK TABLES `integration_audit_logs` WRITE;
/*!40000 ALTER TABLE `integration_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `integration_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_history`
--

DROP TABLE IF EXISTS `invoice_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `user` varchar(255) DEFAULT NULL,
  `follow_up` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_history_invoice` (`invoice_id`),
  CONSTRAINT `fk_invoice_history_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_history`
--

LOCK TABLES `invoice_history` WRITE;
/*!40000 ALTER TABLE `invoice_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `sr_no` int DEFAULT NULL,
  `description` text,
  `hsn_code` varchar(50) DEFAULT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rate` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_items_invoice` (`invoice_id`),
  CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `client_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `service_id` int DEFAULT NULL,
  `invoice_no` varchar(100) NOT NULL,
  `invoice_date` date NOT NULL,
  `ref_no` varchar(100) DEFAULT NULL,
  `buyer_gstin` varchar(50) DEFAULT NULL,
  `party_address` text,
  `total_before_discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `round_off` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_after_tax` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `created_by` int DEFAULT NULL,
  `service_bank_details` json DEFAULT NULL,
  `service_gst_details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_invoices_tenant_no` (`tenant_id`,`invoice_no`),
  KEY `idx_invoices_tenant` (`tenant_id`),
  KEY `idx_invoices_client` (`client_id`),
  KEY `idx_invoices_project` (`project_id`),
  KEY `idx_invoices_service` (`service_id`),
  KEY `fk_invoices_created_by` (`created_by`),
  CONSTRAINT `fk_invoices_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoices_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoices_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoices_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoices_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_balances`
--

DROP TABLE IF EXISTS `leave_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `leave_type` varchar(50) NOT NULL,
  `year` int NOT NULL,
  `allocated` int NOT NULL DEFAULT '0',
  `used` int NOT NULL DEFAULT '0',
  `pending` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_balance` (`tenant_id`,`employee_id`,`leave_type`,`year`),
  KEY `fk_leave_balances_employee` (`employee_id`),
  CONSTRAINT `fk_leave_balances_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leave_balances_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_balances`
--

LOCK TABLES `leave_balances` WRITE;
/*!40000 ALTER TABLE `leave_balances` DISABLE KEYS */;
INSERT INTO `leave_balances` VALUES (1,1,'AITS0054','Casual',2026,10,2,0),(2,1,'AITS0054','Earned',2026,15,0,0),(3,1,'AITS0054','Maternity',2026,90,0,0),(4,1,'AITS0054','Sick',2026,10,0,0),(5,1,'AITS0054','Unpaid',2026,365,0,0);
/*!40000 ALTER TABLE `leave_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `leave_id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `employee_id` varchar(20) NOT NULL,
  `leave_type` varchar(50) NOT NULL DEFAULT 'Casual',
  `is_paid` tinyint(1) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `approved_by` varchar(20) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`leave_id`),
  KEY `employee_id` (`employee_id`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_leave_requests_tenant` (`tenant_id`),
  CONSTRAINT `fk_leave_requests_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `employee_details` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
INSERT INTO `leave_requests` VALUES (18,1,'AITS0054','Casual',1,'dsjfld','2026-07-21','2026-07-22','Approved','AD001','2026-07-20 10:59:06','2026-07-20 05:28:27','2026-07-20 05:29:06');
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_types`
--

DROP TABLE IF EXISTS `leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `max_days` int NOT NULL DEFAULT '0',
  `is_paid` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_leave_type_tenant_name` (`tenant_id`,`name`),
  CONSTRAINT `fk_leave_types_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_types`
--

LOCK TABLES `leave_types` WRITE;
/*!40000 ALTER TABLE `leave_types` DISABLE KEYS */;
INSERT INTO `leave_types` VALUES (1,1,'Casual',10,1,1,'2026-07-18 07:06:48'),(2,1,'Sick',10,1,1,'2026-07-18 07:06:48'),(3,1,'Earned',15,1,1,'2026-07-18 07:06:48'),(4,1,'Maternity',90,1,1,'2026-07-18 07:06:48'),(5,1,'Unpaid',365,0,1,'2026-07-18 07:06:48');
/*!40000 ALTER TABLE `leave_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modules`
--

DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_key` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_module_key` (`module_key`)
) ENGINE=InnoDB AUTO_INCREMENT=1963 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules`
--

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` VALUES (1,'hr','HR Module',10),(2,'accounts','Accounts Module',40),(3,'services','Services Module',60),(533,'hr_dashboard','HR Dashboard',11),(534,'employee_management','Employee Management',12),(535,'attendance_management','Attendance Management',13),(536,'leave_management','Leave Management',14),(537,'shift_management','Shift Management',15),(538,'salary_management','Salary Management',16),(539,'holiday_management','Holiday Management',17),(540,'ai_document_generator','AI Document Generator',18),(541,'offer_letters','Offer Letters',19),(542,'declarations','Declaration Forms',20),(543,'resignations','Resignation Requests',21),(544,'salary_slips','Salary Slips',22),(545,'experience_letters','Experience Letters',23),(546,'increment_letters','Increment Letters',24),(548,'billing_management','Billing Management',41),(549,'delivery_management','Delivery Management',42),(550,'expense_management','Expense Management',43),(551,'billing_settings','Billing Settings',44),(552,'quotation_management','Quotation Management',45),(554,'service_management','Service Management',61),(555,'pttm','PTTM',80),(556,'employee_attendance','My Attendance & Leave',100),(557,'employee_expense','My Expense',101),(558,'employee_projects','My Projects & Tasks',102);
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offer_letters`
--

DROP TABLE IF EXISTS `offer_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_letters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int DEFAULT NULL,
  `form_data` json NOT NULL,
  `issue_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tenant_id` int DEFAULT NULL,
  `candidate_name` varchar(255) DEFAULT NULL,
  `candidate_email` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  CONSTRAINT `offer_letters_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offer_letters`
--

LOCK TABLES `offer_letters` WRITE;
/*!40000 ALTER TABLE `offer_letters` DISABLE KEYS */;
INSERT INTO `offer_letters` VALUES (13,27,'{\"ctc\": \"122\", \"email\": \"jubeda12345.aits@gmail.com\", \"phone\": \"0988776613\", \"address\": \"kjkhghhh\", \"fullName\": \"Jubeda Shaikh\", \"issueDate\": \"2026-05-09\", \"ctcInWords\": \"One Hundred and Twenty Two\", \"salutation\": \"Mr.\", \"designation\": \"fgds\", \"joiningDate\": \"\", \"salaryBreakup\": {\"ctc\": {\"annual\": \"122\", \"monthly\": \"\"}, \"hra\": {\"annual\": \"\", \"monthly\": \"\"}, \"tds\": {\"annual\": \"\", \"monthly\": \"\"}, \"netSalary\": {\"annual\": \"\", \"monthly\": \"\"}, \"basicSalary\": {\"annual\": \"\", \"monthly\": \"\"}, \"professionalTax\": {\"annual\": \"\", \"monthly\": \"\"}, \"medicalAllowance\": {\"annual\": \"\", \"monthly\": \"\"}, \"specialAllowance\": {\"annual\": \"\", \"monthly\": \"\"}, \"conveyanceAllowance\": {\"annual\": \"\", \"monthly\": \"\"}, \"employerPfContribution\": {\"annual\": \"\", \"monthly\": \"\"}, \"employerEsiContribution\": {\"annual\": \"\", \"monthly\": \"\"}}, \"termsAndConditions\": [\"The employee shall abide by all company policies, rules, and regulations.\", \"This offer is contingent upon satisfactory background verification and reference checks.\", \"The first three months shall be a probationary period, during which either party may terminate employment with one week\'s notice.\", \"The company reserves the right to modify terms with prior notice.\", \"Confidentiality of company information must be maintained during and after employment.\", \"All intellectual property created during employment shall belong to the company.\", \"The employee agrees not to engage in any competing business during employment and for six months after termination.\", \"Employment may be terminated by either party with one month\'s notice or payment in lieu thereof.\"]}','2026-05-09','2026-05-09 10:23:00','2026-06-02 07:43:21',1,NULL,NULL,'Pending'),(14,57,'{\"ctc\": \"80000\", \"hra\": \"\", \"tds\": \"\", \"email\": \"sarfraz.aits@gmail.com\", \"phone\": \"9876543210\", \"terms\": [\"The employee shall abide by all company policies, rules, and regulations.\", \"This offer is contingent upon satisfactory background verification and reference checks.\", \"The first three months shall be a probationary period, during which either party may terminate employment with one week\'s notice.\", \"The company reserves the right to modify terms with prior notice.\", \"Confidentiality of company information must be maintained during and after employment.\", \"All intellectual property created during employment shall belong to the company.\", \"The employee agrees not to engage in any competing business during employment and for six months after termination.\", \"Employment may be terminated by either party with one month\'s notice or payment in lieu thereof.\"], \"netPay\": \"\", \"address\": \"ahmednagar\", \"fullName\": \"sarfraz bagwan\", \"issueDate\": \"2026-06-02\", \"ctcInWords\": \"Eighty Thousand Rupees Only\", \"employerPf\": \"\", \"salutation\": \"Mr.\", \"basicSalary\": \"\", \"designation\": \"Full Stack Developer\", \"employerEsi\": \"\", \"joiningDate\": \"2026-04-21\", \"totalEarning\": \"\", \"professionalTax\": \"\", \"medicalAllowance\": \"\", \"specialAllowance\": \"\", \"conveyanceAllowance\": \"\"}','2026-06-02','2026-06-02 07:48:34','2026-06-02 07:54:02',1,'sarfraz bagwan','sarfraz.aits@gmail.com','Accepted'),(15,NULL,'{\"ctc\": \"80000\", \"hra\": \"\", \"tds\": \"\", \"email\": \"sarfraz.aits@gmail.com\", \"phone\": \"9876543210\", \"terms\": [\"The employee shall abide by all company policies, rules, and regulations.\", \"This offer is contingent upon satisfactory background verification and reference checks.\", \"The first three months shall be a probationary period, during which either party may terminate employment with one week\'s notice.\", \"The company reserves the right to modify terms with prior notice.\", \"Confidentiality of company information must be maintained during and after employment.\", \"All intellectual property created during employment shall belong to the company.\", \"The employee agrees not to engage in any competing business during employment and for six months after termination.\", \"Employment may be terminated by either party with one month\'s notice or payment in lieu thereof.\"], \"netPay\": \"\", \"address\": \"ahmednagar\", \"fullName\": \"sarfraz bagwan\", \"issueDate\": \"2026-06-02\", \"ctcInWords\": \"Eighty Thousand Rupees Only\", \"employerPf\": \"\", \"salutation\": \"Mr.\", \"basicSalary\": \"\", \"designation\": \"Full Stack Developer\", \"employerEsi\": \"\", \"joiningDate\": \"2026-04-21\", \"totalEarning\": \"\", \"professionalTax\": \"\", \"medicalAllowance\": \"\", \"specialAllowance\": \"\", \"conveyanceAllowance\": \"\"}','2026-06-02','2026-06-02 07:52:08','2026-06-02 07:52:13',1,'sarfraz bagwan','sarfraz.aits@gmail.com','Sent'),(16,NULL,'{\"ctc\": \"2000000\", \"hra\": \"\", \"tds\": \"\", \"email\": \"sahil.qostq@gmail.com\", \"phone\": \"91 9595426797\", \"terms\": [\"The employee shall abide by all company policies, rules, and regulations.\", \"This offer is contingent upon satisfactory background verification and reference checks.\", \"The first three months shall be a probationary period, during which either party may terminate employment with one week\'s notice.\", \"The company reserves the right to modify terms with prior notice.\", \"Confidentiality of company information must be maintained during and after employment.\", \"All intellectual property created during employment shall belong to the company.\", \"The employee agrees not to engage in any competing business during employment and for six months after termination.\", \"Employment may be terminated by either party with one month\'s notice or payment in lieu thereof.\"], \"netPay\": \"1600000\", \"address\": \"CIV colony. near mehraj masjid Mukund nagar\", \"fullName\": \"Sahil bhai\", \"issueDate\": \"2026-07-18\", \"ctcInWords\": \"Twenty Lakh Rupees Only\", \"employerPf\": \"\", \"salutation\": \"Mr.\", \"basicSalary\": \"149998\", \"designation\": \"Beam Devloper\", \"employerEsi\": \"\", \"joiningDate\": \"2026-07-17\", \"totalEarning\": \"\", \"professionalTax\": \"\", \"medicalAllowance\": \"\", \"specialAllowance\": \"\", \"conveyanceAllowance\": \"\"}','2026-07-18','2026-07-18 07:42:25','2026-07-18 07:42:25',1,'Sahil bhai','sahil.qostq@gmail.com','Pending');
/*!40000 ALTER TABLE `offer_letters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `client_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `department` varchar(255) DEFAULT NULL,
  `manager` varchar(255) DEFAULT NULL,
  `current_phase` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_projects_tenant` (`tenant_id`),
  KEY `idx_projects_client` (`client_id`),
  CONSTRAINT `fk_projects_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_projects_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,1,1,'Frontend',NULL,'2026-05-22','2026-05-26','Active','2026-05-23 16:48:23','2026-05-28 05:38:11',NULL,NULL,NULL),(2,1,NULL,'Work Desk','Officemanagement','2026-05-23','2026-05-29','In Progress','2026-05-28 05:38:11','2026-05-28 05:38:11',NULL,NULL,NULL);
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pttm_docflow_entries`
--

DROP TABLE IF EXISTS `pttm_docflow_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pttm_docflow_entries` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` int DEFAULT '1',
  `project_id` int NOT NULL,
  `phase_num` int NOT NULL,
  `status` enum('Not Started','In Progress','Waiting for Client','Completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Not Started',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pttm_proj_phase` (`project_id`,`phase_num`),
  CONSTRAINT `fk_pttm_docflow_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pttm_docflow_entries`
--

LOCK TABLES `pttm_docflow_entries` WRITE;
/*!40000 ALTER TABLE `pttm_docflow_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `pttm_docflow_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pttm_docflow_files`
--

DROP TABLE IF EXISTS `pttm_docflow_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pttm_docflow_files` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` int DEFAULT '1',
  `docflow_entry_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int DEFAULT '0',
  `upload_date` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pttm_files_entry` (`docflow_entry_id`),
  CONSTRAINT `fk_pttm_files_entry` FOREIGN KEY (`docflow_entry_id`) REFERENCES `pttm_docflow_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pttm_docflow_files`
--

LOCK TABLES `pttm_docflow_files` WRITE;
/*!40000 ALTER TABLE `pttm_docflow_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `pttm_docflow_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pttm_modules`
--

DROP TABLE IF EXISTS `pttm_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pttm_modules` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` int DEFAULT '1',
  `project_id` int DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `order_num` int DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pttm_modules_tenant` (`tenant_id`),
  KEY `idx_pttm_modules_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pttm_modules`
--

LOCK TABLES `pttm_modules` WRITE;
/*!40000 ALTER TABLE `pttm_modules` DISABLE KEYS */;
/*!40000 ALTER TABLE `pttm_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pttm_phases`
--

DROP TABLE IF EXISTS `pttm_phases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pttm_phases` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` int DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int DEFAULT NULL,
  `order_num` int DEFAULT '1',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pttm_phases_project` (`project_id`),
  CONSTRAINT `fk_pttm_phases_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pttm_phases`
--

LOCK TABLES `pttm_phases` WRITE;
/*!40000 ALTER TABLE `pttm_phases` DISABLE KEYS */;
INSERT INTO `pttm_phases` VALUES ('82cad731-0da0-47ab-99cd-ef618da593ff',1,'Basic Structure to build on',2,1,'Make the basic structure to implement and pointout','2026-05-23 11:48:30');
/*!40000 ALTER TABLE `pttm_phases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pttm_projects`
--

DROP TABLE IF EXISTS `pttm_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pttm_projects` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` int DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `start_date` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `end_date` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('In Progress','Planning','Completed','On Going','On Hold') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'In Progress',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pttm_projects`
--

LOCK TABLES `pttm_projects` WRITE;
/*!40000 ALTER TABLE `pttm_projects` DISABLE KEYS */;
INSERT INTO `pttm_projects` VALUES ('92de6045-b870-4945-a65b-8cec74f27d1b',1,'Work Desk','Officemanagement','2026-05-23','2026-05-29','In Progress','2026-05-23 11:25:49','2026-05-23 11:25:49');
/*!40000 ALTER TABLE `pttm_projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pttm_tasks`
--

DROP TABLE IF EXISTS `pttm_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pttm_tasks` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` int DEFAULT '1',
  `project_id` int DEFAULT NULL,
  `phase_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `team_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_user_id` int DEFAULT NULL,
  `team_leader_id` int DEFAULT NULL,
  `date` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `task_title` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('Pending','In Progress','Completed','Not Started','On Going','Under Review') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `review_status` enum('Not Submitted','Pending Review','Approved','Rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Not Submitted',
  `review_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reviewed_by` int DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sort_order` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pttm_tasks_phase` (`phase_id`),
  KEY `fk_pttm_tasks_team` (`team_id`),
  KEY `fk_pttm_tasks_project` (`project_id`),
  KEY `fk_pttm_tasks_user` (`assigned_user_id`),
  KEY `fk_pttm_tasks_leader` (`team_leader_id`),
  CONSTRAINT `fk_pttm_tasks_leader` FOREIGN KEY (`team_leader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pttm_tasks_phase` FOREIGN KEY (`phase_id`) REFERENCES `pttm_phases` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pttm_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pttm_tasks_team` FOREIGN KEY (`team_id`) REFERENCES `pttm_teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pttm_tasks_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pttm_tasks`
--

LOCK TABLES `pttm_tasks` WRITE;
/*!40000 ALTER TABLE `pttm_tasks` DISABLE KEYS */;
INSERT INTO `pttm_tasks` VALUES ('06db1e21-f6f2-4b1e-b226-d3d410cc4f37',2,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-18','',NULL,'Pending','Not Submitted',NULL,NULL,NULL,NULL,NULL,2,'2026-07-18 15:25:55','2026-07-18 15:25:55'),('1c4495db-04b4-4d72-a333-b8855d31822d',2,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-18','',NULL,'Pending','Not Submitted',NULL,NULL,NULL,NULL,NULL,1,'2026-07-18 15:25:53','2026-07-18 15:25:53'),('3b07e22a-af2d-448e-a9d5-727d2974ac38',2,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-18','',NULL,'Pending','Not Submitted',NULL,NULL,NULL,NULL,NULL,3,'2026-07-18 15:25:57','2026-07-18 15:25:57'),('678b64f6-3d1a-414e-a2f5-89568e7a8042',1,2,'82cad731-0da0-47ab-99cd-ef618da593ff',NULL,'dd5ae8d9-9638-4926-bb17-1298e97b101f',57,57,'2026-05-23','Make it running','Make all modules running smoothly','Completed','Approved',NULL,1,'2026-07-20 12:30:27','2026-07-20 12:31:24','Nothing',1,'2026-05-23 11:26:04','2026-07-20 12:31:24'),('84c331cf-5409-442b-bc38-616a397e35b4',1,2,'82cad731-0da0-47ab-99cd-ef618da593ff',NULL,NULL,57,NULL,'2026-05-23',NULL,NULL,'Completed','Approved',NULL,1,'2026-07-20 18:17:59','2026-07-20 18:18:13',NULL,2,'2026-05-23 11:50:52','2026-07-20 18:18:13');
/*!40000 ALTER TABLE `pttm_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pttm_teams`
--

DROP TABLE IF EXISTS `pttm_teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pttm_teams` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` int DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pttm_teams_project` (`project_id`),
  CONSTRAINT `fk_pttm_teams_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pttm_teams`
--

LOCK TABLES `pttm_teams` WRITE;
/*!40000 ALTER TABLE `pttm_teams` DISABLE KEYS */;
INSERT INTO `pttm_teams` VALUES ('dd5ae8d9-9638-4926-bb17-1298e97b101f',1,'Team Workdesk',2,'2026-05-23 11:50:41');
/*!40000 ALTER TABLE `pttm_teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pttm_users`
--

DROP TABLE IF EXISTS `pttm_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pttm_users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` int DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Team Lead','Developer','Tester','Designer','HR','Manager','Intern') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Developer',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pttm_users`
--

LOCK TABLES `pttm_users` WRITE;
/*!40000 ALTER TABLE `pttm_users` DISABLE KEYS */;
INSERT INTO `pttm_users` VALUES ('794d1750-7e7a-4fb5-bd0c-3fb02c7edb29',1,'Aniruddha Manmode','Team Lead','2026-05-23 11:50:19'),('b90d90ad-f3d4-4a53-87e2-2bf4c23c4671',1,'Faisal Khan','Developer','2026-05-23 11:50:26');
/*!40000 ALTER TABLE `pttm_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotation_gst_details`
--

DROP TABLE IF EXISTS `quotation_gst_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_gst_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `quotation_id` int DEFAULT NULL,
  `tax_type` enum('CGST','SGST','IGST') DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `idx_quotation_gst_tenant` (`tenant_id`),
  CONSTRAINT `fk_quotation_gst_details_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quotation_gst_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quotation_gst_details_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_gst_details`
--

LOCK TABLES `quotation_gst_details` WRITE;
/*!40000 ALTER TABLE `quotation_gst_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `quotation_gst_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotation_history`
--

DROP TABLE IF EXISTS `quotation_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `quotation_id` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `user` varchar(100) DEFAULT NULL,
  `follow_up` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `idx_quotation_history_tenant` (`tenant_id`),
  CONSTRAINT `fk_quotation_history_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quotation_history_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quotation_history_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_history`
--

LOCK TABLES `quotation_history` WRITE;
/*!40000 ALTER TABLE `quotation_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `quotation_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotation_items`
--

DROP TABLE IF EXISTS `quotation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `quotation_id` int DEFAULT NULL,
  `sr_no` int DEFAULT NULL,
  `description` text,
  `quantity` decimal(10,2) DEFAULT NULL,
  `rate` decimal(15,2) DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  KEY `idx_quotation_items_tenant` (`tenant_id`),
  CONSTRAINT `fk_quotation_items_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quotation_items_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quotation_items_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_items`
--

LOCK TABLES `quotation_items` WRITE;
/*!40000 ALTER TABLE `quotation_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `quotation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `service_id` int DEFAULT NULL,
  `quotation_no` varchar(50) NOT NULL,
  `quotation_date` date NOT NULL,
  `ref_no` varchar(100) DEFAULT NULL,
  `buyer_gstin` varchar(15) DEFAULT NULL,
  `buyer_code` varchar(50) DEFAULT NULL,
  `party_address` text,
  `total_before_discount` decimal(15,2) DEFAULT '0.00',
  `discount` decimal(15,2) DEFAULT '0.00',
  `round_off` decimal(15,2) DEFAULT '0.00',
  `total_after_tax` decimal(15,2) DEFAULT '0.00',
  `status` enum('draft','sent','accepted','rejected','expired') DEFAULT 'draft',
  `valid_until` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `service_bank_details` json DEFAULT NULL,
  `service_gst_details` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotation_no` (`quotation_no`),
  KEY `idx_quotations_tenant` (`tenant_id`),
  KEY `idx_quotations_client` (`client_id`),
  KEY `idx_quotations_project` (`project_id`),
  KEY `idx_quotations_service` (`service_id`),
  KEY `fk_quotations_created_by` (`created_by`),
  CONSTRAINT `fk_quotations_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quotations_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quotations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quotations_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quotations_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotations`
--

LOCK TABLES `quotations` WRITE;
/*!40000 ALTER TABLE `quotations` DISABLE KEYS */;
/*!40000 ALTER TABLE `quotations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resignation_requests`
--

DROP TABLE IF EXISTS `resignation_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resignation_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `requested_last_day` date NOT NULL,
  `reason` text NOT NULL,
  `additional_note` text,
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `hr_note` text,
  `rejection_reason` text,
  `accepted_last_day` date DEFAULT NULL,
  `letter_url` varchar(500) DEFAULT NULL,
  `letter_generated_at` datetime DEFAULT NULL,
  `ref_number` varchar(100) DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rr_reviewer` (`reviewed_by`),
  KEY `idx_resignation_requests_tenant` (`tenant_id`),
  KEY `idx_resignation_requests_employee` (`employee_id`),
  KEY `idx_resignation_requests_status` (`status`),
  CONSTRAINT `fk_resignation_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rr_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rr_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rr_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resignation_requests`
--

LOCK TABLES `resignation_requests` WRITE;
/*!40000 ALTER TABLE `resignation_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `resignation_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salary_payments`
--

DROP TABLE IF EXISTS `salary_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `salary_record_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(80) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_salary_payments_record` (`salary_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salary_payments`
--

LOCK TABLES `salary_payments` WRITE;
/*!40000 ALTER TABLE `salary_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `salary_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salary_records`
--

DROP TABLE IF EXISTS `salary_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT '1',
  `employee_id` varchar(20) NOT NULL,
  `department_id` int NOT NULL,
  `basic_salary` decimal(10,2) NOT NULL,
  `allowances` json NOT NULL,
  `deductions` json NOT NULL,
  `net_salary` decimal(10,2) NOT NULL,
  `payment_date` date DEFAULT NULL,
  `month` varchar(20) NOT NULL,
  `year` varchar(4) NOT NULL,
  `payment_frequency` enum('Monthly','Biweekly','Weekly') DEFAULT 'Monthly',
  `status` enum('pending','paid') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `attendance_summary` json DEFAULT NULL,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `balance_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_status` varchar(50) NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `department_id` (`department_id`),
  KEY `idx_salary_employee` (`employee_id`),
  KEY `idx_salary_period` (`month`,`year`),
  KEY `idx_salary_status` (`status`),
  CONSTRAINT `salary_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `salary_records_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salary_records`
--

LOCK TABLES `salary_records` WRITE;
/*!40000 ALTER TABLE `salary_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `salary_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_settings`
--

DROP TABLE IF EXISTS `service_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `setting_type` varchar(50) NOT NULL,
  `account_holder` varchar(255) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `account_type` varchar(50) DEFAULT NULL,
  `gstin` varchar(50) DEFAULT NULL,
  `pan_number` varchar(50) DEFAULT NULL,
  `hsn_code` varchar(50) DEFAULT NULL,
  `tax_rate` decimal(8,2) DEFAULT NULL,
  `is_gst_applicable` tinyint(1) NOT NULL DEFAULT '1',
  `sgst_rate` decimal(8,2) DEFAULT NULL,
  `cgst_rate` decimal(8,2) DEFAULT NULL,
  `igst_rate` decimal(8,2) DEFAULT NULL,
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_port` int DEFAULT NULL,
  `smtp_user` varchar(255) DEFAULT NULL,
  `smtp_password` varchar(1024) DEFAULT NULL,
  `smtp_secure` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `smtp_from_email` varchar(255) DEFAULT NULL,
  `smtp_from_name` varchar(255) DEFAULT NULL,
  `smtp_encryption` enum('none','tls','ssl') NOT NULL DEFAULT 'tls',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_service_settings_tenant_type` (`tenant_id`,`setting_type`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_settings`
--

LOCK TABLES `service_settings` WRITE;
/*!40000 ALTER TABLE `service_settings` DISABLE KEYS */;
INSERT INTO `service_settings` VALUES (1,1,'smtp',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,'smtp.gmail.com',587,'manmodeaniruddha@gmail.com','v1:AduJOZhpj0ohVAWp:0AKPmyls05QKJ7hoKpt54w==:ueCXMBOSNypRyMKvuTPGSA==',0,'2026-05-23 09:27:43','2026-05-23 09:27:43','manmodeaniruddha@gmail.com','Work Desk','tls'),(2,1,'bank','Aniruddha','8839393888','ICICI','232300','Mumbai',NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-05-28 23:53:45','2026-08-14 10:42:43',NULL,NULL,'tls'),(3,1,'gst',NULL,NULL,NULL,NULL,NULL,NULL,'3423424','3423DSDFG','3434343',10.00,1,0.00,0.00,0.00,NULL,NULL,NULL,NULL,0,'2026-05-28 23:53:45','2026-05-28 23:53:45',NULL,NULL,'tls');
/*!40000 ALTER TABLE `service_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_types`
--

DROP TABLE IF EXISTS `service_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `name` varchar(120) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_service_types_tenant_name` (`tenant_id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_types`
--

LOCK TABLES `service_types` WRITE;
/*!40000 ALTER TABLE `service_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `service_name` varchar(255) NOT NULL,
  `service_type` varchar(120) DEFAULT NULL,
  `description` text,
  `assigned_department` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `service_manager` varchar(255) DEFAULT NULL,
  `scheduled_date` date DEFAULT NULL,
  `scheduled_time` time DEFAULT NULL,
  `progress` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `client_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT '0.00',
  `paid` decimal(10,2) DEFAULT '0.00',
  `due_date` date DEFAULT NULL,
  `assigned_department_id` int DEFAULT NULL,
  `service_manager_user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_services_tenant` (`tenant_id`),
  KEY `idx_services_client` (`client_id`),
  KEY `idx_services_project` (`project_id`),
  KEY `idx_services_department_id` (`assigned_department_id`),
  KEY `idx_services_manager_user` (`service_manager_user_id`),
  CONSTRAINT `fk_services_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_services_department` FOREIGN KEY (`assigned_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_services_manager_user` FOREIGN KEY (`service_manager_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_services_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_services_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,1,'New Service Engagement','Consulting',NULL,'General','Active',NULL,'2026-05-15',NULL,0,'2026-05-15 00:13:04','2026-05-15 00:13:04',NULL,NULL,0.00,0.00,NULL,NULL,NULL);
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `super_admins`
--

DROP TABLE IF EXISTS `super_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `super_admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `super_admins`
--

LOCK TABLES `super_admins` WRITE;
/*!40000 ALTER TABLE `super_admins` DISABLE KEYS */;
INSERT INTO `super_admins` VALUES (1,'Super','Admin','superadmin@workdesk.com','$2a$10$lyvq1x./HKaSzm2FT2uS3OSh.OOQ.aLG03mWlPDRNNLwksmzxqjAm',1,'2026-03-19 04:21:05','2026-03-19 05:35:56');
/*!40000 ALTER TABLE `super_admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_attendance`
--

DROP TABLE IF EXISTS `tb_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_attendance` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `employee_id` varchar(20) NOT NULL,
  `shift_id` int NOT NULL,
  `date` date NOT NULL,
  `check_in` datetime DEFAULT NULL,
  `check_out` datetime DEFAULT NULL,
  `status` enum('Present','Delayed','On Leave','Absent','Pending','Half Day') DEFAULT 'Pending',
  `approved_by` varchar(20) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_half_day` tinyint(1) DEFAULT '0',
  `is_late` tinyint(1) DEFAULT '0',
  `late_minutes` int DEFAULT '0',
  `late_streak` int DEFAULT '0',
  `worked_hours` decimal(5,2) DEFAULT '0.00',
  `scheduled_check_in` time DEFAULT NULL,
  `grace_period_minutes` int DEFAULT '15',
  `should_deduct_salary` tinyint(1) DEFAULT '0' COMMENT 'Flag to indicate if salary should be deducted for this attendance',
  `deduction_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Amount to deduct from salary',
  `deduction_reason` varchar(255) DEFAULT NULL COMMENT 'Reason for salary deduction',
  `check_in_latitude` decimal(10,8) DEFAULT NULL,
  `check_in_longitude` decimal(11,8) DEFAULT NULL,
  `check_out_latitude` decimal(10,8) DEFAULT NULL,
  `check_out_longitude` decimal(11,8) DEFAULT NULL,
  `regularization_status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `unique_employee_date` (`employee_id`,`date`),
  KEY `shift_id` (`shift_id`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_attendance_tenant` (`tenant_id`),
  CONSTRAINT `fk_attendance_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tb_attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tb_attendance_ibfk_2` FOREIGN KEY (`shift_id`) REFERENCES `tb_shifts` (`shift_id`) ON DELETE RESTRICT,
  CONSTRAINT `tb_attendance_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `employee_details` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_attendance`
--

LOCK TABLES `tb_attendance` WRITE;
/*!40000 ALTER TABLE `tb_attendance` DISABLE KEYS */;
INSERT INTO `tb_attendance` VALUES (73,1,'EMP001',14,'2026-05-25','2026-05-25 12:24:28',NULL,'Present',NULL,NULL,'','2026-05-25 06:54:27','2026-05-25 06:54:27',0,0,0,0,0.00,'17:05:00',15,0,0.00,NULL,NULL,NULL,NULL,NULL,NULL),(74,1,'EMP001',14,'2026-05-29','2026-05-29 06:03:31',NULL,'Present',NULL,NULL,'','2026-05-29 00:33:31','2026-05-29 00:33:31',0,0,0,0,0.00,'17:05:00',15,0,0.00,NULL,NULL,NULL,NULL,NULL,NULL),(75,1,'AITS003',14,'2026-05-29','2026-05-29 11:45:45',NULL,'Present',NULL,NULL,'','2026-05-29 06:15:44','2026-05-29 06:15:44',0,0,0,0,0.00,'17:05:00',15,0,0.00,NULL,NULL,NULL,NULL,NULL,NULL),(76,1,'AITS003',14,'2026-05-30','2026-05-30 09:42:35','2026-05-30 09:42:42','Present',NULL,NULL,'','2026-05-30 04:12:34','2026-05-30 04:12:42',0,0,0,0,0.00,'17:05:00',15,0,0.00,NULL,NULL,NULL,NULL,NULL,NULL),(77,1,'AITS0054',14,'2026-07-18','2026-07-18 15:29:19','2026-07-18 19:00:00','Half Day',NULL,NULL,'Auto checked out at assigned shift end (ss - 19:00:00)','2026-07-18 09:59:19','2026-07-20 13:00:00',1,0,0,0,3.51,'17:05:00',15,1,1333.33,'Worked only 3.51 hours - Half day deduction',19.12784152,74.73970815,NULL,NULL,NULL),(79,1,'AITS0054',14,'2026-07-20','2026-07-20 10:56:40','2026-07-20 19:00:00','Present',NULL,NULL,'Auto checked out at assigned shift end (ss - 19:00:00)','2026-07-20 05:26:40','2026-07-20 15:03:30',0,0,0,0,8.06,'17:05:00',15,0,0.00,NULL,19.12785228,74.73968904,NULL,NULL,NULL),(83,1,'AITS0054',14,'2026-07-21','2026-07-21 09:53:00','2026-07-21 19:20:00','Present',NULL,NULL,'Late check-in by 76 minutes','2026-07-21 05:45:50','2026-07-22 08:06:34',1,1,76,1,0.25,'10:00:00',15,1,1333.33,'Worked only 0.25 hours - Half day deduction',NULL,NULL,19.12786680,74.73938600,'Approved'),(84,1,'AITS0054',14,'2026-07-17','2026-07-17 10:00:00','2026-07-17 19:10:00','Present',NULL,NULL,NULL,'2026-07-22 07:43:03','2026-07-22 07:43:03',0,0,0,0,0.00,NULL,15,0,0.00,NULL,NULL,NULL,NULL,NULL,'Approved'),(85,1,'AITS0054',14,'2026-07-09','2026-07-09 09:00:00','2026-07-09 19:20:00','Present',NULL,NULL,NULL,'2026-07-23 11:25:28','2026-07-23 11:25:28',0,0,0,0,0.00,NULL,15,0,0.00,NULL,NULL,NULL,NULL,NULL,'Approved'),(86,1,'AITS0054',14,'2026-07-27','2026-07-27 18:29:33',NULL,'Delayed',NULL,NULL,'Late check-in by 510 minutes','2026-07-27 12:59:33','2026-07-27 12:59:33',0,1,510,1,0.00,'10:00:00',15,0,0.00,NULL,19.12786516,74.73955940,NULL,NULL,NULL),(87,1,'AITS0054',14,'2026-08-13','2026-08-13 12:25:47',NULL,'Delayed',NULL,NULL,'Late check-in by 146 minutes','2026-08-13 06:55:47','2026-08-13 06:55:47',0,1,146,1,0.00,'10:00:00',15,0,0.00,NULL,19.12784670,74.73937830,NULL,NULL,NULL);
/*!40000 ALTER TABLE `tb_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_employee_shifts`
--

DROP TABLE IF EXISTS `tb_employee_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_employee_shifts` (
  `emp_shift_id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `employee_id` varchar(20) NOT NULL,
  `shift_id` int NOT NULL,
  `assigned_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`emp_shift_id`),
  UNIQUE KEY `unique_employee_shift_date` (`employee_id`,`shift_id`,`assigned_date`),
  KEY `shift_id` (`shift_id`),
  KEY `idx_emp_shifts_tenant` (`tenant_id`),
  CONSTRAINT `fk_emp_shifts_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tb_employee_shifts_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tb_employee_shifts_ibfk_2` FOREIGN KEY (`shift_id`) REFERENCES `tb_shifts` (`shift_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=309 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_employee_shifts`
--

LOCK TABLES `tb_employee_shifts` WRITE;
/*!40000 ALTER TABLE `tb_employee_shifts` DISABLE KEYS */;
INSERT INTO `tb_employee_shifts` VALUES (284,NULL,'AD001',14,'2026-05-15','2026-05-14 23:48:14','2026-05-14 23:48:14'),(286,1,'EMP001',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(287,1,'EMP011',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(288,1,'EMP008',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(289,1,'AITS003',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(290,1,'AD001',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(291,1,'EMP015',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(292,1,'EMP016',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(293,1,'EMP009',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(294,1,'EMP014',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(295,1,'EMP017',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(296,1,'EMP012',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(297,1,'EMP006',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(298,1,'EMP010',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(299,1,'EMP002',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(300,1,'EMP003',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(301,1,'EMP018',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(302,1,'EMP007',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(303,1,'AITS0054',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(304,1,'EMP013',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(305,1,'EMP020',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(306,1,'EMP004',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(307,1,'EMP005',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02'),(308,1,'EMP019',14,'2026-07-20','2026-07-20 10:32:02','2026-07-20 10:32:02');
/*!40000 ALTER TABLE `tb_employee_shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_holidays`
--

DROP TABLE IF EXISTS `tb_holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_holidays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `tenant_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_holiday_date_tenant` (`date`,`tenant_id`),
  KEY `idx_date` (`date`),
  KEY `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_tb_holidays_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_holidays`
--

LOCK TABLES `tb_holidays` WRITE;
/*!40000 ALTER TABLE `tb_holidays` DISABLE KEYS */;
INSERT INTO `tb_holidays` VALUES (55,'diwali','2026-05-05','diwali',1,1,'2026-05-16 11:39:37','2026-05-16 11:39:37'),(56,'sta','2026-05-09','sta',1,1,'2026-05-16 11:39:44','2026-05-16 11:39:44'),(57,'sta','2026-05-02','sta',1,1,'2026-05-16 11:39:48','2026-05-16 11:39:48'),(60,'aa','2026-05-06','aa',1,1,'2026-05-16 11:41:03','2026-05-16 11:41:03'),(61,'Friday Holiday','2026-05-22','Added as holiday',1,1,'2026-05-29 07:07:14','2026-05-29 07:07:14'),(62,'hello','2026-06-03','[Company] asach',1,1,'2026-06-03 07:58:41','2026-06-03 07:58:41'),(63,'hi','2026-06-09','[Gazetted]',1,1,'2026-06-03 13:05:54','2026-06-03 13:05:54');
/*!40000 ALTER TABLE `tb_holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_salary_payments`
--

DROP TABLE IF EXISTS `tb_salary_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_salary_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `salary_record_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','bank_transfer','cheque','upi') DEFAULT 'bank_transfer',
  `transaction_id` varchar(100) DEFAULT NULL,
  `notes` text,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `recorded_by` int DEFAULT NULL,
  `tenant_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_salary_record` (`salary_record_id`),
  KEY `idx_tenant` (`tenant_id`),
  KEY `fk_tb_salary_payments_recorded_by` (`recorded_by`),
  CONSTRAINT `fk_tb_salary_payments_record` FOREIGN KEY (`salary_record_id`) REFERENCES `tb_salary_records` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tb_salary_payments_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tb_salary_payments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tb_salary_payments_ibfk_1` FOREIGN KEY (`salary_record_id`) REFERENCES `tb_salary_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_salary_payments`
--

LOCK TABLES `tb_salary_payments` WRITE;
/*!40000 ALTER TABLE `tb_salary_payments` DISABLE KEYS */;
INSERT INTO `tb_salary_payments` VALUES (1,2,8333.33,'bank_transfer',NULL,NULL,'2026-05-14 10:38:47',NULL,1),(2,3,7999.97,'bank_transfer',NULL,NULL,'2026-05-14 10:45:12',NULL,1),(3,1,8000.00,'cheque',NULL,NULL,'2026-05-15 05:52:03',NULL,1),(4,3,33000.00,'bank_transfer',NULL,NULL,'2026-05-15 05:53:46',NULL,1);
/*!40000 ALTER TABLE `tb_salary_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_salary_records`
--

DROP TABLE IF EXISTS `tb_salary_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_salary_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) NOT NULL,
  `month` varchar(20) NOT NULL,
  `year` int NOT NULL,
  `month_number` int NOT NULL,
  `basic_salary` decimal(10,2) DEFAULT '0.00',
  `total_working_days` int DEFAULT '0',
  `present_days` int DEFAULT '0',
  `absent_days` int DEFAULT '0',
  `half_days` int DEFAULT '0',
  `late_days` int DEFAULT '0',
  `paid_leaves_used` int DEFAULT '0',
  `unpaid_leaves` int DEFAULT '0',
  `holiday_days` int DEFAULT '0',
  `gross_salary` decimal(10,2) DEFAULT '0.00',
  `deduction_amount` decimal(10,2) DEFAULT '0.00',
  `net_salary` decimal(10,2) DEFAULT '0.00',
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `balance_amount` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('pending','partial','paid') DEFAULT 'pending',
  `payment_date` date DEFAULT NULL,
  `details` json DEFAULT NULL,
  `tenant_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_month` (`employee_id`,`month_number`,`year`),
  KEY `idx_tenant` (`tenant_id`),
  KEY `idx_status` (`payment_status`),
  CONSTRAINT `fk_tb_salary_records_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_salary_records`
--

LOCK TABLES `tb_salary_records` WRITE;
/*!40000 ALTER TABLE `tb_salary_records` DISABLE KEYS */;
INSERT INTO `tb_salary_records` VALUES (1,'AD001','May',2026,5,0.00,26,6,20,0,0,0,0,0,0.00,0.00,0.00,8000.00,0.00,'pending','2026-05-15','{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 0, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 0, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-11 10:47:08','2026-07-20 05:25:08'),(2,'AITS001','May',2026,5,0.00,26,6,20,0,0,0,0,0,0.00,0.00,0.00,8333.33,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 22, \"gross_salary\": 0, \"holiday_days\": 4, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 5, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 22, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-11 10:47:08','2026-05-16 10:25:33'),(3,'AITS002','May',2026,5,0.00,26,6,20,0,0,0,0,6,0.00,0.00,0.00,41000.00,0.00,'pending','2026-05-15','{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 22, \"gross_salary\": 0, \"holiday_days\": 4, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 5, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 22, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-14 09:44:58','2026-05-16 10:25:33'),(4,'AD001','June',2026,6,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 0, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 0, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-15 10:33:48','2026-07-18 10:02:13'),(5,'AITS001','June',2026,6,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 0, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 4, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-15 10:33:48','2026-05-15 10:33:48'),(6,'AITS002','June',2026,6,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 0, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 4, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-15 10:33:48','2026-05-15 10:33:48'),(7,'AITS003','May',2026,5,833.00,0,0,0,0,0,0,0,0,833.00,511.00,322.00,0.00,322.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 12, \"daily_rate\": 27, \"total_days\": 31, \"absent_days\": 19, \"gross_salary\": 833, \"holiday_days\": 5, \"present_days\": 2, \"deduction_days\": 19, \"effective_days\": 12, \"monthly_salary\": 833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 511, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": null, \"daily_rate\": 27, \"net_salary\": 322, \"deduction_days\": 19, \"effective_days\": 12, \"monthly_salary\": 833, \"total_deduction\": 511}, \"has_attendance_data\": true, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 511}',1,'2026-05-16 10:25:33','2026-07-20 05:25:08'),(8,'AITS004','May',2026,5,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 22, \"gross_salary\": 0, \"holiday_days\": 4, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 5, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 22, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-16 10:25:33','2026-05-16 10:25:33'),(9,'AITS005','May',2026,5,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 22, \"gross_salary\": 0, \"holiday_days\": 4, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 5, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 22, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-16 10:25:33','2026-05-16 10:25:33'),(10,'AITS006','May',2026,5,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 22, \"gross_salary\": 0, \"holiday_days\": 4, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 5, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 22, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-16 10:25:33','2026-05-16 10:25:33'),(11,'AITS007','May',2026,5,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 22, \"gross_salary\": 0, \"holiday_days\": 4, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 5, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 22, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-16 10:25:33','2026-05-16 10:25:33'),(12,'AITS008','May',2026,5,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 22, \"gross_salary\": 0, \"holiday_days\": 4, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 5, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 22, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-16 10:25:33','2026-05-16 10:25:33'),(13,'AITS009','May',2026,5,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 22, \"gross_salary\": 0, \"holiday_days\": 4, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 5, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 22, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-16 10:25:33','2026-05-16 10:25:33'),(14,'AITS010','May',2026,5,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 22, \"gross_salary\": 0, \"holiday_days\": 4, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"total_deduction\": 0, \"weekly_off_days\": 5, \"paid_leave_limit\": 2, \"unpaid_leave_days\": 0, \"total_working_days\": 22, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-05-16 10:25:33','2026-05-16 10:25:33'),(15,'EMP001','May',2026,5,62500.00,0,0,0,0,0,0,0,0,62500.00,38306.00,24194.00,0.00,24194.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 12, \"daily_rate\": 2016, \"total_days\": 31, \"absent_days\": 19, \"gross_salary\": 62500, \"holiday_days\": 5, \"present_days\": 2, \"deduction_days\": 19, \"effective_days\": 12, \"monthly_salary\": 62500, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 38306, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": null, \"daily_rate\": 2016, \"net_salary\": 24194, \"deduction_days\": 19, \"effective_days\": 12, \"monthly_salary\": 62500, \"total_deduction\": 38306}, \"has_attendance_data\": true, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 38306}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(16,'EMP002','May',2026,5,56667.00,0,0,0,0,0,0,0,0,56667.00,56667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1828, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 56667, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 56667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 56667, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1828, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 56667, \"total_deduction\": 56667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 56667}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(17,'EMP003','May',2026,5,45833.00,0,0,0,0,0,0,0,0,45833.00,45833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1478, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 45833, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 45833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 45833, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1478, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 45833, \"total_deduction\": 45833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 45833}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(18,'EMP004','May',2026,5,51667.00,0,0,0,0,0,0,0,0,51667.00,51667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1667, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 51667, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 51667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 51667, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1667, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 51667, \"total_deduction\": 51667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 51667}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(19,'EMP005','May',2026,5,66667.00,0,0,0,0,0,0,0,0,66667.00,66667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2151, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 66667, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 66667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 66667, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2151, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 66667, \"total_deduction\": 66667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 66667}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(20,'EMP006','May',2026,5,58333.00,0,0,0,0,0,0,0,0,58333.00,58333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1882, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 58333, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 58333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 58333, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1882, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 58333, \"total_deduction\": 58333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 58333}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(21,'EMP007','May',2026,5,60000.00,0,0,0,0,0,0,0,0,60000.00,60000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1935, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 60000, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 60000, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1935, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"total_deduction\": 60000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 60000}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(22,'EMP008','May',2026,5,37500.00,0,0,0,0,0,0,0,0,37500.00,37500.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1210, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 37500, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 37500, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 37500, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1210, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 37500, \"total_deduction\": 37500}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 37500}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(23,'EMP009','May',2026,5,65000.00,0,0,0,0,0,0,0,0,65000.00,65000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2097, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 65000, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 65000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 65000, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2097, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 65000, \"total_deduction\": 65000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 65000}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(24,'EMP010','May',2026,5,55833.00,0,0,0,0,0,0,0,0,55833.00,55833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1801, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 55833, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 55833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 55833, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1801, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 55833, \"total_deduction\": 55833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 55833}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(25,'EMP011','May',2026,5,75000.00,0,0,0,0,0,0,0,0,75000.00,75000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2419, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 75000, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 75000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 75000, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2419, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 75000, \"total_deduction\": 75000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 75000}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(26,'EMP012','May',2026,5,48333.00,0,0,0,0,0,0,0,0,48333.00,48333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1559, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 48333, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 48333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 48333, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1559, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 48333, \"total_deduction\": 48333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 48333}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(27,'EMP013','May',2026,5,53333.00,0,0,0,0,0,0,0,0,53333.00,53333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1720, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 53333, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 53333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 53333, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1720, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 53333, \"total_deduction\": 53333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 53333}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(28,'EMP014','May',2026,5,41667.00,0,0,0,0,0,0,0,0,41667.00,41667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1344, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 41667, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 41667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 41667, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1344, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 41667, \"total_deduction\": 41667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 41667}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(29,'EMP015','May',2026,5,70833.00,0,0,0,0,0,0,0,0,70833.00,70833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2285, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 70833, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 70833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 70833, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2285, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 70833, \"total_deduction\": 70833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 70833}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(30,'EMP016','May',2026,5,50833.00,0,0,0,0,0,0,0,0,50833.00,50833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1640, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 50833, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 50833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 50833, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1640, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 50833, \"total_deduction\": 50833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 50833}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(31,'EMP017','May',2026,5,49167.00,0,0,0,0,0,0,0,0,49167.00,49167.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1586, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 49167, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 49167, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 49167, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1586, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 49167, \"total_deduction\": 49167}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 49167}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(32,'EMP018','May',2026,5,44167.00,0,0,0,0,0,0,0,0,44167.00,44167.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1425, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 44167, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 44167, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 44167, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1425, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 44167, \"total_deduction\": 44167}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 44167}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(33,'EMP019','May',2026,5,60000.00,0,0,0,0,0,0,0,0,60000.00,60000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1935, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 60000, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 60000, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1935, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"total_deduction\": 60000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 60000}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(34,'EMP020','May',2026,5,40000.00,0,0,0,0,0,0,0,0,40000.00,40000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1290, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 40000, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 40000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 40000, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1290, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 40000, \"total_deduction\": 40000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 40000}',1,'2026-05-29 07:01:25','2026-07-20 05:25:08'),(35,'AD001','July',2026,7,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 0, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 0, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(36,'AITS003','July',2026,7,833.00,0,0,0,0,0,0,0,0,833.00,833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 27, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 27, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 833, \"total_deduction\": 833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 833}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(37,'AITS0054','July',2026,7,6667.00,0,0,0,0,0,0,0,0,6667.00,5742.00,925.00,0.00,925.00,'pending',NULL,'{\"half_days\": 1, \"late_days\": 1, \"paid_days\": 10.5, \"daily_rate\": 215, \"total_days\": 31, \"absent_days\": 20, \"gross_salary\": 6667, \"holiday_days\": 0, \"present_days\": 3, \"deduction_days\": 20.5, \"effective_days\": 10.5, \"monthly_salary\": 6667, \"paid_leave_days\": 2, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 5742, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": null, \"daily_rate\": 215, \"net_salary\": 925, \"deduction_days\": 20.5, \"effective_days\": 10.5, \"monthly_salary\": 6667, \"total_deduction\": 5742}, \"has_attendance_data\": true, \"leave_policy_applied\": true, \"attendance_deductions\": 1333, \"leave_and_absence_deduction\": 4409}',1,'2026-07-18 10:01:38','2026-08-13 06:26:28'),(38,'EMP001','July',2026,7,62500.00,0,0,0,0,0,0,0,0,62500.00,62500.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2016, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 62500, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 62500, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 62500, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2016, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 62500, \"total_deduction\": 62500}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 62500}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(39,'EMP002','July',2026,7,56667.00,0,0,0,0,0,0,0,0,56667.00,56667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1828, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 56667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 56667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 56667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1828, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 56667, \"total_deduction\": 56667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 56667}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(40,'EMP003','July',2026,7,45833.00,0,0,0,0,0,0,0,0,45833.00,45833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1478, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 45833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 45833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 45833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1478, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 45833, \"total_deduction\": 45833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 45833}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(41,'EMP004','July',2026,7,51667.00,0,0,0,0,0,0,0,0,51667.00,51667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1667, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 51667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 51667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 51667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1667, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 51667, \"total_deduction\": 51667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 51667}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(42,'EMP005','July',2026,7,66667.00,0,0,0,0,0,0,0,0,66667.00,66667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2151, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 66667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 66667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 66667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2151, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 66667, \"total_deduction\": 66667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 66667}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(43,'EMP006','July',2026,7,58333.00,0,0,0,0,0,0,0,0,58333.00,58333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1882, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 58333, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 58333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 58333, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1882, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 58333, \"total_deduction\": 58333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 58333}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(44,'EMP007','July',2026,7,60000.00,0,0,0,0,0,0,0,0,60000.00,60000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1935, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 60000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 60000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1935, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"total_deduction\": 60000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 60000}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(45,'EMP008','July',2026,7,37500.00,0,0,0,0,0,0,0,0,37500.00,37500.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1210, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 37500, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 37500, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 37500, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1210, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 37500, \"total_deduction\": 37500}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 37500}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(46,'EMP009','July',2026,7,65000.00,0,0,0,0,0,0,0,0,65000.00,65000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2097, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 65000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 65000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 65000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2097, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 65000, \"total_deduction\": 65000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 65000}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(47,'EMP010','July',2026,7,55833.00,0,0,0,0,0,0,0,0,55833.00,55833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1801, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 55833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 55833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 55833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1801, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 55833, \"total_deduction\": 55833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 55833}',1,'2026-07-18 10:01:38','2026-07-18 10:01:38'),(48,'EMP011','July',2026,7,75000.00,0,0,0,0,0,0,0,0,75000.00,75000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2419, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 75000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 75000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 75000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2419, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 75000, \"total_deduction\": 75000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 75000}',1,'2026-07-18 10:01:39','2026-07-18 10:01:39'),(49,'EMP012','July',2026,7,48333.00,0,0,0,0,0,0,0,0,48333.00,48333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1559, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 48333, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 48333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 48333, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1559, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 48333, \"total_deduction\": 48333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 48333}',1,'2026-07-18 10:01:39','2026-07-18 10:01:39'),(50,'EMP013','July',2026,7,53333.00,0,0,0,0,0,0,0,0,53333.00,53333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1720, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 53333, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 53333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 53333, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1720, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 53333, \"total_deduction\": 53333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 53333}',1,'2026-07-18 10:01:39','2026-07-18 10:01:39'),(51,'EMP014','July',2026,7,41667.00,0,0,0,0,0,0,0,0,41667.00,41667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1344, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 41667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 41667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 41667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1344, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 41667, \"total_deduction\": 41667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 41667}',1,'2026-07-18 10:01:39','2026-07-18 10:01:39'),(52,'EMP015','July',2026,7,70833.00,0,0,0,0,0,0,0,0,70833.00,70833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2285, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 70833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 70833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 70833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2285, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 70833, \"total_deduction\": 70833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 70833}',1,'2026-07-18 10:01:39','2026-07-18 10:01:39'),(53,'EMP016','July',2026,7,50833.00,0,0,0,0,0,0,0,0,50833.00,50833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1640, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 50833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 50833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 50833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1640, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 50833, \"total_deduction\": 50833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 50833}',1,'2026-07-18 10:01:39','2026-07-18 10:01:39'),(54,'EMP017','July',2026,7,49167.00,0,0,0,0,0,0,0,0,49167.00,49167.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1586, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 49167, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 49167, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 49167, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1586, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 49167, \"total_deduction\": 49167}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 49167}',1,'2026-07-18 10:01:39','2026-07-18 10:01:39'),(55,'EMP018','July',2026,7,44167.00,0,0,0,0,0,0,0,0,44167.00,44167.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1425, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 44167, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 44167, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 44167, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1425, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 44167, \"total_deduction\": 44167}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 44167}',1,'2026-07-18 10:01:39','2026-07-18 10:01:39'),(56,'EMP019','July',2026,7,60000.00,0,0,0,0,0,0,0,0,60000.00,60000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1935, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 60000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 60000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1935, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"total_deduction\": 60000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 60000}',1,'2026-07-18 10:01:39','2026-07-18 10:01:39'),(57,'EMP020','July',2026,7,40000.00,0,0,0,0,0,0,0,0,40000.00,40000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1290, \"total_days\": 31, \"absent_days\": 27, \"gross_salary\": 40000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 40000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 40000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 27, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1290, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 40000, \"total_deduction\": 40000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 40000}',1,'2026-07-18 10:01:39','2026-07-18 10:01:39'),(58,'AITS003','June',2026,6,833.00,0,0,0,0,0,0,0,0,833.00,833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 28, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 833, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 28, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 833, \"total_deduction\": 833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 833}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(59,'AITS0054','June',2026,6,6667.00,0,0,0,0,0,0,0,0,6667.00,6667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 222, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 6667, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 6667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 6667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 222, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 6667, \"total_deduction\": 6667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 6667}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(60,'EMP001','June',2026,6,62500.00,0,0,0,0,0,0,0,0,62500.00,62500.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2083, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 62500, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 62500, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 62500, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2083, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 62500, \"total_deduction\": 62500}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 62500}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(61,'EMP002','June',2026,6,56667.00,0,0,0,0,0,0,0,0,56667.00,56667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1889, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 56667, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 56667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 56667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1889, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 56667, \"total_deduction\": 56667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 56667}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(62,'EMP003','June',2026,6,45833.00,0,0,0,0,0,0,0,0,45833.00,45833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1528, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 45833, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 45833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 45833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1528, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 45833, \"total_deduction\": 45833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 45833}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(63,'EMP004','June',2026,6,51667.00,0,0,0,0,0,0,0,0,51667.00,51667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1722, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 51667, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 51667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 51667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1722, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 51667, \"total_deduction\": 51667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 51667}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(64,'EMP005','June',2026,6,66667.00,0,0,0,0,0,0,0,0,66667.00,66667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2222, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 66667, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 66667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 66667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2222, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 66667, \"total_deduction\": 66667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 66667}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(65,'EMP006','June',2026,6,58333.00,0,0,0,0,0,0,0,0,58333.00,58333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1944, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 58333, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 58333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 58333, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1944, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 58333, \"total_deduction\": 58333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 58333}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(66,'EMP007','June',2026,6,60000.00,0,0,0,0,0,0,0,0,60000.00,60000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2000, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 60000, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 60000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 60000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2000, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 60000, \"total_deduction\": 60000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 60000}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(67,'EMP008','June',2026,6,37500.00,0,0,0,0,0,0,0,0,37500.00,37500.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1250, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 37500, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 37500, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 37500, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1250, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 37500, \"total_deduction\": 37500}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 37500}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(68,'EMP009','June',2026,6,65000.00,0,0,0,0,0,0,0,0,65000.00,65000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2167, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 65000, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 65000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 65000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2167, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 65000, \"total_deduction\": 65000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 65000}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(69,'EMP010','June',2026,6,55833.00,0,0,0,0,0,0,0,0,55833.00,55833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1861, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 55833, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 55833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 55833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1861, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 55833, \"total_deduction\": 55833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 55833}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(70,'EMP011','June',2026,6,75000.00,0,0,0,0,0,0,0,0,75000.00,75000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2500, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 75000, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 75000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 75000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2500, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 75000, \"total_deduction\": 75000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 75000}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(71,'EMP012','June',2026,6,48333.00,0,0,0,0,0,0,0,0,48333.00,48333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1611, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 48333, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 48333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 48333, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1611, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 48333, \"total_deduction\": 48333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 48333}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(72,'EMP013','June',2026,6,53333.00,0,0,0,0,0,0,0,0,53333.00,53333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1778, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 53333, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 53333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 53333, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1778, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 53333, \"total_deduction\": 53333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 53333}',1,'2026-07-18 10:02:13','2026-07-18 10:02:13'),(73,'EMP014','June',2026,6,41667.00,0,0,0,0,0,0,0,0,41667.00,41667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1389, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 41667, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 41667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 41667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1389, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 41667, \"total_deduction\": 41667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 41667}',1,'2026-07-18 10:02:14','2026-07-18 10:02:14'),(74,'EMP015','June',2026,6,70833.00,0,0,0,0,0,0,0,0,70833.00,70833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2361, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 70833, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 70833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 70833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2361, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 70833, \"total_deduction\": 70833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 70833}',1,'2026-07-18 10:02:14','2026-07-18 10:02:14'),(75,'EMP016','June',2026,6,50833.00,0,0,0,0,0,0,0,0,50833.00,50833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1694, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 50833, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 50833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 50833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1694, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 50833, \"total_deduction\": 50833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 50833}',1,'2026-07-18 10:02:14','2026-07-18 10:02:14'),(76,'EMP017','June',2026,6,49167.00,0,0,0,0,0,0,0,0,49167.00,49167.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1639, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 49167, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 49167, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 49167, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1639, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 49167, \"total_deduction\": 49167}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 49167}',1,'2026-07-18 10:02:14','2026-07-18 10:02:14'),(77,'EMP018','June',2026,6,44167.00,0,0,0,0,0,0,0,0,44167.00,44167.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1472, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 44167, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 44167, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 44167, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1472, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 44167, \"total_deduction\": 44167}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 44167}',1,'2026-07-18 10:02:14','2026-07-18 10:02:14'),(78,'EMP019','June',2026,6,60000.00,0,0,0,0,0,0,0,0,60000.00,60000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2000, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 60000, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 60000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 60000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2000, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 60000, \"total_deduction\": 60000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 60000}',1,'2026-07-18 10:02:14','2026-07-18 10:02:14'),(79,'EMP020','June',2026,6,40000.00,0,0,0,0,0,0,0,0,40000.00,40000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1333, \"total_days\": 30, \"absent_days\": 24, \"gross_salary\": 40000, \"holiday_days\": 2, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 40000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 40000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 24, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1333, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 40000, \"total_deduction\": 40000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 40000}',1,'2026-07-18 10:02:14','2026-07-18 10:02:14'),(80,'AITS0054','May',2026,5,6667.00,0,0,0,0,0,0,0,0,6667.00,6667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 215, \"total_days\": 31, \"absent_days\": 21, \"gross_salary\": 6667, \"holiday_days\": 5, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 6667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 6667, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 21, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 215, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 6667, \"total_deduction\": 6667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 6667}',1,'2026-07-20 05:25:08','2026-07-20 05:25:08'),(81,'AD001','March',2026,3,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 0, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 0, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(82,'AITS003','March',2026,3,833.00,0,0,0,0,0,0,0,0,833.00,833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 27, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 833, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 27, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 833, \"total_deduction\": 833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 833}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(83,'AITS0054','March',2026,3,6667.00,0,0,0,0,0,0,0,0,6667.00,6667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 215, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 6667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 6667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 6667, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 215, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 6667, \"total_deduction\": 6667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 6667}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(84,'EMP001','March',2026,3,62500.00,0,0,0,0,0,0,0,0,62500.00,62500.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2016, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 62500, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 62500, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 62500, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2016, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 62500, \"total_deduction\": 62500}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 62500}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(85,'EMP002','March',2026,3,56667.00,0,0,0,0,0,0,0,0,56667.00,56667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1828, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 56667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 56667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 56667, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1828, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 56667, \"total_deduction\": 56667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 56667}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(86,'EMP003','March',2026,3,45833.00,0,0,0,0,0,0,0,0,45833.00,45833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1478, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 45833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 45833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 45833, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1478, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 45833, \"total_deduction\": 45833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 45833}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(87,'EMP004','March',2026,3,51667.00,0,0,0,0,0,0,0,0,51667.00,51667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1667, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 51667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 51667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 51667, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1667, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 51667, \"total_deduction\": 51667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 51667}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(88,'EMP005','March',2026,3,66667.00,0,0,0,0,0,0,0,0,66667.00,66667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2151, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 66667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 66667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 66667, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2151, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 66667, \"total_deduction\": 66667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 66667}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(89,'EMP006','March',2026,3,58333.00,0,0,0,0,0,0,0,0,58333.00,58333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1882, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 58333, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 58333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 58333, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1882, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 58333, \"total_deduction\": 58333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 58333}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(90,'EMP007','March',2026,3,60000.00,0,0,0,0,0,0,0,0,60000.00,60000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1935, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 60000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 60000, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1935, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"total_deduction\": 60000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 60000}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(91,'EMP008','March',2026,3,37500.00,0,0,0,0,0,0,0,0,37500.00,37500.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1210, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 37500, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 37500, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 37500, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1210, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 37500, \"total_deduction\": 37500}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 37500}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(92,'EMP009','March',2026,3,65000.00,0,0,0,0,0,0,0,0,65000.00,65000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2097, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 65000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 65000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 65000, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2097, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 65000, \"total_deduction\": 65000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 65000}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(93,'EMP010','March',2026,3,55833.00,0,0,0,0,0,0,0,0,55833.00,55833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1801, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 55833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 55833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 55833, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1801, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 55833, \"total_deduction\": 55833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 55833}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(94,'EMP011','March',2026,3,75000.00,0,0,0,0,0,0,0,0,75000.00,75000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2419, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 75000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 75000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 75000, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2419, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 75000, \"total_deduction\": 75000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 75000}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(95,'EMP012','March',2026,3,48333.00,0,0,0,0,0,0,0,0,48333.00,48333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1559, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 48333, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 48333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 48333, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1559, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 48333, \"total_deduction\": 48333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 48333}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(96,'EMP013','March',2026,3,53333.00,0,0,0,0,0,0,0,0,53333.00,53333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1720, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 53333, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 53333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 53333, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1720, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 53333, \"total_deduction\": 53333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 53333}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(97,'EMP014','March',2026,3,41667.00,0,0,0,0,0,0,0,0,41667.00,41667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1344, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 41667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 41667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 41667, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1344, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 41667, \"total_deduction\": 41667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 41667}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(98,'EMP015','March',2026,3,70833.00,0,0,0,0,0,0,0,0,70833.00,70833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2285, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 70833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 70833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 70833, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2285, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 70833, \"total_deduction\": 70833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 70833}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(99,'EMP016','March',2026,3,50833.00,0,0,0,0,0,0,0,0,50833.00,50833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1640, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 50833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 50833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 50833, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1640, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 50833, \"total_deduction\": 50833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 50833}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(100,'EMP017','March',2026,3,49167.00,0,0,0,0,0,0,0,0,49167.00,49167.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1586, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 49167, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 49167, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 49167, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1586, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 49167, \"total_deduction\": 49167}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 49167}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(101,'EMP018','March',2026,3,44167.00,0,0,0,0,0,0,0,0,44167.00,44167.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1425, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 44167, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 44167, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 44167, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1425, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 44167, \"total_deduction\": 44167}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 44167}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(102,'EMP019','March',2026,3,60000.00,0,0,0,0,0,0,0,0,60000.00,60000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1935, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 60000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 60000, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1935, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 60000, \"total_deduction\": 60000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 60000}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(103,'EMP020','March',2026,3,40000.00,0,0,0,0,0,0,0,0,40000.00,40000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1290, \"total_days\": 31, \"absent_days\": 26, \"gross_salary\": 40000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 40000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 40000, \"weekly_off_days\": 5, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1290, \"net_salary\": 0, \"deduction_days\": 31, \"effective_days\": 0, \"monthly_salary\": 40000, \"total_deduction\": 40000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 40000}',1,'2026-07-20 05:25:23','2026-07-20 05:25:23'),(104,'AD001','April',2026,4,0.00,0,0,0,0,0,0,0,0,0.00,0.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 0, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 0, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 0, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 0, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 0, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 0, \"total_deduction\": 0}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 0}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(105,'AITS003','April',2026,4,833.00,0,0,0,0,0,0,0,0,833.00,833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 28, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 28, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 833, \"total_deduction\": 833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 833}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(106,'AITS0054','April',2026,4,6667.00,0,0,0,0,0,0,0,0,6667.00,6667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 222, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 6667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 6667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 6667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 222, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 6667, \"total_deduction\": 6667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 6667}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(107,'EMP001','April',2026,4,62500.00,0,0,0,0,0,0,0,0,62500.00,62500.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2083, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 62500, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 62500, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 62500, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2083, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 62500, \"total_deduction\": 62500}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 62500}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(108,'EMP002','April',2026,4,56667.00,0,0,0,0,0,0,0,0,56667.00,56667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1889, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 56667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 56667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 56667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1889, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 56667, \"total_deduction\": 56667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 56667}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(109,'EMP003','April',2026,4,45833.00,0,0,0,0,0,0,0,0,45833.00,45833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1528, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 45833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 45833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 45833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1528, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 45833, \"total_deduction\": 45833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 45833}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(110,'EMP004','April',2026,4,51667.00,0,0,0,0,0,0,0,0,51667.00,51667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1722, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 51667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 51667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 51667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1722, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 51667, \"total_deduction\": 51667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 51667}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(111,'EMP005','April',2026,4,66667.00,0,0,0,0,0,0,0,0,66667.00,66667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2222, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 66667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 66667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 66667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2222, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 66667, \"total_deduction\": 66667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 66667}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(112,'EMP006','April',2026,4,58333.00,0,0,0,0,0,0,0,0,58333.00,58333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1944, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 58333, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 58333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 58333, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1944, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 58333, \"total_deduction\": 58333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 58333}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(113,'EMP007','April',2026,4,60000.00,0,0,0,0,0,0,0,0,60000.00,60000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2000, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 60000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 60000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 60000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2000, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 60000, \"total_deduction\": 60000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 60000}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(114,'EMP008','April',2026,4,37500.00,0,0,0,0,0,0,0,0,37500.00,37500.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1250, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 37500, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 37500, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 37500, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1250, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 37500, \"total_deduction\": 37500}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 37500}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(115,'EMP009','April',2026,4,65000.00,0,0,0,0,0,0,0,0,65000.00,65000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2167, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 65000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 65000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 65000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2167, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 65000, \"total_deduction\": 65000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 65000}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(116,'EMP010','April',2026,4,55833.00,0,0,0,0,0,0,0,0,55833.00,55833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1861, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 55833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 55833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 55833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1861, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 55833, \"total_deduction\": 55833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 55833}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(117,'EMP011','April',2026,4,75000.00,0,0,0,0,0,0,0,0,75000.00,75000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2500, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 75000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 75000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 75000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2500, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 75000, \"total_deduction\": 75000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 75000}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(118,'EMP012','April',2026,4,48333.00,0,0,0,0,0,0,0,0,48333.00,48333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1611, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 48333, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 48333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 48333, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1611, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 48333, \"total_deduction\": 48333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 48333}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(119,'EMP013','April',2026,4,53333.00,0,0,0,0,0,0,0,0,53333.00,53333.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1778, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 53333, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 53333, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 53333, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1778, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 53333, \"total_deduction\": 53333}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 53333}',1,'2026-07-20 12:49:00','2026-07-20 12:49:00'),(120,'EMP014','April',2026,4,41667.00,0,0,0,0,0,0,0,0,41667.00,41667.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1389, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 41667, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 41667, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 41667, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1389, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 41667, \"total_deduction\": 41667}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 41667}',1,'2026-07-20 12:49:01','2026-07-20 12:49:01'),(121,'EMP015','April',2026,4,70833.00,0,0,0,0,0,0,0,0,70833.00,70833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2361, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 70833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 70833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 70833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2361, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 70833, \"total_deduction\": 70833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 70833}',1,'2026-07-20 12:49:01','2026-07-20 12:49:01'),(122,'EMP016','April',2026,4,50833.00,0,0,0,0,0,0,0,0,50833.00,50833.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1694, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 50833, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 50833, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 50833, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1694, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 50833, \"total_deduction\": 50833}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 50833}',1,'2026-07-20 12:49:01','2026-07-20 12:49:01'),(123,'EMP017','April',2026,4,49167.00,0,0,0,0,0,0,0,0,49167.00,49167.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1639, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 49167, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 49167, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 49167, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1639, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 49167, \"total_deduction\": 49167}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 49167}',1,'2026-07-20 12:49:01','2026-07-20 12:49:01'),(124,'EMP018','April',2026,4,44167.00,0,0,0,0,0,0,0,0,44167.00,44167.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1472, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 44167, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 44167, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 44167, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1472, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 44167, \"total_deduction\": 44167}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 44167}',1,'2026-07-20 12:49:01','2026-07-20 12:49:01'),(125,'EMP019','April',2026,4,60000.00,0,0,0,0,0,0,0,0,60000.00,60000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 2000, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 60000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 60000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 60000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 2000, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 60000, \"total_deduction\": 60000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 60000}',1,'2026-07-20 12:49:01','2026-07-20 12:49:01'),(126,'EMP020','April',2026,4,40000.00,0,0,0,0,0,0,0,0,40000.00,40000.00,0.00,0.00,0.00,'pending',NULL,'{\"half_days\": 0, \"late_days\": 0, \"paid_days\": 0, \"daily_rate\": 1333, \"total_days\": 30, \"absent_days\": 26, \"gross_salary\": 40000, \"holiday_days\": 0, \"present_days\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 40000, \"paid_leave_days\": 0, \"paid_leave_rule\": \"Paid/unpaid is determined by Leave Policy Settings for each approved leave request.\", \"total_deduction\": 40000, \"weekly_off_days\": 4, \"unpaid_leave_days\": 0, \"total_working_days\": 26, \"calculation_summary\": {\"note\": \"No attendance records found for this month\", \"daily_rate\": 1333, \"net_salary\": 0, \"deduction_days\": 30, \"effective_days\": 0, \"monthly_salary\": 40000, \"total_deduction\": 40000}, \"has_attendance_data\": false, \"leave_policy_applied\": true, \"attendance_deductions\": 0, \"leave_and_absence_deduction\": 40000}',1,'2026-07-20 12:49:01','2026-07-20 12:49:01');
/*!40000 ALTER TABLE `tb_salary_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_shifts`
--

DROP TABLE IF EXISTS `tb_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_shifts` (
  `shift_id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `shift_name` varchar(100) NOT NULL,
  `check_in_time` time NOT NULL,
  `check_out_time` time NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_default` tinyint(1) DEFAULT '0',
  `grace_period_minutes` int DEFAULT '15',
  PRIMARY KEY (`shift_id`),
  KEY `idx_shifts_tenant` (`tenant_id`),
  CONSTRAINT `fk_shifts_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_shifts`
--

LOCK TABLES `tb_shifts` WRITE;
/*!40000 ALTER TABLE `tb_shifts` DISABLE KEYS */;
INSERT INTO `tb_shifts` VALUES (14,1,'ss','10:00:00','19:00:00','2026-05-09 11:36:01','2026-07-20 10:32:02',1,15);
/*!40000 ALTER TABLE `tb_shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_branding`
--

DROP TABLE IF EXISTS `tenant_branding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_branding` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `primary_color` varchar(50) DEFAULT '#3B82F6',
  `secondary_color` varchar(50) DEFAULT '#10B981',
  `logo_url` varchar(500) DEFAULT NULL,
  `favicon_url` varchar(500) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `signature_url` varchar(500) DEFAULT NULL,
  `stamp_url` varchar(500) DEFAULT NULL,
  `hr_name` varchar(255) DEFAULT NULL,
  `hr_designation` varchar(255) DEFAULT NULL,
  `company_address` text,
  `company_email` varchar(255) DEFAULT NULL,
  `company_phone` varchar(50) DEFAULT NULL,
  `company_website` varchar(255) DEFAULT NULL,
  `default_terms` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  CONSTRAINT `fk_branding_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_branding`
--

LOCK TABLES `tenant_branding` WRITE;
/*!40000 ALTER TABLE `tenant_branding` DISABLE KEYS */;
INSERT INTO `tenant_branding` VALUES (1,1,'#3B82F6','#10B981',NULL,NULL,'PUSH ',NULL,NULL,'ANiruddha','HR & BDE','jkfdsajk fsdakj fak fdsjlk a','aits@gmail.com','4322423432','aits.com','[\"The employee shall abide by all company policies, rules, and regulations.\", \"This offer is contingent upon satisfactory background verification and reference checks.\", \"The first three months shall be a probationary period, during which either party may terminate employment with one week notice.\", \"The company reserves the right to modify terms with prior notice.\", \"Confidentiality of company information must be maintained during and after employment.\", \"All intellectual property created during employment shall belong to the company.\", \"The employee agrees not to engage in any competing business during employment and for six months after termination.\", \"Employment may be terminated by either party with one month notice or payment in lieu thereof.\"]','2026-05-28 23:22:42','2026-08-13 06:32:24'),(2,2,'#3B82F6','#10B981','/uploads/branding/2/company_logo.PNG',NULL,'PUSH ',NULL,NULL,'ANiruddha','HR & BDE','jkfdsajk fsdakj fak fdsjlk a','aits@gmail.com','4322423432','aits.com','[\"The employee shall abide by all company policies, rules, and regulations.\", \"This offer is contingent upon satisfactory background verification and reference checks.\", \"The first three months shall be a probationary period, during which either party may terminate employment with one week notice.\", \"The company reserves the right to modify terms with prior notice.\", \"Confidentiality of company information must be maintained during and after employment.\", \"All intellectual property created during employment shall belong to the company.\", \"The employee agrees not to engage in any competing business during employment and for six months after termination.\", \"Employment may be terminated by either party with one month notice or payment in lieu thereof.\"]','2026-07-18 09:50:46','2026-07-18 09:50:58');
/*!40000 ALTER TABLE `tenant_branding` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `logo_url` varchar(500) DEFAULT NULL,
  `subscription_plan` enum('free','basic','premium','enterprise') DEFAULT 'free',
  `max_employees` int DEFAULT '10',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,'arham_it','arham-it','admin@arhamitsolutions.com',NULL,NULL,NULL,'free',10,1,'2026-04-29 12:27:41','2026-04-29 12:27:41'),(2,'TEAM B','team-b','faisalwork808@gmail.com','91 8080669609',NULL,NULL,'free',10,1,'2026-07-18 09:49:13','2026-07-18 09:49:13');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_comments`
--

DROP TABLE IF EXISTS `ticket_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `ticket_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comments_tenant` (`tenant_id`),
  KEY `idx_comments_ticket` (`ticket_id`),
  KEY `fk_comments_user` (`user_id`),
  CONSTRAINT `fk_comments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_comments`
--

LOCK TABLES `ticket_comments` WRITE;
/*!40000 ALTER TABLE `ticket_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `raised_by_user_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `priority` varchar(50) NOT NULL DEFAULT 'Medium',
  `status` varchar(50) NOT NULL DEFAULT 'Open',
  `assigned_to_user_id` int DEFAULT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `source_app` varchar(100) DEFAULT NULL COMMENT 'External application that raised this ticket',
  `external_ref` varchar(100) DEFAULT NULL COMMENT 'Ticket reference ID from the external application',
  `api_key_id` int DEFAULT NULL COMMENT 'API key used to create this ticket via integration',
  `raised_by_name` varchar(150) DEFAULT NULL COMMENT 'Name of the external person who raised this ticket',
  PRIMARY KEY (`id`),
  KEY `idx_tickets_tenant` (`tenant_id`),
  KEY `idx_tickets_project` (`project_id`),
  KEY `idx_tickets_raised_by` (`raised_by_user_id`),
  KEY `idx_tickets_assigned_to` (`assigned_to_user_id`),
  CONSTRAINT `fk_tickets_assigned_to` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tickets_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tickets_raised_by` FOREIGN KEY (`raised_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tickets_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_module_access`
--

DROP TABLE IF EXISTS `user_module_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_module_access` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `module_key` varchar(50) NOT NULL,
  `access_level` enum('none','read','write') NOT NULL DEFAULT 'none',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_module` (`user_id`,`module_key`),
  KEY `idx_tenant_user` (`tenant_id`,`user_id`),
  KEY `idx_user_module_module` (`module_key`),
  KEY `idx_user_module_updated_by` (`updated_by`),
  CONSTRAINT `fk_user_module_access_module` FOREIGN KEY (`module_key`) REFERENCES `modules` (`module_key`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_module_access_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_module_access_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_module_access_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_module_access`
--

LOCK TABLES `user_module_access` WRITE;
/*!40000 ALTER TABLE `user_module_access` DISABLE KEYS */;
INSERT INTO `user_module_access` VALUES (1,27,1,'hr','read','2026-05-16 15:09:05',1),(2,27,1,'accounts','read','2026-05-16 15:09:05',1),(3,27,1,'services','write','2026-05-16 15:09:05',1);
/*!40000 ALTER TABLE `user_module_access` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `position` enum('admin','hr','employee','intern','user') DEFAULT 'employee',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `last_active_at` datetime DEFAULT NULL,
  `password_reset_token_hash` varchar(128) DEFAULT NULL,
  `password_reset_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `tenant_id` (`tenant_id`),
  KEY `idx_users_password_reset_token` (`password_reset_token_hash`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'Arham','admin','admin@arhamitsolutions.com','$2b$10$AHAXRWtquoMutN3JDuvvCOkhPlYSS4Tj9P0An0ND2JZkSdDNRK58W',NULL,'admin',1,'2026-04-30 06:02:52','2026-08-14 10:41:54',NULL,NULL,'2026-08-14 16:11:54',NULL,NULL),(27,1,'Jubeda','Shaikh','jubeda12345.aits@gmail.com','$2b$10$jda0rioDoR6WNgcIWDXNtOYJg9igl28fHSp3TZTKrNjWYTwLGIDoC',NULL,'employee',1,'2026-05-09 08:08:09','2026-05-16 15:15:18',NULL,NULL,'2026-05-16 20:45:18',NULL,NULL),(30,1,'Aarav','Sharma','aarav.sharma@example.com','$2b$10$/aIyq9KTY1m4M3UFMG7SFuNpNfdu37sJeS6CfsB0BxQeOx6r0lrLq','9876543210','employee',1,'2026-05-23 09:09:23','2026-05-29 00:33:26',NULL,NULL,'2026-05-29 06:03:26',NULL,NULL),(31,1,'Priya','Patel','priya.patel@example.com','$2b$10$bn69m9lL3izVCTeztel4q.hsilRLV51./nF4xGeRWE0pIzsdVx3w2','9876543211','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(32,1,'Rahul','Verma','rahul.verma@example.com','$2b$10$3pVQKRcHyGjZNTt6oHrejOsQZK/psurNq5Y.ynhNFIMw9KT0AeO4S','9876543212','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(33,1,'Sneha','Iyer','sneha.iyer@example.com','$2b$10$JdWLRcJObkipe9GERM.fvOTbqm6sBCnt8DXoCGHpjnswnhq0n2BPq','9876543213','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(34,1,'Vikram','Singh','vikram.singh@example.com','$2b$10$855VEXkB.tKO.nE0mi7Czehuam5G0fQ5Y0L/T0WD0jGXxlM6WIB8y','9876543214','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(35,1,'Neha','Gupta','neha.gupta@example.com','$2b$10$p/fnynMWRwSN572OLEtkqO9C3uhndUawUILQRtbPZ89UUYoQ8EP7i','9876543215','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(36,1,'Rohan','Mehta','rohan.mehta@example.com','$2b$10$ZApvnWNlqX3QwpudspN3g.VDVXbvCjZRz/gpj4HgSAI48CYgVsQIy','9876543216','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(37,1,'Ananya','Rao','ananya.rao@example.com','$2b$10$fkNVMiJPBNKbP6Sumqfg2.lpGCkj.TI3hVNRgblIcZMMPoE.Ydvdy','9876543217','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(38,1,'Karan','Joshi','karan.joshi@example.com','$2b$10$iR0BZdhZEMkkl28RFaE0EuYXJ33zhiP51BLKrndcnD.1NFCTxC5Ie','9876543218','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(39,1,'Pooja','Nair','pooja.nair@example.com','$2b$10$IUuB5wRPYDGt354.895HDej.4D/C8HIF2p9K07sNqnjpH1qaQLdBW','9876543219','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(40,1,'Aditya','Kapoor','aditya.kapoor@example.com','$2b$10$JxP0OAksMxU0u1IXEfkHeuOc0heVPyNC53MfH4xTouUg6kyEnWrQS','9876543220','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(41,1,'Meera','Chopra','meera.chopra@example.com','$2b$10$2FbcBw.3.bPHipQgA.DCQeUdmM2SVlURrQkAyAvB3l8WvA.KORtpm','9876543221','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(42,1,'Siddharth','Mishra','siddharth.mishra@example.com','$2b$10$zr0PaKE3Dy6O6y8vg63bpO7lDXrtz0/KiJ9oRRG3tNcpMwBe2H/5C','9876543222','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(43,1,'Kavya','Reddy','kavya.reddy@example.com','$2b$10$bT6armlMWJTecvDqAfDIe.zd44h3QsBw4AJjNeTHz6UDLI963CNse','9876543223','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(44,1,'Arjun','Desai','arjun.desai@example.com','$2b$10$cVWNZ1H6IRQ6yN8t4yNpzOJOGqV1.4.8BsAoASsYciamPln1EccBG','9876543224','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(45,1,'Ishita','Saxena','ishita.saxena@example.com','$2b$10$HtN1SsEpNsaoHLduhLnhMeum4MZ3C4WvlknYT2QJh6hzanI8DTWW2','9876543225','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(46,1,'Manav','Tiwari','manav.tiwari@example.com','$2b$10$VydH26cGvKcMq6WqNGye5ew1bXsYDAJ2btx1wPbeYQk9DhjZlTU3q','9876543226','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(47,1,'Ritika','Agarwal','ritika.agarwal@example.com','$2b$10$PW47h1nNB0bhIF9J4p/6m.ExD8AGujQuGfW2dSWaoyebVP9E3HU1W','9876543227','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(48,1,'Yash','Malhotra','yash.malhotra@example.com','$2b$10$3ekmyvaHTBEoaMP.5r.ByOruIY3pcyA55UFg8Jfaqr/SqR59YgvWu','9876543228','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(49,1,'Simran','Bansal','simran.bansal@example.com','$2b$10$wuKYzVZYXNzYdn99Kp4pRumcp2Ui5ZlIPDdgK3UtjF2aFWXKbxygW','9876543229','employee',1,'2026-05-23 09:09:23','2026-05-23 09:09:23',NULL,NULL,NULL,NULL,NULL),(52,1,'Aniruddha','Manmode','aniruddha.aits@gmail.com','$2b$10$L4bG5QGH5cR05RRFcOU1Le8j.k.OcnG2IczPLgA67XgNmg1zpyD4y','+918830681554','employee',1,'2026-05-29 06:14:39','2026-06-03 11:07:59',NULL,NULL,'2026-06-03 16:37:59',NULL,NULL),(55,1,'Aniruddha','Manmode','pttm.794d17507e7a4fb5bd0c3fb02c7edb29@local.invalid',NULL,NULL,'user',1,'2026-05-29 07:15:35','2026-05-29 07:15:35',NULL,NULL,NULL,NULL,NULL),(56,1,'Faisal','Khan','pttm.b90d90adf3d44a5387e22bf4c23c4671@local.invalid',NULL,NULL,'user',1,'2026-05-29 07:15:35','2026-05-29 07:15:35',NULL,NULL,NULL,NULL,NULL),(57,1,'sarfraz','bagwan','sarfraz.aits@gmail.com','$2b$10$Urx8wUH40n/mOnC/.c42au20vCqDtg981s0ABPEZ.WohEOZKXrlH2','9876543210','employee',1,'2026-06-02 07:53:59','2026-08-14 10:41:40',NULL,NULL,'2026-08-14 16:11:40',NULL,NULL),(58,2,'Faisal','Khan','faisalwork808@gmail.com','$2b$10$APLSVvq130eNz/xVky4uqeSfoaqmqHACf3kMbvSlgMBJVRiEzwY6O',NULL,'admin',1,'2026-07-18 09:49:13','2026-07-18 09:55:37',NULL,NULL,'2026-07-18 15:25:37',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-14 16:35:37
