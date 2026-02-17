import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PasoDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  duracion?: string;

  @IsString()
  @IsOptional()
  responsable?: string;
}

class MetricaDto {
  @IsString()
  nombre: string;

  @IsString()
  valor: string;
}

export class CreateSeguimientoDto {
  @IsInt()
  id_proyecto: number;

  @IsInt()
  @IsOptional()
  id_proceso?: number;

  @IsInt()
  @IsOptional()
  id_subproceso?: number;

  @IsString()
  titulo: string;

  @IsString()
  @IsOptional()
  idTransaccion?: string;

  @IsString()
  nombreProceso: string;

  @IsString()
  @IsOptional()
  procesoVinculado?: string;

  @IsString()
  @IsOptional()
  subproceso?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PasoDto)
  pasos?: PasoDto[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  problemas?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MetricaDto)
  metricas?: MetricaDto[];
}
