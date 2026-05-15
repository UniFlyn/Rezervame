variable "project_name" { type = string }
variable "environment" { type = string }
variable "db_writer_endpoint" { type = string }
variable "db_reader_endpoint" { type = string }
variable "db_port" { type = number }
variable "db_name" { type = string }
variable "db_username" { type = string }
variable "db_password" {
  type      = string
  sensitive = true
}
variable "redis_endpoint" { type = string }
variable "redis_port" { type = number }

locals {
  database_url_write = "postgresql://${var.db_username}:${var.db_password}@${var.db_writer_endpoint}:${var.db_port}/${var.db_name}"
  database_url_read  = "postgresql://${var.db_username}:${var.db_password}@${var.db_reader_endpoint}:${var.db_port}/${var.db_name}"
  redis_url          = "redis://${var.redis_endpoint}:${var.redis_port}"
}

resource "aws_secretsmanager_secret" "db_write" {
  name = "${var.project_name}/${var.environment}/DATABASE_URL_WRITE"
}

resource "aws_secretsmanager_secret_version" "db_write" {
  secret_id     = aws_secretsmanager_secret.db_write.id
  secret_string = local.database_url_write
}

resource "aws_secretsmanager_secret" "db_read" {
  name = "${var.project_name}/${var.environment}/DATABASE_URL_READ"
}

resource "aws_secretsmanager_secret_version" "db_read" {
  secret_id     = aws_secretsmanager_secret.db_read.id
  secret_string = local.database_url_read
}

resource "aws_secretsmanager_secret" "redis" {
  name = "${var.project_name}/${var.environment}/REDIS_URL"
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id     = aws_secretsmanager_secret.redis.id
  secret_string = local.redis_url
}

output "database_url_write_secret_arn" {
  value = aws_secretsmanager_secret.db_write.arn
}

output "database_url_read_secret_arn" {
  value = aws_secretsmanager_secret.db_read.arn
}

output "redis_url_secret_arn" {
  value = aws_secretsmanager_secret.redis.arn
}
