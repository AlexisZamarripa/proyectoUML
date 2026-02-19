import { PartialType } from '@nestjs/mapped-types';
import { CreateFocusGroupDto } from './crearFG.dto';

export class UpdateFocusGroupDto extends PartialType(CreateFocusGroupDto) { }