import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto';
import { CurrentUser } from '../auth';

@ApiTags('Incomes')
@ApiBearerAuth()
@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateIncomeDto) {
    return this.incomesService.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.incomesService.findAll(userId, { type, startDate, endDate });
  }

  @Get('summary')
  getSummary(
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.incomesService.getSummary(
      userId,
      month ? parseInt(month, 10) - 1 : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const income = await this.incomesService.findOne(userId, id);
    if (!income) throw new NotFoundException('Income not found');
    return income;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.incomesService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.incomesService.remove(userId, id);
    return { message: 'Income deleted successfully' };
  }
}
