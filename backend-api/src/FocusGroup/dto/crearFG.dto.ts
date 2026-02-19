import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsDateString } from 'class-validator';

export class CreateFocusGroupDto {
    @IsInt()
    @IsNotEmpty()
    id_proyecto: number;

    @IsInt()
    @IsNotEmpty()
    id_proceso: number;

    @IsInt()
    @IsNotEmpty()
    id_subproceso: number;

    @IsString()
    @IsOptional()
    nombre_focus?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsDateString()
    @IsOptional()
    fecha_inicio?: string;

    @IsEnum(['planificacion', 'en_progreso', 'pausado', 'completado'])
    @IsOptional()
    estado?: 'planificacion' | 'en_progreso' | 'pausado' | 'completado';

    @IsString()
    @IsOptional()
    color?: string;
}