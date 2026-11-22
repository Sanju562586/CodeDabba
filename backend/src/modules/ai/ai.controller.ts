import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatWithAiDto } from './dto/chat.dto';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('quota')
  @UseGuards(AuthGuard)
  async getQuota(@Request() req: any) {
    return this.aiService.getDailyQuota(req.user.id);
  }

  @Post('chat')
  @UseGuards(AuthGuard)
  async chat(@Request() req: any, @Body() dto: ChatWithAiDto) {
    return this.aiService.chatWithAi(
      req.user.id,
      dto.message,
      dto.courseId,
      dto.chapterId,
    );
  }
}
