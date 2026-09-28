import { Module } from '@nestjs/common';
import { NominationsController } from './nominations.controller';
import { NominationsService } from './nominations.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../../common/audit/audit.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
  imports: [PrismaModule, AuditModule, MailModule],
  controllers: [NominationsController],
  providers: [NominationsService],
  exports: [NominationsService],
})
export class NominationsModule {}
