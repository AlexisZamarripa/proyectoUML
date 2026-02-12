import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CreateStakeholderDto } from './dto/create-stakeholder.dto';
import { UpdateStakeholderDto } from './dto/update-stakeholder.dto';
import { Stakeholder } from './entities/stakeholder.entity';

@Injectable()
export class StakeholdersService {
  constructor(
    @InjectRepository(Stakeholder)
    private stakeholdersRepository: Repository<Stakeholder>,
  ) {}

  async create(createStakeholderDto: CreateStakeholderDto): Promise<Stakeholder> {
    // Establecer NULL explícitamente para campos opcionales no proporcionados
    const data: DeepPartial<Stakeholder> = {
      ...createStakeholderDto,
      id_proceso: createStakeholderDto.id_proceso ?? null,
      id_subproceso: createStakeholderDto.id_subproceso ?? null,
    };
    
    const stakeholder = this.stakeholdersRepository.create(data);
    return this.stakeholdersRepository.save(stakeholder);
  }

  async findAll(): Promise<Stakeholder[]> {
    return await this.stakeholdersRepository.find({
      order: { id_stakeholder: 'DESC' },
    });
  }

  async findByProyecto(idProyecto: number): Promise<Stakeholder[]> {
    return await this.stakeholdersRepository.find({
      where: { id_proyecto: idProyecto },
      order: { id_stakeholder: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Stakeholder> {
    const stakeholder = await this.stakeholdersRepository.findOne({
      where: { id_stakeholder: id },
    });

    if (!stakeholder) {
      throw new NotFoundException(`Stakeholder con ID ${id} no encontrado`);
    }

    return stakeholder;
  }

  async update(id: number, updateStakeholderDto: UpdateStakeholderDto): Promise<Stakeholder> {
    const stakeholder = await this.findOne(id);
    
    Object.assign(stakeholder, updateStakeholderDto);
    
    return await this.stakeholdersRepository.save(stakeholder);
  }

  async remove(id: number): Promise<void> {
    const stakeholder = await this.findOne(id);
    await this.stakeholdersRepository.remove(stakeholder);
  }
}
