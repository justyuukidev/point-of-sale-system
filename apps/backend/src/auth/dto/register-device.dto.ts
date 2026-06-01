import { IsString, IsEnum, MaxLength } from 'class-validator';
import { DevicePlatform } from '../../shared/enums/index.js';

export class RegisterDeviceDto {
  @IsString()
  @MaxLength(255)
  deviceFingerprint!: string;

  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @IsString()
  @MaxLength(100)
  deviceName!: string;
}
