import { PartialType } from '@nestjs/mapped-types';
import { CreateSubprocesoDto } from './create-subproceso.dto';

export class UpdateSubprocesoDto extends PartialType(CreateSubprocesoDto) {}
