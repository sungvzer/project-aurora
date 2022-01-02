-- MariaDB dump 10.19  Distrib 10.6.5-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: aurora
-- ------------------------------------------------------
-- Server version	10.6.5-MariaDB
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!40101 SET NAMES utf8mb4 */
;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */
;
/*!40103 SET TIME_ZONE='+00:00' */
;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */
;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */
;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */
;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */
;
--
-- Table structure for table `Currency`
--
DROP TABLE IF EXISTS `Currency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `Currency` (
  `CurrencyID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `CurrencyName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `CurrencyCode` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`CurrencyID`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `PasswordResetKey`
--
DROP TABLE IF EXISTS `PasswordResetKey`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `PasswordResetKey` (
  `PasswordResetKeyID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `UserDataHeaderID` int(11) unsigned NOT NULL,
  `Key` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ExpiresOn` datetime NOT NULL,
  PRIMARY KEY (`PasswordResetKeyID`),
  UNIQUE KEY `PasswordResetKeyID_UNIQUE` (`PasswordResetKeyID`),
  UNIQUE KEY `Key_UNIQUE` (`Key`),
  KEY `PasswordResetKey_UserDataHeader_idx` (`UserDataHeaderID`),
  CONSTRAINT `PasswordResetKey_UserDataHeader` FOREIGN KEY (`UserDataHeaderID`) REFERENCES `UserDataHeader` (`UserDataHeaderID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `Transaction`
--
DROP TABLE IF EXISTS `Transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `Transaction` (
  `UserTransactionID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `UserTransactionCurrencyID` int(11) unsigned NOT NULL,
  `UserDataHeaderID` int(11) unsigned NOT NULL,
  `UserTransactionAmount` int(11) NOT NULL,
  `UserTransactionDate` date NOT NULL,
  `UserTransactionTag` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`UserTransactionID`),
  KEY `UserTransactionCurrency_idx` (`UserTransactionCurrencyID`),
  KEY `UserTransaction_UserDataHeader_idx` (`UserDataHeaderID`),
  CONSTRAINT `Transaction_Currency` FOREIGN KEY (`UserTransactionCurrencyID`) REFERENCES `Currency` (`CurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `Transaction_UserDataHeader` FOREIGN KEY (`UserDataHeaderID`) REFERENCES `UserDataHeader` (`UserDataHeaderID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `UserCredential`
--
DROP TABLE IF EXISTS `UserCredential`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `UserCredential` (
  `UserCredentialID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `UserEmail` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `UserPasswordHash` varchar(130) COLLATE utf8mb4_unicode_ci NOT NULL,
  `UserCredentialLastModifiedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`UserCredentialID`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `UserDataHeader`
--
DROP TABLE IF EXISTS `UserDataHeader`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `UserDataHeader` (
  `UserDataHeaderID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `UserCredentialID` int(11) unsigned NOT NULL,
  `UserPersonalInfoID` int(11) unsigned NOT NULL,
  `UserCreatedAt` datetime NOT NULL,
  `UserSettingID` int(11) unsigned NOT NULL,
  PRIMARY KEY (`UserDataHeaderID`),
  KEY `UserDataHeader_UserCredential` (`UserCredentialID`),
  KEY `UserDataHeader_UserPersonalInfo` (`UserPersonalInfoID`),
  KEY `UserDataHeader_UserSetting` (`UserSettingID`),
  CONSTRAINT `UserDataHeader_UserCredential` FOREIGN KEY (`UserCredentialID`) REFERENCES `UserCredential` (`UserCredentialID`),
  CONSTRAINT `UserDataHeader_UserPersonalInfo` FOREIGN KEY (`UserPersonalInfoID`) REFERENCES `UserPersonalInfo` (`UserPersonalInfoID`),
  CONSTRAINT `UserDataHeader_UserSetting` FOREIGN KEY (`UserSettingID`) REFERENCES `UserSetting` (`UserSettingID`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `UserPersonalInfo`
--
DROP TABLE IF EXISTS `UserPersonalInfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `UserPersonalInfo` (
  `UserPersonalInfoID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `UserFirstName` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UserMiddleName` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UserLastName` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UserBirthday` date DEFAULT NULL,
  PRIMARY KEY (`UserPersonalInfoID`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `UserSetting`
--
DROP TABLE IF EXISTS `UserSetting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `UserSetting` (
  `UserSettingID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `UserCurrencyID` int(11) unsigned NOT NULL,
  `DarkMode` tinyint(1) NOT NULL DEFAULT 0,
  `AbbreviatedFormat` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`UserSettingID`),
  KEY `UserSetting_Currency` (`UserCurrencyID`),
  CONSTRAINT `UserSetting_Currency` FOREIGN KEY (`UserCurrencyID`) REFERENCES `Currency` (`CurrencyID`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */
;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */
;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */
;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */
;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */
;
-- Dump completed on 2022-01-02 15:43:02
