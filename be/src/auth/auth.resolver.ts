import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpInput, SignInInput, VerifyEmailInput, AuthResponse, MessageResponse } from './dto/auth.input';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserType } from '../user/schema/user.schema';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => MessageResponse)
  async signUp(@Args('signUpInput') signUpInput: SignUpInput): Promise<MessageResponse> {
    return this.authService.signUp(signUpInput);
  }

  @Mutation(() => MessageResponse)
  async verifyEmail(@Args('verifyEmailInput') verifyEmailInput: VerifyEmailInput): Promise<MessageResponse> {
    return this.authService.verifyEmail(verifyEmailInput);
  }

  @Mutation(() => AuthResponse)
  async signIn(@Args('signInInput') signInInput: SignInInput): Promise<AuthResponse> {
    return this.authService.signIn(signInInput);
  }

  @Mutation(() => MessageResponse)
  async resendOTP(@Args('email') email: string): Promise<MessageResponse> {
    return this.authService.resendOTP(email);
  }

  @Query(() => UserType)
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: any): Promise<UserType> {
    return context.req.user.user;
  }
}
