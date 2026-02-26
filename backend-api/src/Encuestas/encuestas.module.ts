import { Module, Res } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncuestasService } from './encuestas.service';
import { EncuestasController } from './encuestas.controller';
import { Encuesta } from './entities/encuesta.entity';
import { PreguntaEncuesta } from './entities/pregunta.entity';
import { RespuestaEncuesta } from './entities/respuestas.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Encuesta, PreguntaEncuesta, RespuestaEncuesta])],
    controllers: [EncuestasController],
    providers: [EncuestasService],
    exports: [EncuestasService],
})
export class EncuestasModule { }