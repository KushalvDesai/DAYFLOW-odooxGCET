import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
}

// Register enum for GraphQL
registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
  description: 'Attendance status types',
});

// Mongoose Schema
@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  checkInTime: Date;

  @Prop()
  checkOutTime?: Date;

  @Prop({ type: String, enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @Prop({ default: 0 })
  workHours: number;

  @Prop({ default: false })
  isLate: boolean;

  @Prop()
  lateByMinutes?: number;

  @Prop()
  remarks?: string;

  @Prop()
  location?: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Create compound index for userId and date (unique attendance per day)
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ employeeId: 1, date: 1 });
AttendanceSchema.index({ status: 1 });

// GraphQL Type
@ObjectType()
export class AttendanceType {
  @Field(() => ID)
  _id: string;

  @Field()
  userId: string;

  @Field()
  employeeId: string;

  @Field()
  date: Date;

  @Field()
  checkInTime: Date;

  @Field({ nullable: true })
  checkOutTime?: Date;

  @Field(() => AttendanceStatus)
  status: AttendanceStatus;

  @Field()
  workHours: number;

  @Field()
  isLate: boolean;

  @Field({ nullable: true })
  lateByMinutes?: number;

  @Field({ nullable: true })
  remarks?: string;

  @Field({ nullable: true })
  location?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
