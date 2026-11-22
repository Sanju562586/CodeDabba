import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import type { Response } from 'express'; // Fix linter error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer'; // Ensure Multer types are loaded
import { AuthGuard } from '../../common/guards/auth.guard';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(OptionalAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max limit
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const savedFile = await this.filesService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return {
      id: savedFile.id,
      filename: savedFile.filename,
      url: `/api/v1/files/${savedFile.id}`,
    };
  }

  @Get(':id')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    await this.filesService.streamFile(id, res);
  }
}
