import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly config: ConfigService) {}

  // Telegram-side webhook receiver. Telegram sends a POST with the bot's update
  // payload and the secret in the `X-Telegram-Bot-Api-Secret-Token` header.
  @Post('webhook')
  @HttpCode(200)
  @SkipThrottle()
  handleUpdate(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() update: unknown,
  ) {
    const expected = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (expected && secret !== expected) throw new UnauthorizedException();

    // No inbound logic is required for outbound notifications.
    // Extend here to handle /start, callback_query, etc. if needed.
    void update;
    return { ok: true };
  }
}
