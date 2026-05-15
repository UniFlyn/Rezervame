# AWS deployment (REZERVAME / Barber backend)

This project does **not** depend on every optional AWS product. The list below is what we actually use in code, CI, and Terraform so you can align IAM and onboarding—skip or enable only what matches your role.

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/backend-deploy.yml`

| Capability | Why |
|------------|-----|
| **Amazon ECR** | Build and push the NestJS Docker image (`rezervame-backend`). |
| **IAM credentials** used by the workflow | Must allow `ecr:GetAuthorizationToken` plus push/pull on the target repository. |

The workflow builds and pushes an image; ECS rollout may be a separate step (console, CLI, or pipeline extension).

## Runtime (ECS + data layer)

Infra: `Backend/infra/` (Terraform)

| Service | Role |
|---------|------|
| **Amazon ECS on Fargate** | Runs the API container from ECR. |
| **Amazon EC2 / VPC networking** | Tasks run in a VPC with subnets and security groups (`modules/network`). |
| **Amazon RDS (PostgreSQL)** | Primary database (`modules/rds`). |
| **Amazon ElastiCache (Redis)** | Caching (`modules/redis`). |
| **Amazon CloudWatch Logs** | Container logs (`awslogs` in `ecs-task-definition.json`). |
| **AWS Secrets Manager** *(recommended)* | Store `DATABASE_URL` and other secrets instead of plain env in task defs. |

Not wired in this repo’s Terraform by default:

| Service | Notes |
|---------|--------|
| **Amazon S3** | Use if you add file uploads or static hosting elsewhere—not required for the API container alone. |

## Quick checklist for new contributors

- **Deploy images**: ECR push permissions + Docker build in CI (already in workflow).
- **Operate the stack**: ECS (cluster/service update), plus read CloudWatch log groups for `/ecs/rezervame-backend`.
- **Manage secrets**: Secrets Manager (or SSM Parameter Store) if you rotate DB URLs or API keys.
- **Infrastructure changes**: Terraform apply access for `Backend/infra` modules you touch.

If your AWS administrator assigns baseline developer access, confirm **ECR**, **ECS**, **CloudWatch Logs**, and **RDS/ElastiCache** connectivity match the VPC Peering/security-group layout from Terraform outputs—not every AWS console tile affects shipping this backend.

---

### Paste-ready summary (replaces generic AWS onboarding copy)

Optional IAM consent screens don’t determine whether you can **build and deploy this repo**. What matters is access aligned with our stack:

- **Amazon ECS (Fargate)** — run and update the API service  
- **Amazon ECR** — pull/push container images (CI pushes `rezervame-backend`)  
- **Amazon RDS (PostgreSQL)** & **ElastiCache (Redis)** — data layer from Terraform  
- **Amazon CloudWatch** — tail `/ecs/rezervame-backend` logs  
- **AWS Secrets Manager** — credentials and connection strings (recommended)  
- **Amazon S3** — only if we add object storage for uploads/assets; not required for the API container alone  

Your account already has what you need if those areas are permitted for your role and environment.
