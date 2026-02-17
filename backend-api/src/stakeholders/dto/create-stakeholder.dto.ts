import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateStakeholderDto {
  @IsInt()
  @IsNotEmpty()
  id_proyecto: number;

  @IsString()
  @IsNotEmpty()
  nombre_completo: string;

  @IsString()
  @IsNotEmpty()
  rol: string;

  @IsString()
  @IsNotEmpty()
  area: string;

  @IsString()
  @IsNotEmpty()
  contacto: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsString()
  @IsNotEmpty()
  color: string;
}
