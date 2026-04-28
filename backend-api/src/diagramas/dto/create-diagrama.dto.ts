import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const UML_DIAGRAM_TYPES = ['clases', 'casos-uso', 'secuencia', 'paquetes'] as const;
export type UmlDiagramType = typeof UML_DIAGRAM_TYPES[number];

export class UmlMemberDto {
  @IsString()
  visibility: string;

  @IsString()
  text: string;
}

export class CanvasNodeDto {
  @IsString()
  id: string;

  @IsString()
  kind: string;

  @IsString()
  label: string;

  @IsNumber()
  @Type(() => Number)
  x: number;

  @IsNumber()
  @Type(() => Number)
  y: number;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  stereotype?: string;

  @IsString()
  @IsOptional()
  noteText?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  width?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  height?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UmlMemberDto)
  attributes?: UmlMemberDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UmlMemberDto)
  methods?: UmlMemberDto[];
}

export class RelationDto {
  @IsString()
  id: string;

  @IsString()
  kind: string;

  @IsString()
  sourceId: string;

  @IsString()
  targetId: string;

  @IsString()
  @IsOptional()
  label?: string;
}

export class MessageDto {
  @IsString()
  id: string;

  @IsString()
  kind: string;

  @IsString()
  sourceId: string;

  @IsString()
  targetId: string;

  @IsString()
  label: string;

  @IsInt()
  @Type(() => Number)
  order: number;
}

export class FragmentDto {
  @IsString()
  id: string;

  @IsString()
  kind: string;

  @IsString()
  label: string;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsNumber()
  @Type(() => Number)
  x: number;

  @IsNumber()
  @Type(() => Number)
  y: number;

  @IsNumber()
  @Type(() => Number)
  width: number;

  @IsNumber()
  @Type(() => Number)
  height: number;
}

export class CreateDiagramaDto {
  @IsInt()
  @Type(() => Number)
  id_proyecto: number;

  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsIn(UML_DIAGRAM_TYPES)
  tipo: UmlDiagramType;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CanvasNodeDto)
  nodes?: CanvasNodeDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RelationDto)
  relations?: RelationDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages?: MessageDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FragmentDto)
  fragments?: FragmentDto[];
}
