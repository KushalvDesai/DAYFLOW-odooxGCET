import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString, IsDate } from 'class-validator';
import { AttendanceStatus, AttendanceType } from '../schema/attendance.schema';

@InputType()
export class CheckInInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  remarks?: string;
}

@InputType()
export class CheckOutInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  remarks?: string;
}

@InputType()
export class GetAttendanceByDateRangeInput {
  @Field()
  @IsDate()
  startDate: Date;

  @Field()
  @IsDate()
  endDate: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  employeeId?: string;
}

@InputType()
export class UpdateAttendanceInput {
  @Field()
  @IsString()
  attendanceId: string;

  @Field(() => AttendanceStatus, { nullable: true })
  @IsOptional()
  status?: AttendanceStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  remarks?: string;
}

// Response Types
@ObjectType()
export class CheckInResponse {
  @Field()
  message: string;

  @Field()
  success: boolean;

  @Field(() => AttendanceType)
  attendance: AttendanceType;
}

@ObjectType()
export class CheckOutResponse {
  @Field()
  message: string;

  @Field()
  success: boolean;

  @Field(() => AttendanceType)
  attendance: AttendanceType;

  @Field()
  workHours: number;
}

@ObjectType()
export class AttendanceSummary {
  @Field()
  totalDays: number;

  @Field()
  presentDays: number;

  @Field()
  absentDays: number;

  @Field()
  lateDays: number;

  @Field()
  halfDays: number;

  @Field()
  leaveDays: number;

  @Field()
  totalWorkHours: number;

  @Field()
  averageWorkHours: number;
}
