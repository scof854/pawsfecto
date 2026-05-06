import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const sanitize = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value;

export class CreateLeadDto {
  @Transform(sanitize)
  @IsString()
  @Length(2, 80)
  name!: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\+?[0-9 ()\-]{7,20}$/, { message: 'phone must be a valid phone number' })
  phone!: string;

  @IsOptional()
  @Transform(trim)
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @Transform(sanitize)
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @Transform(sanitize)
  @IsString()
  @MaxLength(80)
  source?: string;

  // Honeypot: real users never fill this; bots usually do.
  @IsOptional()
  @IsString()
  @MaxLength(0, { message: 'spam detected' })
  website?: string;
}
