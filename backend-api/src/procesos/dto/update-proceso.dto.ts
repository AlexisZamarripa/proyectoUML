import { PartialType } from '@nestjs/mapped-types';
import { CreateProcesoDto } from './create-proceso.dto';

export class UpdateProcesoDto extends PartialType(CreateProcesoDto) {}
