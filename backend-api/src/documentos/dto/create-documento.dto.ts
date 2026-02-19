import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class DocumentoItemDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  tipo?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class CreateDocumentoDto {
  @IsInt()
  id_proyecto: number;

  @IsInt()
  id_proceso: number;

  @IsInt()
  id_subproceso: number;

  @IsString()
  titulo_analisis: string;

  @IsString()
  tipo_documento: string;

  @IsString()
  @IsOptional()
  fuente?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DocumentoItemDto)
  documentos?: DocumentoItemDto[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  hallazgos?: string[];

  @IsString()
  @IsOptional()
  recomendaciones?: string;
}
