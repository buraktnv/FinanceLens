import { PartialType } from '@nestjs/swagger';
import { CreateEtfDto } from './create-etf.dto';

export class UpdateEtfDto extends PartialType(CreateEtfDto) {}
