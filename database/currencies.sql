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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */
;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */
;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */
;
--
-- Dumping data for table `Currency`
--
LOCK TABLES `Currency` WRITE;
/*!40000 ALTER TABLE `Currency` DISABLE KEYS */
;
INSERT INTO `Currency`
VALUES (1, '(South) Korean Won', 'KRW'),
(2, 'Afghanistan Afghani', 'AFA'),
(3, 'Albanian Lek', 'ALL'),
(4, 'Algerian Dinar', 'DZD'),
(5, 'Andorran Peseta', 'ADP'),
(6, 'Angolan Kwanza', 'AOK'),
(7, 'Argentine Peso', 'ARS'),
(8, 'Armenian Dram', 'AMD'),
(9, 'Aruban Florin', 'AWG'),
(10, 'Australian Dollar', 'AUD'),
(11, 'Bahamian Dollar', 'BSD'),
(12, 'Bahraini Dinar', 'BHD'),
(13, 'Bangladeshi Taka', 'BDT'),
(14, 'Barbados Dollar', 'BBD'),
(15, 'Belize Dollar', 'BZD'),
(16, 'Bermudian Dollar', 'BMD'),
(17, 'Bhutan Ngultrum', 'BTN'),
(18, 'Bolivian Boliviano', 'BOB'),
(19, 'Botswanian Pula', 'BWP'),
(20, 'Brazilian Real', 'BRL'),
(21, 'British Pound', 'GBP'),
(22, 'Brunei Dollar', 'BND'),
(23, 'Bulgarian Lev', 'BGN'),
(24, 'Burma Kyat', 'BUK'),
(25, 'Burundi Franc', 'BIF'),
(26, 'Canadian Dollar', 'CAD'),
(27, 'Cape Verde Escudo', 'CVE'),
(28, 'Cayman Islands Dollar', 'KYD'),
(29, 'Chilean Peso', 'CLP'),
(30, 'Chilean Unidades de Fomento', 'CLF'),
(31, 'Colombian Peso', 'COP'),
(
        32,
        'Communauté Financière Africaine BCEAO - Francs',
        'XOF'
    ),
(
        33,
        'Communauté Financière Africaine BEAC, Francs',
        'XAF'
    ),
(34, 'Comoros Franc', 'KMF'),
(
        35,
        'Comptoirs Français du Pacifique Francs',
        'XPF'
    ),
(36, 'Costa Rican Colon', 'CRC'),
(37, 'Cuban Peso', 'CUP'),
(38, 'Cyprus Pound', 'CYP'),
(39, 'Czech Republic Koruna', 'CZK'),
(40, 'Danish Krone', 'DKK'),
(41, 'Democratic Yemeni Dinar', 'YDD'),
(42, 'Dominican Peso', 'DOP'),
(43, 'East Caribbean Dollar', 'XCD'),
(44, 'East Timor Escudo', 'TPE'),
(45, 'Ecuador Sucre', 'ECS'),
(46, 'Egyptian Pound', 'EGP'),
(47, 'El Salvador Colon', 'SVC'),
(48, 'Estonian Kroon (EEK)', 'EEK'),
(49, 'Ethiopian Birr', 'ETB'),
(50, 'Euro', 'EUR'),
(51, 'Falkland Islands Pound', 'FKP'),
(52, 'Fiji Dollar', 'FJD'),
(53, 'Gambian Dalasi', 'GMD'),
(54, 'Ghanaian Cedi', 'GHC'),
(55, 'Gibraltar Pound', 'GIP'),
(56, 'Gold, Ounces', 'XAU'),
(57, 'Guatemalan Quetzal', 'GTQ'),
(58, 'Guinea Franc', 'GNF'),
(59, 'Guinea-Bissau Peso', 'GWP'),
(60, 'Guyanan Dollar', 'GYD'),
(61, 'Haitian Gourde', 'HTG'),
(62, 'Honduran Lempira', 'HNL'),
(63, 'Hong Kong Dollar', 'HKD'),
(64, 'Hungarian Forint', 'HUF'),
(65, 'Indian Rupee', 'INR'),
(66, 'Indonesian Rupiah', 'IDR'),
(
        67,
        'International Monetary Fund (IMF) Special Drawing Rights',
        'XDR'
    ),
(68, 'Iranian Rial', 'IRR'),
(69, 'Iraqi Dinar', 'IQD'),
(70, 'Irish Punt', 'IEP'),
(71, 'Israeli Shekel', 'ILS'),
(72, 'Jamaican Dollar', 'JMD'),
(73, 'Japanese Yen', 'JPY'),
(74, 'Jordanian Dinar', 'JOD'),
(75, 'Kampuchean (Cambodian) Riel', 'KHR'),
(76, 'Kenyan Schilling', 'KES'),
(77, 'Kuwaiti Dinar', 'KWD'),
(78, 'Lao Kip', 'LAK'),
(79, 'Lebanese Pound', 'LBP'),
(80, 'Lesotho Loti', 'LSL'),
(81, 'Liberian Dollar', 'LRD'),
(82, 'Libyan Dinar', 'LYD'),
(83, 'Macau Pataca', 'MOP'),
(84, 'Malagasy Franc', 'MGF'),
(85, 'Malawi Kwacha', 'MWK'),
(86, 'Malaysian Ringgit', 'MYR'),
(87, 'Maldive Rufiyaa', 'MVR'),
(88, 'Maltese Lira', 'MTL'),
(89, 'Mauritanian Ouguiya', 'MRO'),
(90, 'Mauritius Rupee', 'MUR'),
(91, 'Mexican Peso', 'MXP'),
(92, 'Mongolian Tugrik', 'MNT'),
(93, 'Moroccan Dirham', 'MAD'),
(94, 'Mozambique Metical', 'MZM'),
(95, 'Namibian Dollar', 'NAD'),
(96, 'Nepalese Rupee', 'NPR'),
(97, 'Netherlands Antillian Guilder', 'ANG'),
(98, 'New Yugoslavia Dinar', 'YUD'),
(99, 'New Zealand Dollar', 'NZD'),
(100, 'Nicaraguan Cordoba', 'NIO'),
(101, 'Nigerian Naira', 'NGN'),
(102, 'North Korean Won', 'KPW'),
(103, 'Norwegian Kroner', 'NOK'),
(104, 'Omani Rial', 'OMR'),
(105, 'Pakistan Rupee', 'PKR'),
(106, 'Palladium Ounces', 'XPD'),
(107, 'Panamanian Balboa', 'PAB'),
(108, 'Papua New Guinea Kina', 'PGK'),
(109, 'Paraguay Guarani', 'PYG'),
(110, 'Peruvian Nuevo Sol', 'PEN'),
(111, 'Philippine Peso', 'PHP'),
(112, 'Platinum, Ounces', 'XPT'),
(113, 'Polish Zloty', 'PLN'),
(114, 'Qatari Rial', 'QAR'),
(115, 'Romanian Leu', 'RON'),
(116, 'Russian Ruble', 'RUB'),
(117, 'Rwanda Franc', 'RWF'),
(118, 'Samoan Tala', 'WST'),
(119, 'Sao Tome and Principe Dobra', 'STD'),
(120, 'Saudi Arabian Riyal', 'SAR'),
(121, 'Seychelles Rupee', 'SCR'),
(122, 'Sierra Leone Leone', 'SLL'),
(123, 'Silver, Ounces', 'XAG'),
(124, 'Singapore Dollar', 'SGD'),
(125, 'Slovak Koruna', 'SKK'),
(126, 'Solomon Islands Dollar', 'SBD'),
(127, 'Somali Schilling', 'SOS'),
(128, 'South African Rand', 'ZAR'),
(129, 'Sri Lanka Rupee', 'LKR'),
(130, 'St. Helena Pound', 'SHP'),
(131, 'Sudanese Pound', 'SDP'),
(132, 'Suriname Guilder', 'SRG'),
(133, 'Swaziland Lilangeni', 'SZL'),
(134, 'Swedish Krona', 'SEK'),
(135, 'Swiss Franc', 'CHF'),
(136, 'Syrian Potmd', 'SYP'),
(137, 'Taiwan Dollar', 'TWD'),
(138, 'Tanzanian Schilling', 'TZS'),
(139, 'Thai Baht', 'THB'),
(140, 'Tongan Paanga', 'TOP'),
(141, 'Trinidad and Tobago Dollar', 'TTD'),
(142, 'Tunisian Dinar', 'TND'),
(143, 'Turkish Lira', 'TRY'),
(144, 'Uganda Shilling', 'UGX'),
(145, 'United Arab Emirates Dirham', 'AED'),
(146, 'Uruguayan Peso', 'UYU'),
(147, 'US Dollar', 'USD'),
(148, 'Vanuatu Vatu', 'VUV'),
(149, 'Venezualan Bolivar', 'VEF'),
(150, 'Vietnamese Dong', 'VND'),
(151, 'Yemeni Rial', 'YER'),
(152, 'Yuan (Chinese) Renminbi', 'CNY'),
(153, 'Zaire Zaire', 'ZRZ'),
(154, 'Zambian Kwacha', 'ZMK'),
(155, 'Zimbabwe Dollar', 'ZWD');
/*!40000 ALTER TABLE `Currency` ENABLE KEYS */
;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */
;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */
;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */
;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */
;
-- Dump completed on 2021-11-30 15:32:15
