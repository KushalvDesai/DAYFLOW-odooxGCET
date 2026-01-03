import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../user/schema/user.schema';

export type PendingUserDocument = PendingUser & Document;

@Schema({ timestamps: true })
export class PendingUser {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  address?: string;

  @Prop()
  department?: string;

  @Prop()
  designation?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Prop()
  joiningDate?: Date;

  @Prop({ required: true })
  emailVerificationOTP: string;

  @Prop({ required: true })
  otpExpiresAt: Date;

  @Prop({ default: Date.now, expires: 86400 }) // Auto-delete after 24 hours
  createdAt: Date;
}

export const PendingUserSchema = SchemaFactory.createForClass(PendingUser);
