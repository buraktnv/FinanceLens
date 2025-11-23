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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';
import { CurrentUser } from '../auth';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('category') category?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.findAll(userId, { category, paymentMethod, startDate, endDate });
  }

  @Get('summary')
  getSummary(
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.expensesService.getSummary(
      userId,
      month ? parseInt(month, 10) - 1 : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const expense = await this.expensesService.findOne(userId, id);
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    const expense = await this.expensesService.update(userId, id, dto);
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const expense = await this.expensesService.remove(userId, id);
    if (!expense) throw new NotFoundException('Expense not found');
    return { message: 'Expense deleted successfully' };
  }
}
