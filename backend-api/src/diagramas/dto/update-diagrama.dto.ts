import { PartialType } from '@nestjs/mapped-types';
import { CreateDiagramaDto } from './create-diagrama.dto';

export class UpdateDiagramaDto extends PartialType(CreateDiagramaDto) {}
