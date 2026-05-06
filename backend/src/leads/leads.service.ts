import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async create(dto: CreateLeadDto, ctx: { ip?: string; userAgent?: string }) {
    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        message: dto.message,
        source: dto.source,
        ip: ctx.ip,
        userAgent: ctx.userAgent?.slice(0, 500),
      },
    });

    try {
      await this.incrementAttempts(lead.id);
      await this.telegram.sendLead(lead);
      const sentLead = await this.markSent(lead.id);
      this.logger.log(`Lead ${lead.id} accepted from ${ctx.ip ?? 'unknown'} and delivered`);
      return sentLead;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failedLead = await this.markFailed(lead.id, message, 1);
      this.logger.error(`Lead ${lead.id} accepted but Telegram delivery failed: ${message}`);
      return failedLead;
    }
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return lead;
  }

  markSent(id: string) {
    return this.prisma.lead.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), lastError: null },
    });
  }

  markFailed(id: string, error: string, attempts: number) {
    return this.prisma.lead.update({
      where: { id },
      data: {
        status: 'FAILED',
        lastError: error.slice(0, 500),
        attempts,
      },
    });
  }

  incrementAttempts(id: string) {
    return this.prisma.lead.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }
}
