import { IsString, IsOptional, IsInt, ValidateIf } from 'class-validator';

export class UpdateStakeholderDto {
  @ValidateIf((o) => o.id_proceso !== null && o.id_proceso !== undefined)
  @IsInt()
  @IsOptional()
  id_proceso?: number | null;

  @ValidateIf((o) => o.id_subproceso !== null && o.id_subproceso !== undefined)
  @IsInt()
  @IsOptional()
  id_subproceso?: number | null;

  @IsString()
  @IsOptional()
  nombre_completo?: string;

  @IsString()
  @IsOptional()
  rol?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  contacto?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
