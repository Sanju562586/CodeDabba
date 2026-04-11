import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';

export class SubmitRoundDto {
  @IsOptional()
  @ValidateIf((o) => o.githubLink && o.githubLink !== '')
  @IsUrl()
  githubLink?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateIf((o) => o.videoUrl && o.videoUrl !== '')
  @IsUrl()
  videoUrl?: string;

  // documentUrl is handled via file upload if present
  @IsOptional()
  @IsString()
  documentUrl?: string;
}
