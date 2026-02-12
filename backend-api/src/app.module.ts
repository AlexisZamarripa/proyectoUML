import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProyectosModule } from './proyectos/proyectos.module';
import { StakeholdersModule } from './stakeholders/stakeholders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'proyecto_uml',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // En producción debe ser false
      logging: true,
    }),
    ProyectosModule,
    StakeholdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
