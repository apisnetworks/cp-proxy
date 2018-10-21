CREATE TABLE `api_keys` (
  `api_key` char(64) NOT NULL,
  `username` varchar(32) NOT NULL DEFAULT '',
  `domain` varchar(64) DEFAULT NULL,
  `site_id` int(4) DEFAULT NULL,
  `last_used` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `comment` varchar(255) DEFAULT NULL,
  `server_name` varchar(64) DEFAULT NULL,
  `invoice` varchar(34) DEFAULT NULL COMMENT '+4 chars to support resellers',
  PRIMARY KEY (`api_key`),
  KEY `soap_keys_index1731` (`username`,`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
