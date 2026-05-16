import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  role!: string;

  @IsArray()
  @IsString({ each: true })
  skills!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

  @IsString()
  @IsNotEmpty()
  availability!: string;

  @IsOptional()
  @IsString()
  image?: string | null;

  @IsOptional()
  @IsString()
  bio?: string | null;

  @IsOptional()
  experienceYears?: number;
}
