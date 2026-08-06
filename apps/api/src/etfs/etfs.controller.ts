import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
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
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const etf = await this.etfsService.findOne(userId, id);
    if (!etf) throw new NotFoundException('ETF not found');
    return etf;
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEtfDto,
  ) {
    const etf = await this.etfsService.update(userId, id, dto);
    if (!etf) throw new NotFoundException('ETF not found');
    return etf;
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const etf = await this.etfsService.remove(userId, id);
    if (!etf) throw new NotFoundException('ETF not found');
    return { message: 'ETF deleted successfully' };
  }
}
