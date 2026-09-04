import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';

/**
 * MailService/SmsService MessagingModule-dan gəlir və o modul @Global-dır —
 * ona görə burada ayrıca import lazım deyil.
 */
@Module({
  providers: [VerificationService],
  exports: [VerificationService], // auth çağırır
})
export class VerificationModule {}
