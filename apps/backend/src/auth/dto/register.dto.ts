import { IsString, IsOptional, MaxLength } from 'class-validator';

/** Self-service registration: creates a Tenant + first TENANT_ADMIN user in one call. */
export class RegisterDto {
  // ── User fields ──────────────────────────────────────
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  // ── Tenant / Business fields ─────────────────────────
  @IsString()
  @MaxLength(255)
  businessName!: string;

  @IsString()
  @MaxLength(20)
  tin!: string;

  @IsString()
  address!: string;

  @IsString()
  @MaxLength(30)
  contactPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  birMinNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  birPtuNumber?: string;
}
