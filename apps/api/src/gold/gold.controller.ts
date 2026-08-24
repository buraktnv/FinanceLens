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
import { GoldService } from './gold.service';
import { CreateGoldDto, UpdateGoldDto } from './dto';
import { CurrentUser } from '../auth';

@ApiTags('Gold')
@ApiBearerAuth()
@Controller('gold')
export class GoldController {
  constructor(private readonly goldService: GoldService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() createGoldDto: CreateGoldDto,
  ) {
    return this.goldService.create(userId, createGoldDto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.goldService.findAll(userId);
  }

  @Get('summary')
  getSummary(@CurrentUser('id') userId: string) {
    return this.goldService.getSummary(userId);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const gold = await this.goldService.findOne(userId, id);
    if (!gold) {
      throw new NotFoundException('Gold holding not found');
    }
    return gold;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateGoldDto: UpdateGoldDto,
  ) {
    return this.goldService.update(userId, id, updateGoldDto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.goldService.remove(userId, id);
    return { message: 'Gold holding deleted successfully' };
  }
}
