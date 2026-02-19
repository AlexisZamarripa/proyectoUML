import { PartialType } from '@nestjs/mapped-types';
import { CreateObservacionDto } from './crearObservacion.dto';

export class UpdateObservacionDto extends PartialType(CreateObservacionDto) { }