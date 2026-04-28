import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagramasService } from './diagramas.service';
import { DiagramasController } from './diagramas.controller';
import { Diagrama } from './entities/diagrama.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Diagrama])],
  controllers: [DiagramasController],
  providers: [DiagramasService],
  exports: [DiagramasService],
})
export class DiagramasModule {}
