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
import { StocksService } from './stocks.service';
import { CreateStockDto, UpdateStockDto } from './dto';
import { CurrentUser } from '../auth';

@ApiTags('Stocks')
@ApiBearerAuth()
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() createStockDto: CreateStockDto,
  ) {
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
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const stock = await this.stocksService.findOne(userId, id);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }
    return stock;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    return this.stocksService.update(userId, id, updateStockDto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.stocksService.remove(userId, id);
    return { message: 'Stock deleted successfully' };
  }
}
