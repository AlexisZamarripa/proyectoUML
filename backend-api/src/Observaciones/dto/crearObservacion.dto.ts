import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateObservacionDto {
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
    nota_rapida?: string;

    @IsString()
    @IsOptional()
    titulo?: string;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsString()
    @IsOptional()
    hallazgos_puntos_clave?: string;
}