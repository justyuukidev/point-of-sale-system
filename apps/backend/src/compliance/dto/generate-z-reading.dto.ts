import { IsInt, IsEnum, IsString, IsOptional } from 'class-validator';
import { ZReadingReportType } from '../../shared/enums/index.js';

export class GenerateZReadingDto {
  @IsInt()
  sessionId!: number;

  @IsEnum(ZReadingReportType)
  reportType!: ZReadingReportType;

  @IsOptional()
  @IsString()
  notes?: string;
}
