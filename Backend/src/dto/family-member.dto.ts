import { IsEmail, IsInt, IsOptional, IsString, Min, MinLength, ValidateIf } from 'class-validator';

export class CreateFamilyMemberDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsString()
  @MinLength(1)
  gender!: string;

  @IsOptional()
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsEmail()
  email?: string | null;
}

export class UpdateFamilyMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  gender?: string;

  @IsOptional()
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsEmail()
  email?: string | null;
}
