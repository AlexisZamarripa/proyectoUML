import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePreguntaDto {
    @IsString()
    @IsNotEmpty()
    pregunta: string;
}

export class CreateEntrevistaDto {
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
    titulo_entrevista?: string;

    @IsString()
    @IsOptional()
    entrevistador?: string;

    @IsString()
    @IsOptional()
    entrevistado?: string;

    @IsString()
    @IsOptional()
    notas_contexto?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePreguntaDto)
    @IsOptional()
    preguntas?: CreatePreguntaDto[];
}