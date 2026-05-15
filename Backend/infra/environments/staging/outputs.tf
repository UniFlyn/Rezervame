output "alb_dns_name" {
  value = module.compute.alb_dns_name
}

output "ecs_cluster_name" {
  value = module.compute.cluster_name
}

output "ecs_service_name" {
  value = module.compute.service_name
}

output "rds_writer_endpoint" {
  value = module.database.writer_endpoint
}

output "rds_reader_endpoint" {
  value = module.database.reader_endpoint
}

output "redis_endpoint" {
  value = module.cache.primary_endpoint
}

output "uploads_bucket" {
  value = module.storage.uploads_bucket_name
}
