import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchSyncQueueService } from './queue/match-sync.queue';
import { MockSyncProvider } from './providers/mock-sync.provider';
import { Nbn23SyncProvider } from './providers/nbn23-sync.provider';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../../common/audit/audit.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
  imports: [PrismaModule, AuditModule, MailModule],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    MatchSyncQueueService,
    MockSyncProvider,
    Nbn23SyncProvider,
  ],
  exports: [MatchesService, MatchSyncQueueService],
})
export class MatchesModule {}
