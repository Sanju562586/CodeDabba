import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatWithAiDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  chapterId?: string;
}
