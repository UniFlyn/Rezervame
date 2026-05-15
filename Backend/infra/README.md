# Rezervame Infrastructure (Terraform)

This folder now supports environment-based Terraform execution:

- `environments/staging`
- `environments/production`

Each environment composes shared modules under `modules/`:

- `networking` - VPC, public/private subnets, NAT, route tables
- `compute` - ALB, ECS Fargate service, autoscaling, logs
- `database` - RDS PostgreSQL (private, Multi-AZ toggle, optional read replica)
- `cache` - ElastiCache Redis (private)
- `storage` - S3 buckets for uploads and backups
- `monitoring` - CloudWatch alarms for ECS/RDS
- `secrets` - Secrets Manager placeholders for app connection strings

## Usage

Run from an environment directory, for example:

```bash
cd environments/staging
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

## Scaling model

Scale changes should be driven by `terraform.tfvars` values (task size, desired count, DB class, Redis node type, etc.), not by creating new modules.

## Guardrails

- Never create AWS resources manually in console.
- Never commit real secrets or concrete `terraform.tfvars`.
- Keep RDS and Redis private-only.
