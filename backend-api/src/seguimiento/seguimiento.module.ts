import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguimientoService } from './seguimiento.service';
import { SeguimientoController } from './seguimiento.controller';
import { Seguimiento } from './entities/seguimiento.entity';
import { PasoProceso } from './entities/paso-proceso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Seguimiento, PasoProceso])],
  controllers: [SeguimientoController],
  providers: [SeguimientoService],
  exports: [SeguimientoService],
})
export class SeguimientoModule {}
