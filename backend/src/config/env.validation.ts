import { plainToInstance } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

class EnvSchema {
  @IsOptional() @IsString() NODE_ENV?: string;

  @IsString() DATABASE_URL!: string;

  @IsString() TELEGRAM_BOT_TOKEN!: string;
  @IsString() TELEGRAM_CHAT_ID!: string;
  @IsOptional() @IsString() TELEGRAM_WEBHOOK_SECRET?: string;
  @IsOptional() @IsString() TELEGRAM_WEBHOOK_URL?: string;

  @IsOptional() @IsString() CORS_ORIGIN?: string;
  @IsInt() @Min(1) PORT: number = 3000;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvSchema, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) {
    throw new Error(
      `Invalid environment variables:\n${errors
        .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
        .join('\n')}`,
    );
  }
  return validated;
}
