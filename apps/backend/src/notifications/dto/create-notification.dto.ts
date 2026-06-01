import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  NotificationType,
  NotificationChannel,
} from '../../shared/enums/index.js';

export class CreateNotificationDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsInt()
  storeId?: number;

  @IsOptional()
  @IsInt()
  warehouseId?: number;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  message!: string;
}
