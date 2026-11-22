import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateDoubtSessionDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  meetingUrl?: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsInt()
  @Min(15)
  @Max(180)
  @IsOptional()
  durationMinutes?: number;
}
