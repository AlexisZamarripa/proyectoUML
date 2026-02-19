import { PartialType } from '@nestjs/mapped-types';
import { CreateHistoriaUsuarioDto } from './crearCU.dto';

export class UpdateHistoriaUsuarioDto extends PartialType(CreateHistoriaUsuarioDto) { }