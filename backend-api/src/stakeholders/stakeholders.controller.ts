import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { StakeholdersService } from './stakeholders.service';
import { CreateStakeholderDto } from './dto/create-stakeholder.dto';
import { UpdateStakeholderDto } from './dto/update-stakeholder.dto';

@Controller('stakeholders')
export class StakeholdersController {
  constructor(private readonly stakeholdersService: StakeholdersService) {}

  @Post()
  create(@Body() createStakeholderDto: CreateStakeholderDto) {
    return this.stakeholdersService.create(createStakeholderDto);
  }

  @Get()
  findAll(@Query('proyectoId') proyectoId?: string) {
    if (proyectoId) {
      return this.stakeholdersService.findByProyecto(parseInt(proyectoId, 10));
    }
    return this.stakeholdersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stakeholdersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStakeholderDto: UpdateStakeholderDto,
  ) {
    return this.stakeholdersService.update(id, updateStakeholderDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.stakeholdersService.remove(id);
  }
}
