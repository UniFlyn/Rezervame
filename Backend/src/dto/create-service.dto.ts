import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration!: number;

  @IsString()
  @IsNotEmpty()
  category!: string;

  /** Optional data URL or HTTPS URL for service image */
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
