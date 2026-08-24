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
import { SilverService } from './silver.service';
import { CreateSilverDto, UpdateSilverDto } from './dto';
import { CurrentUser } from '../auth';

@ApiTags('Silver')
@ApiBearerAuth()
@Controller('silver')
export class SilverController {
  constructor(private readonly silverService: SilverService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() createSilverDto: CreateSilverDto,
  ) {
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
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const silver = await this.silverService.findOne(userId, id);
    if (!silver) {
      throw new NotFoundException('Silver holding not found');
    }
    return silver;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSilverDto: UpdateSilverDto,
  ) {
    return this.silverService.update(userId, id, updateSilverDto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.silverService.remove(userId, id);
    return { message: 'Silver holding deleted successfully' };
  }
}
