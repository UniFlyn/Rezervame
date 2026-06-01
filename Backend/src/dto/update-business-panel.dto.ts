import { Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
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
  @MaxLength(2_000_000)
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  banner?: string;

  /** Portfolio / venue gallery photos (shown on public venue page). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(2_000_000, { each: true })
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

  /** Show venue on app/web discovery (requires profile setup complete and active status). */
  @IsOptional()
  @IsBoolean()
  listingVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  profileSetupComplete?: boolean;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  /** Partner type id from registration (`salon`, `barberia`, …). */
  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryKeys?: string[];

  /** Partial merge into stored registration JSON. */
  @IsOptional()
  @IsObject()
  @Allow()
  registrationDetails?: Record<string, unknown>;
}
