import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EurobondsService } from './eurobonds.service';
import { CreateEurobondDto, UpdateEurobondDto } from './dto';
import { CurrentUser } from '../auth';

@ApiTags('Eurobonds')
@ApiBearerAuth()
@Controller('eurobonds')
export class EurobondsController {
  constructor(private readonly eurobondsService: EurobondsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateEurobondDto) {
    return this.eurobondsService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.eurobondsService.findAll(userId);
  }

  @Get('summary')
  getPortfolioSummary(@CurrentUser('id') userId: string) {
    return this.eurobondsService.getPortfolioSummary(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const eurobond = await this.eurobondsService.findOne(userId, id);
    if (!eurobond) throw new NotFoundException('Eurobond not found');
    return eurobond;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEurobondDto,
  ) {
    return this.eurobondsService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.eurobondsService.remove(userId, id);
    return { message: 'Eurobond deleted successfully' };
  }
}
