import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncuestasService } from './encuestas.service';
import { EncuestasController } from './encuestas.controller';
import { Encuesta } from './entities/encuesta.entity';
import { PreguntaEncuesta } from './entities/pregunta.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Encuesta, PreguntaEncuesta])],
    controllers: [EncuestasController],
    providers: [EncuestasService],
    exports: [EncuestasService],
})
export class EncuestasModule { }