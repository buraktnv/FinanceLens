import { PartialType } from '@nestjs/swagger';
import { CreateEurobondDto } from './create-eurobond.dto';

export class UpdateEurobondDto extends PartialType(CreateEurobondDto) {}
