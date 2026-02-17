import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StakeholdersService } from './stakeholders.service';
import { StakeholdersController } from './stakeholders.controller';
import { Stakeholder } from './entities/stakeholder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stakeholder])],
  controllers: [StakeholdersController],
  providers: [StakeholdersService],
  exports: [StakeholdersService],
})
export class StakeholdersModule {}
