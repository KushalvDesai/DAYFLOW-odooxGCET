import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../user/schema/user.schema';
import { PendingUser, PendingUserDocument } from './schema/pending-user.schema';
import { EmailService } from '../email/email.service';
import { SignUpInput, SignInInput, VerifyEmailInput } from './dto/auth.input';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PendingUser.name) private pendingUserModel: Model<PendingUserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateEmployeeId(firstName: string, lastName: string, joiningDate?: Date): Promise<string> {
    // Company prefix
    const companyPrefix = 'OI';
    
    // First 2 letters of first name + first 2 letters of last name (uppercase)
    const namePart = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
    
    // Year of joining (current year if not provided)
    const year = joiningDate ? joiningDate.getFullYear() : new Date().getFullYear();
    
    // Get count of employees joined in that year to generate serial number
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    
    const countInYear = await this.userModel.countDocuments({
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    });
    
    // Serial number (padded to 4 digits)
    const serialNumber = String(countInYear + 1).padStart(4, '0');
    
    // Format: OI + JODO + 2022 + 0001
    return `${companyPrefix}${namePart}${year}${serialNumber}`;
  }

  async signUp(signUpInput: SignUpInput): Promise<{ message: string; success: boolean }> {
    const { email, password, firstName, lastName, joiningDate, companyName, ...rest } = signUpInput;

    // Check if email already exists in actual users
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if email already has a pending registration
    const existingPendingUser = await this.pendingUserModel.findOne({ email });
    if (existingPendingUser) {
      // Delete old pending registration and create new one
      await this.pendingUserModel.findByIdAndDelete(existingPendingUser._id);
    }

    // Auto-generate employee ID
    const employeeId = await this.generateEmployeeId(firstName, lastName, joiningDate);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = this.generateOTP();
    const otpExpiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES') || 10;
    const otpExpiresAt = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);

    // Create pending user (NOT in main User collection)
    const pendingUser = await this.pendingUserModel.create({
      email,
      employeeId,
      password: hashedPassword,
      firstName,
      lastName,
      companyName,
      joiningDate: joiningDate || new Date(),
      ...rest,
      emailVerificationOTP: otp,
      otpExpiresAt,
    });

    // Send OTP email
    const emailSent = await this.emailService.sendOTP(
      email,
      otp,
      employeeId,
      firstName,
    );

    if (!emailSent) {
      // If email fails, delete the pending user
      await this.pendingUserModel.findByIdAndDelete(pendingUser._id);
      throw new BadRequestException('Failed to send verification email. Please try again.');
    }

    return {
      message: `Registration initiated! Your Employee ID is ${employeeId}. Please check your email for OTP verification to complete registration.`,
      success: true,
    };
  }

  async verifyEmail(verifyEmailInput: VerifyEmailInput): Promise<{ message: string; success: boolean }> {
    const { email, otp } = verifyEmailInput;

    // Find pending user
    const pendingUser = await this.pendingUserModel.findOne({ email });

    if (!pendingUser) {
      throw new BadRequestException('No pending registration found for this email. Please sign up first.');
    }

    if (!pendingUser.emailVerificationOTP || !pendingUser.otpExpiresAt) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (new Date() > pendingUser.otpExpiresAt) {
      throw new BadRequestException('OTP has expired. Please sign up again.');
    }

    if (pendingUser.emailVerificationOTP !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // OTP is valid - create actual user in User collection
    const userData = {
      email: pendingUser.email,
      employeeId: pendingUser.employeeId,
      password: pendingUser.password,
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      companyName: pendingUser.companyName,
      phone: pendingUser.phoneNumber, // Note: User schema uses 'phone', not 'phoneNumber'
      address: pendingUser.address,
      department: pendingUser.department,
      designation: pendingUser.designation,
      role: pendingUser.role,
      joiningDate: pendingUser.joiningDate,
      isEmailVerified: true,
      isActive: true,
    };

    const newUser = await this.userModel.create(userData);

    // Delete pending user after successful verification
    await this.pendingUserModel.findByIdAndDelete(pendingUser._id);

    return {
      message: `Email verified successfully! Your account with Employee ID ${newUser.employeeId} has been created. You can now sign in.`,
      success: true,
    };
  }

  async signIn(signInInput: SignInInput): Promise<{ accessToken: string; user: any }> {
    const { email, password } = signInInput;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before signing in');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid account state');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Remove sensitive data
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.emailVerificationOTP;
    delete userObject.otpExpiresAt;

    return {
      accessToken,
      user: userObject,
    };
  }

  async resendOTP(email: string): Promise<{ message: string; success: boolean }> {
    // Check pending users first
    const pendingUser = await this.pendingUserModel.findOne({ email });

    if (!pendingUser) {
      throw new BadRequestException('No pending registration found. Please sign up first.');
    }

    // Generate new OTP
    const otp = this.generateOTP();
    const otpExpiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES') || 10;
    const otpExpiresAt = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);

    pendingUser.emailVerificationOTP = otp;
    pendingUser.otpExpiresAt = otpExpiresAt;
    await pendingUser.save();

    // Send OTP email
    const emailSent = await this.emailService.sendOTP(
      email,
      otp,
      pendingUser.employeeId,
      pendingUser.firstName,
    );

    if (!emailSent) {
      throw new BadRequestException('Failed to send verification email. Please try again.');
    }

    return {
      message: 'OTP sent successfully! Please check your email.',
      success: true,
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).select('-password -emailVerificationOTP');
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }
}
