import { IsInt, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RespuestaItemDto {
    @IsInt()
    id_pregunta: number;

    @IsString()
    @IsOptional()
    respuesta?: string;
}

export class CreateRespuestasDto {
    @IsInt()
    id_encuesta: number;

    @IsInt()
    id_subproceso: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RespuestaItemDto)
    respuestas: RespuestaItemDto[];
}