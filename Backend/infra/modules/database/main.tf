variable "project_name" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "app_security_group_id" { type = string }
variable "db_name" { type = string }
variable "db_username" { type = string }
variable "db_password" {
  type      = string
  sensitive = true
}
variable "db_instance_class" { type = string }
variable "db_allocated_storage" { type = number }
variable "db_multi_az" { type = bool }
variable "db_backup_retention_days" { type = number }
variable "read_replica_enabled" { type = bool }
variable "read_replica_instance_class" { type = string }

resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-${var.environment}-db-subnets"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "db" {
  name        = "${var.project_name}-${var.environment}-db-sg"
  description = "Allow Postgres from app SG only"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "primary" {
  identifier              = "${var.project_name}-${var.environment}-postgres"
  engine                  = "postgres"
  engine_version          = "16.3"
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  storage_type            = "gp3"
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  publicly_accessible     = false
  multi_az                = var.db_multi_az
  backup_retention_period = var.db_backup_retention_days
  skip_final_snapshot     = false
  deletion_protection     = true
}

resource "aws_db_instance" "read_replica" {
  count                      = var.read_replica_enabled ? 1 : 0
  identifier                 = "${var.project_name}-${var.environment}-postgres-read-1"
  replicate_source_db        = aws_db_instance.primary.identifier
  instance_class             = var.read_replica_instance_class
  publicly_accessible        = false
  auto_minor_version_upgrade = true
}

output "instance_id" {
  value = aws_db_instance.primary.id
}

output "writer_endpoint" {
  value = aws_db_instance.primary.address
}

output "reader_endpoint" {
  value = var.read_replica_enabled ? aws_db_instance.read_replica[0].address : aws_db_instance.primary.address
}

output "port" {
  value = aws_db_instance.primary.port
}
