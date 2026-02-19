import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntrevistasService } from './entrevista.service';
import { EntrevistasController } from './entrevista.controller';
import { Entrevista } from './entities/entrevista.entity';
import { PreguntaEntrevista } from './entities/pregunta-entrevista.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Entrevista, PreguntaEntrevista])],
    controllers: [EntrevistasController],
    providers: [EntrevistasService],
    exports: [EntrevistasService],
})
export class EntrevistasModule { }