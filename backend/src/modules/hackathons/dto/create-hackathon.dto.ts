import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HackathonStatus } from '../../../entities/hackathon.entity';
import { RoundPaymentType } from '../../../entities/hackathon-round.entity';

class CreateRoundDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  submissionStart: string;

  @IsDateString()
  submissionEnd: string;

  @IsDateString()
  evaluationStart: string;

  @IsDateString()
  evaluationEnd: string;

  @IsDateString()
  resultTime: string;

  @IsBoolean()
  @IsOptional()
  isElimination?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  eliminationCount?: number;

  @IsNumber()
  @IsOptional()
  eliminationThreshold?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weightagePercentage?: number;

  @IsBoolean()
  @IsOptional()
  allowDocument?: boolean;

  @IsBoolean()
  @IsOptional()
  allowGithub?: boolean;

  @IsBoolean()
  @IsOptional()
  allowVideo?: boolean;

  @IsBoolean()
  @IsOptional()
  allowDescription?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxFileSizeMb?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  @IsBoolean()
  @IsOptional()
  isPaymentRequired?: boolean;

  @IsNumber()
  @IsOptional()
  paymentAmount?: number;

  @IsDateString()
  @IsOptional()
  paymentDeadline?: string;

  @IsEnum(RoundPaymentType)
  @IsOptional()
  paymentType?: RoundPaymentType;
}

export class CreateHackathonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsString()
  @IsOptional()
  rules?: string;

  @IsString()
  @IsOptional()
  evaluationCriteria?: string;

  @IsDateString()
  registrationStart: string;

  @IsDateString()
  registrationEnd: string;

  @IsDateString()
  @IsOptional()
  mentorSelectionStart?: string;

  @IsDateString()
  @IsOptional()
  mentorSelectionEnd?: string;

  @IsDateString()
  @IsOptional()
  approvalStart?: string;

  @IsDateString()
  @IsOptional()
  approvalEnd?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxTeamSize?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxParticipants?: number;

  @IsBoolean()
  @IsOptional()
  allowIndividual?: boolean;

  @IsBoolean()
  @IsOptional()
  allowTeam?: boolean;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsNumber()
  @IsOptional()
  registrationFee?: number;

  @IsDateString()
  @IsOptional()
  paymentDeadline?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  refundPolicy?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoundDto)
  rounds: CreateRoundDto[];
}
