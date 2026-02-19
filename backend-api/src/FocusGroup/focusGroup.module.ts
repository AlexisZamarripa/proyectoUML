import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FocusGroupService } from './focusGroup.service';
import { FocusGroupController } from './focusGroup.controller';
import { FocusGroup } from './entities/FG.entity';

@Module({
    imports: [TypeOrmModule.forFeature([FocusGroup])],
    controllers: [FocusGroupController],
    providers: [FocusGroupService],
    exports: [FocusGroupService],
})
export class FocusGroupModule { }