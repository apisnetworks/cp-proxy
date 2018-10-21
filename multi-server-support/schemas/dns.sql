CREATE TABLE `domain_information` (
  `domain` varchar(64) NOT NULL,
  `original_domain` varchar(64) DEFAULT NULL,
  `admin_email` varchar(50) NOT NULL DEFAULT '',
  `server_name` varchar(64) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `parent_domain` varchar(52) DEFAULT NULL,
  `site_id` int(4) NOT NULL,
  `di_invoice` varchar(34) NOT NULL DEFAULT '' COMMENT '+4 chars to support resellers',
  PRIMARY KEY (`domain`,`server_name`),
  KEY `status_index` (`status`),
  KEY `original_domain` (`original_domain`),
  KEY `fs_path` (`site_id`),
  KEY `di_invoice` (`di_invoice`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
