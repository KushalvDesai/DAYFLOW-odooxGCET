import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  HR = 'HR',
  ADMIN = 'ADMIN',
}

// Register enum for GraphQL
registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role types in the HRMS system',
});

// Mongoose Schema
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  employeeId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password?: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  companyName?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  profilePicture?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationOTP?: string;

  @Prop()
  otpExpiresAt?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin?: Date;

  @Prop()
  department?: string;

  @Prop()
  designation?: string;

  @Prop()
  joiningDate?: Date;

  @Prop()
  basicSalary?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add index for role (email and employeeId already have unique indexes from @Prop)
UserSchema.index({ role: 1 });

// GraphQL Type
@ObjectType()
export class UserType {
  @Field(() => ID)
  _id: string;

  @Field()
  employeeId: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  companyName?: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  profilePicture?: string;

  @Field()
  isEmailVerified: boolean;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  lastLogin?: Date;

  @Field({ nullable: true })
  department?: string;

  @Field({ nullable: true })
  designation?: string;

  @Field({ nullable: true })
  joiningDate?: Date;

  @Field({ nullable: true })
  basicSalary?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
