import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceService } from './attendance.service';
import { AttendanceResolver } from './attendance.resolver';
import { Attendance, AttendanceSchema } from './schema/attendance.schema';
import { User, UserSchema } from '../user/schema/user.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  providers: [AttendanceService, AttendanceResolver],
  exports: [AttendanceService],
})
export class AttendanceModule {}
