import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePreguntaEncuestaDto {
    @IsString()
    @IsNotEmpty()
    pregunta: string;

    @IsEnum(['texto_abierto', 'opcion_multiple', 'escala', 'si_no'])
    @IsOptional()
    tipo_pregunta?: 'texto_abierto' | 'opcion_multiple' | 'escala' | 'si_no';
}

export class CreateEncuestaDto {
    @IsInt()
    @IsNotEmpty()
    id_proyecto: number;

    @IsInt()
    @IsOptional()        // ← cambiar
    id_proceso?: number; // ← cambiar

    @IsInt()
    @IsOptional()           // ← cambiar
    id_subproceso?: number; // ← cambiar

    @IsString()
    @IsOptional()
    titulo_encuesta?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsInt()
    @IsOptional()
    numero_participantes_esperados?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePreguntaEncuestaDto)
    @IsOptional()
    preguntas?: CreatePreguntaEncuestaDto[];
}