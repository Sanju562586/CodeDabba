import { IsOptional, IsString } from 'class-validator';

export class SubmitTaskDto {
  @IsString()
  @IsOptional()
  selectedOptionId?: string;

  @IsString()
  @IsOptional()
  code?: string;
}
