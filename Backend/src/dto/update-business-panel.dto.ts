import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

/** Maps to Prisma Business via mapBusinessPatch in app.controller. */
export class UpdateBusinessPanelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  category?: string;

  /** Display category tags (profile multi-select). When set, updates `categoryLabels` and legacy `categoryLabel` join. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  banner?: string;

  /** Portfolio / venue gallery photos (shown on public venue page). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  /** Amenity keys from [Amenity.key] — replaces full list when sent. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenityKeys?: string[];

  @IsOptional()
  @IsString()
  socialYoutube?: string;

  @IsOptional()
  @IsString()
  socialInstagram?: string;

  @IsOptional()
  @IsString()
  socialX?: string;

  @IsOptional()
  @IsString()
  socialTiktok?: string;

  @IsOptional()
  @IsString()
  workingHours?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsBoolean()
  notifyBookingEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyCancellationEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyDailySummary?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxPercentage?: number;

  /** `manual` | `automatic` — whether new customer bookings need merchant approval. */
  @IsOptional()
  @IsString()
  appointmentApprovalMode?: string;

  /** When false, customers cannot cancel (except unpaid Pending bookings). */
  @IsOptional()
  @IsBoolean()
  cancellationAllowed?: boolean;

  /** Hours before appointment that cancellation is allowed (0 = anytime before start). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cancellationHoursBefore?: number;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}
