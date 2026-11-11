-- Runs once, when compose.dev.yaml's MySQL initializes an empty volume.
-- The official image only grants MYSQL_USER access to MYSQL_DATABASE
-- ("cdis"); back-end integration tests use a separate "cdis_test"
-- database so a test run can never touch dev data.
CREATE DATABASE IF NOT EXISTS cdis_test;
GRANT ALL PRIVILEGES ON cdis_test.* TO 'cdis'@'%';
