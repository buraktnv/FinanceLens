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
import { SilverService } from './silver.service';
import { CreateSilverDto, UpdateSilverDto } from './dto';
import { CurrentUser } from '../auth';

@Controller('silver')
export class SilverController {
  constructor(private readonly silverService: SilverService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() createSilverDto: CreateSilverDto) {
    return this.silverService.create(userId, createSilverDto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.silverService.findAll(userId);
  }

  @Get('summary')
  getSummary(@CurrentUser('id') userId: string) {
    return this.silverService.getSummary(userId);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const silver = await this.silverService.findOne(userId, id);
    if (!silver) {
      throw new NotFoundException('Silver holding not found');
    }
    return silver;
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateSilverDto: UpdateSilverDto,
  ) {
    const silver = await this.silverService.update(userId, id, updateSilverDto);
    if (!silver) {
      throw new NotFoundException('Silver holding not found');
    }
    return silver;
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const silver = await this.silverService.remove(userId, id);
    if (!silver) {
      throw new NotFoundException('Silver holding not found');
    }
    return { message: 'Silver holding deleted successfully' };
  }
}
