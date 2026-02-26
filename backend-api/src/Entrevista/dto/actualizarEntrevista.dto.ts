import { IsString, IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePreguntaDto } from './crearEntrevista.dto';

export class UpdateEntrevistaDto {
    @IsInt()
    @IsOptional()
    id_proceso?: number;

    @IsInt()
    @IsOptional()
    id_subproceso?: number;

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
