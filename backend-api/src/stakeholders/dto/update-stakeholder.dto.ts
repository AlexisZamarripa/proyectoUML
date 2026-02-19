import { IsString, IsOptional } from 'class-validator';

export class UpdateStakeholderDto {
  @IsString()
  @IsOptional()
  nombre_completo?: string;

  @IsString()
  @IsOptional()
  rol?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  contacto?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
