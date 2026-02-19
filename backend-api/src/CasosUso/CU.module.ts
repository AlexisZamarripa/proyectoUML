import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriasUsuarioService } from './CU.service';
import { HistoriasUsuarioController } from './CU.controller';
import { HistoriaUsuario } from './entities/CU.entity';

@Module({
    imports: [TypeOrmModule.forFeature([HistoriaUsuario])],
    controllers: [HistoriasUsuarioController],
    providers: [HistoriasUsuarioService],
    exports: [HistoriasUsuarioService],
})
export class HistoriasUsuarioModule { }