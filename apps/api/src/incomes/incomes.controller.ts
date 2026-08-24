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
import { IncomesService } from './incomes.service';
import { CreateIncomeDto, FindIncomesQueryDto, UpdateIncomeDto } from './dto';
import { CurrentUser } from '../auth';
import { MONTH_PIPE, YEAR_PIPE } from '../common/pipes';

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
    @Query() query: FindIncomesQueryDto,
  ) {
    return this.incomesService.findAll(userId, query);
  }

  @Get('summary')
  getSummary(
    @CurrentUser('id') userId: string,
    @Query('month', MONTH_PIPE) month?: number,
    @Query('year', YEAR_PIPE) year?: number,
  ) {
    return this.incomesService.getSummary(
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
    const income = await this.incomesService.findOne(userId, id);
    if (!income) throw new NotFoundException('Income not found');
    return income;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.incomesService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.incomesService.remove(userId, id);
    return { message: 'Income deleted successfully' };
  }
}
