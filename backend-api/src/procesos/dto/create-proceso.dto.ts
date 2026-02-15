import { IsString, IsInt, IsOptional, IsArray } from 'class-validator';

export class CreateProcesoDto {
  @IsInt()
  id_proyecto: number;

  @IsInt()
  @IsOptional()
  id_stakeholder?: number | null;

  @IsString()
  nombre_proceso: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsArray()
  @IsOptional()
  departamentos?: string[];

  @IsArray()
  @IsOptional()
  pasos_clave?: string[];
}
