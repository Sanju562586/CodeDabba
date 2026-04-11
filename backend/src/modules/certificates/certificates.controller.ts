import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CertificatesService } from './certificates.service';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post(':hackathonId')
  @UseGuards(AuthGuard)
  async generate(@Request() req: any, @Param('hackathonId') hackathonId: string) {
    return await this.certificatesService.generate(req.user.id, hackathonId);
  }

  @Post('course/:courseId')
  @UseGuards(AuthGuard)
  async generateCourseCertificate(@Request() req: any, @Param('courseId') courseId: string) {
    return await this.certificatesService.generateCourseCertificate(req.user.id, courseId);
  }

  @Get('my')
  @UseGuards(AuthGuard)
  async getMyCertificates(@Request() req: any) {
    // Basic fetch all or filter? Let's implement this in service
    return await this.certificatesService.findByUser(req.user.id);
  }

  @Get('verify/:id')
  async verify(@Param('id') id: string) {
    const cert = await this.certificatesService.verify(id);
    if (!cert) throw new NotFoundException('Certification record not verified in registry.');
    return cert;
  }

  @Get(':id/download')
  async downloadCertificate(@Param('id') id: string, @Res() res: any) {
     return await this.certificatesService.streamCertificatePDF(id, res);
  }
}
