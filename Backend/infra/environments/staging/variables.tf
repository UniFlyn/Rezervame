variable "aws_region" { type = string }
variable "project_name" { type = string }
variable "environment" { type = string }

variable "vpc_cidr" { type = string }
variable "public_subnet_cidrs" { type = list(string) }
variable "private_subnet_cidrs" { type = list(string) }
variable "single_nat_gateway" { type = bool }

variable "container_image" { type = string }
variable "container_port" { type = number }
variable "desired_count" { type = number }
variable "min_count" { type = number }
variable "max_count" { type = number }
variable "task_cpu" { type = number }
variable "task_memory" { type = number }

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
variable "db_read_replica_enabled" { type = bool }
variable "db_read_replica_instance_class" { type = string }

variable "redis_node_type" { type = string }
variable "redis_num_cache_clusters" { type = number }

variable "alarm_sns_topic_arn" {
  type    = string
  default = ""
}
