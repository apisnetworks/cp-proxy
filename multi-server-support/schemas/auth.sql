CREATE TABLE `account_cache` (
  `server` varchar(65) NOT NULL,
  `site` int(4) unsigned NOT NULL,
  `prefix` varchar(16) default NULL,
  `admin` varchar(32) NOT NULL,
  PRIMARY KEY  (`server`,`admin`),
  KEY `prefix` (`prefix`),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
