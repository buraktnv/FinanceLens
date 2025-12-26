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
import { CashService } from './cash.service';
import { CreateCashDto, UpdateCashDto } from './dto';
import { CurrentUser } from '../auth';

@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() createCashDto: CreateCashDto) {
    return this.cashService.create(userId, createCashDto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.cashService.findAll(userId);
  }

  @Get('summary')
  getSummary(@CurrentUser('id') userId: string) {
    return this.cashService.getSummary(userId);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const cash = await this.cashService.findOne(userId, id);
    if (!cash) {
      throw new NotFoundException('Cash account not found');
    }
    return cash;
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateCashDto: UpdateCashDto,
  ) {
    const cash = await this.cashService.update(userId, id, updateCashDto);
    if (!cash) {
      throw new NotFoundException('Cash account not found');
    }
    return cash;
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const cash = await this.cashService.remove(userId, id);
    if (!cash) {
      throw new NotFoundException('Cash account not found');
    }
    return { message: 'Cash account deleted successfully' };
  }
}
