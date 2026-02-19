import { PartialType } from '@nestjs/mapped-types';
import { CreateEncuestaDto } from './crearEncuesta.dto';

export class UpdateEncuestaDto extends PartialType(CreateEncuestaDto) { }