import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcesosService } from './procesos.service';
import { ProcesosController } from './procesos.controller';
import { Proceso } from './entities/proceso.entity';
import { Subproceso } from './entities/subproceso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proceso, Subproceso])],
  controllers: [ProcesosController],
  providers: [ProcesosService],
  exports: [ProcesosService],
})
export class ProcesosModule {}
