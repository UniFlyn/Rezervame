import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { CreateStaffDto } from './create-staff.dto';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  /** Allow `null` to clear the photo (PartialType + `@IsString()` rejects null otherwise). */
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  declare image?: string | null;
}
