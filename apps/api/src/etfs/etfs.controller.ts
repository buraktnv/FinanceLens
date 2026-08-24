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
import { EtfsService } from './etfs.service';
import { CreateEtfDto, UpdateEtfDto } from './dto';
import { CurrentUser } from '../auth';

@ApiTags('ETFs')
@ApiBearerAuth()
@Controller('etfs')
export class EtfsController {
  constructor(private readonly etfsService: EtfsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateEtfDto) {
    return this.etfsService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.etfsService.findAll(userId);
  }

  @Get('summary')
  getPortfolioSummary(@CurrentUser('id') userId: string) {
    return this.etfsService.getPortfolioSummary(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const etf = await this.etfsService.findOne(userId, id);
    if (!etf) throw new NotFoundException('ETF not found');
    return etf;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEtfDto,
  ) {
    return this.etfsService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.etfsService.remove(userId, id);
    return { message: 'ETF deleted successfully' };
  }
}
