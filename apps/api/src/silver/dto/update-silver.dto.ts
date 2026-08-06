import { PartialType } from '@nestjs/swagger';
import { CreateSilverDto } from './create-silver.dto';

export class UpdateSilverDto extends PartialType(CreateSilverDto) {}
