import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HackathonActivityLog, ActivityType, LogStatus } from '../../entities/hackathon-activity-log.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class HackathonsLoggingService {
  constructor(
    @InjectRepository(HackathonActivityLog)
    private readonly logRepository: Repository<HackathonActivityLog>,
  ) {}

  async log(params: {
    hackathonId: string;
    activityType: ActivityType;
    description: string;
    status?: LogStatus;
    actor?: User | any;
    entityType?: string;
    entityId?: string;
    prevState?: any;
    newState?: any;
    metadata?: any;
    phase?: string;
    roundId?: string;
    ipAddress?: string;
  }) {
    const log = this.logRepository.create({
      hackathonId: params.hackathonId,
      activityType: params.activityType,
      description: params.description,
      status: params.status || LogStatus.SUCCESS,
      phase: params.phase,
      roundId: params.roundId,
      performedById: params.actor?.id,
      actorName: params.actor?.name || 'System',
      actorRole: params.actor?.role || 'SYSTEM',
      entityType: params.entityType,
      entityId: params.entityId,
      prevState: params.prevState,
      newState: params.newState,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
    });

    return await this.logRepository.save(log);
  }
}
