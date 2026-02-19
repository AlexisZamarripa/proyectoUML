import { PartialType } from '@nestjs/mapped-types';
import { CreateEntrevistaDto } from './crearEntrevista.dto';

export class UpdateEntrevistaDto extends PartialType(CreateEntrevistaDto) { }