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
import { StocksService } from './stocks.service';
import { CreateStockDto, UpdateStockDto } from './dto';
import { CurrentUser } from '../auth';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() createStockDto: CreateStockDto) {
    return this.stocksService.create(userId, createStockDto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.stocksService.findAll(userId);
  }

  @Get('summary')
  getPortfolioSummary(@CurrentUser('id') userId: string) {
    return this.stocksService.getPortfolioSummary(userId);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const stock = await this.stocksService.findOne(userId, id);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }
    return stock;
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    const stock = await this.stocksService.update(userId, id, updateStockDto);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }
    return stock;
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const stock = await this.stocksService.remove(userId, id);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }
    return { message: 'Stock deleted successfully' };
  }
}
