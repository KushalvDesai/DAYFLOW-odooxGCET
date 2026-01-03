import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../user/schema/user.schema';
import { UserType } from '../../user/schema/user.schema';

@InputType()
export class SignUpInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8)
  password: string;

  @Field()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsNotEmpty()
  lastName: string;

  @Field({ nullable: true })
  companyName?: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  department?: string;

  @Field({ nullable: true })
  designation?: string;

  @Field({ nullable: true })
  joiningDate?: Date;
}

@InputType()
export class SignInInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  password: string;
}

@InputType()
export class VerifyEmailInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  otp: string;
}

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => UserType)
  user: UserType;
}

@ObjectType()
export class MessageResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  success?: boolean;
}
