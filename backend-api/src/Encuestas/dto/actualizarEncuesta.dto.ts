import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateEncuestaDto {
    @IsString()
    @IsOptional()
    titulo_encuesta?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsInt()
    @IsOptional()
    numero_participantes_esperados?: number;
}