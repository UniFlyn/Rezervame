module "networking" {
  source               = "../../modules/networking"
  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  single_nat_gateway   = var.single_nat_gateway
}

module "database" {
  source                      = "../../modules/database"
  project_name                = var.project_name
  environment                 = var.environment
  vpc_id                      = module.networking.vpc_id
  private_subnet_ids          = module.networking.private_subnet_ids
  db_name                     = var.db_name
  db_username                 = var.db_username
  db_password                 = var.db_password
  db_instance_class           = var.db_instance_class
  db_allocated_storage        = var.db_allocated_storage
  db_multi_az                 = var.db_multi_az
  db_backup_retention_days    = var.db_backup_retention_days
  app_security_group_id       = module.networking.app_security_group_id
  read_replica_enabled        = var.db_read_replica_enabled
  read_replica_instance_class = var.db_read_replica_instance_class
}

module "cache" {
  source                = "../../modules/cache"
  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  app_security_group_id = module.networking.app_security_group_id
  redis_node_type       = var.redis_node_type
  num_cache_clusters    = var.redis_num_cache_clusters
}

module "storage" {
  source       = "../../modules/storage"
  project_name = var.project_name
  environment  = var.environment
}

module "compute" {
  source                = "../../modules/compute"
  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  app_security_group_id = module.networking.app_security_group_id
  container_image       = var.container_image
  container_port        = var.container_port
  desired_count         = var.desired_count
  min_count             = var.min_count
  max_count             = var.max_count
  task_cpu              = var.task_cpu
  task_memory           = var.task_memory
  container_environment = [
    { name = "NODE_ENV", value = var.environment },
    { name = "PORT", value = tostring(var.container_port) },
  ]
  container_secrets = [
    { name = "DATABASE_URL_WRITE", valueFrom = module.secrets.database_url_write_secret_arn },
    { name = "DATABASE_URL_READ", valueFrom = module.secrets.database_url_read_secret_arn },
    { name = "REDIS_URL", valueFrom = module.secrets.redis_url_secret_arn },
  ]
}

module "secrets" {
  source             = "../../modules/secrets"
  project_name       = var.project_name
  environment        = var.environment
  db_writer_endpoint = module.database.writer_endpoint
  db_reader_endpoint = module.database.reader_endpoint
  db_port            = module.database.port
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  redis_endpoint     = module.cache.primary_endpoint
  redis_port         = module.cache.port
}

module "monitoring" {
  source              = "../../modules/monitoring"
  project_name        = var.project_name
  environment         = var.environment
  ecs_cluster_name    = module.compute.cluster_name
  ecs_service_name    = module.compute.service_name
  rds_instance_id     = module.database.instance_id
  alarm_sns_topic_arn = var.alarm_sns_topic_arn
}
