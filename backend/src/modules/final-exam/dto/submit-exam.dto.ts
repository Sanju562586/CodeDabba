import { IsNotEmpty, IsObject } from 'class-validator';

export class SubmitExamDto {
  @IsObject()
  @IsNotEmpty()
  answers: Record<string, string>; // questionId -> selectedOptionId
}
