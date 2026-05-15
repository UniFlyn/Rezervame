# Configure remote state before first apply.
terraform {
  backend "s3" {
    # bucket         = "rezervame-terraform-state"
    # key            = "staging/terraform.tfstate"
    # region         = "us-east-1"
    # dynamodb_table = "rezervame-terraform-locks"
    # encrypt        = true
  }
}
