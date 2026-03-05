import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum } from 'class-validator';

export class CreateHistoriaUsuarioDto {
    @IsInt()
    @IsNotEmpty()
    id_proyecto: number;

    @IsInt()
    @IsOptional()
    id_proceso?: number;

    @IsInt()
    @IsOptional()
    id_subproceso?: number;

    @IsString()
    @IsOptional()
    titulo_historia?: string;

    @IsString()
    @IsOptional()
    rol?: string;

    @IsString()
    @IsOptional()
    quiero?: string;

    @IsString()
    @IsOptional()
    para_que?: string;

    @IsEnum(['baja', 'media', 'alta'])
    @IsOptional()
    prioridad?: 'baja' | 'media' | 'alta';

    @IsString()
    @IsOptional()
    estimacion?: string;

    @IsString()
    @IsOptional()
    criterios_aceptacion?: string;
}