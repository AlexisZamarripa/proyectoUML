import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsDateString, Min } from 'class-validator';

export class CreateFocusGroupDto {
    @IsInt()
    @IsNotEmpty()
    id_proyecto: number;

    @IsString()
    @IsNotEmpty()
    nombre_focus: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsDateString()
    @IsOptional()
    fecha_inicio?: string;

    @IsDateString()
    @IsOptional()
    fecha_fin?: string;

    @IsEnum(['presencial', 'virtual', 'hibrido'])
    @IsOptional()
    modalidad?: 'presencial' | 'virtual' | 'hibrido';

    @IsString()
    @IsOptional()
    lugar?: string;

    @IsString()
    @IsOptional()
    moderador?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    numero_participantes?: number;

    @IsEnum(['planificacion', 'en_progreso', 'pausado', 'completado'])
    @IsOptional()
    estado?: 'planificacion' | 'en_progreso' | 'pausado' | 'completado';

    @IsString()
    @IsOptional()
    conclusiones?: string;
}