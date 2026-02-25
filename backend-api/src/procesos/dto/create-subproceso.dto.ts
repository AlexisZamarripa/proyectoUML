import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateSubprocesoDto {
  @IsInt()
  id_proyecto: number;

  @IsInt()
  id_proceso: number;

  @IsInt()
  @IsOptional()
  id_stakeholder?: number | null;

  @IsString()
  nombre_subproceso: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  tipo_herramienta?: string | null;

  @IsInt()
  @IsOptional()
  id_herramienta?: number | null;
}
