import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservacionesService } from './observaciones.service';
import { ObservacionesController } from './observaciones.controller';
import { Observacion } from './entities/observaciones.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Observacion])],
    controllers: [ObservacionesController],
    providers: [ObservacionesService],
    exports: [ObservacionesService],
})
export class ObservacionesModule { }