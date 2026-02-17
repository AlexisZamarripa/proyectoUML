import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { EstadoProyecto } from '../entities/proyecto.entity';

export class CreateProyectoDto {
  @IsString()
  @IsNotEmpty()
  nombre_proyecto: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsDateString()
  @IsOptional()
  fecha_inicio?: string;

  @IsEnum(EstadoProyecto)
  @IsOptional()
  estado?: EstadoProyecto;

  @IsString()
  @IsOptional()
  color?: string;
}
