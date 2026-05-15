import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsDateString()
  date!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  /** When omitted, backend assigns walk-in guest user. */
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string | null;

  @IsOptional()
  @IsString()
  staffId?: string | null;
}
