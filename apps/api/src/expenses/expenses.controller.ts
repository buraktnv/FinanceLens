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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseDto,
  FindExpensesQueryDto,
  UpdateExpenseDto,
} from './dto';
import { CurrentUser } from '../auth';
import { MONTH_PIPE, YEAR_PIPE } from '../common/pipes';

@ApiTags('Expenses')
@ApiBearerAuth()
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
    @Query() query: FindExpensesQueryDto,
  ) {
    return this.expensesService.findAll(userId, query);
  }

  @Get('summary')
  getSummary(
    @CurrentUser('id') userId: string,
    @Query('month', MONTH_PIPE) month?: number,
    @Query('year', YEAR_PIPE) year?: number,
  ) {
    return this.expensesService.getSummary(
      userId,
      month !== undefined ? month - 1 : undefined,
      year,
    );
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const expense = await this.expensesService.findOne(userId, id);
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.expensesService.remove(userId, id);
    return { message: 'Expense deleted successfully' };
  }
}
