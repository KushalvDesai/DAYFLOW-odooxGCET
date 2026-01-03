import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/schema/user.schema';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CheckInInput,
  CheckOutInput,
  GetAttendanceByDateRangeInput,
  UpdateAttendanceInput,
  CheckInResponse,
  CheckOutResponse,
  AttendanceSummary,
} from './dto/attendance.input';
import { AttendanceType } from './schema/attendance.schema';

@Resolver(() => AttendanceType)
export class AttendanceResolver {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Mutations
  @Mutation(() => CheckInResponse)
  @UseGuards(JwtAuthGuard)
  async checkIn(
    @CurrentUser() user: any,
    @Args('checkInInput', { nullable: true }) checkInInput?: CheckInInput,
  ): Promise<CheckInResponse> {
    const attendance = await this.attendanceService.checkIn(
      user.userId,
      checkInInput || {},
    );

    return {
      message: attendance.isLate
        ? `Checked in successfully! You are late by ${attendance.lateByMinutes} minutes.`
        : 'Checked in successfully!',
      success: true,
      attendance,
    };
  }

  @Mutation(() => CheckOutResponse)
  @UseGuards(JwtAuthGuard)
  async checkOut(
    @CurrentUser() user: any,
    @Args('checkOutInput', { nullable: true }) checkOutInput?: CheckOutInput,
  ): Promise<CheckOutResponse> {
    const attendance = await this.attendanceService.checkOut(
      user.userId,
      checkOutInput || {},
    );

    return {
      message: `Checked out successfully! Total work hours: ${attendance.workHours} hours`,
      success: true,
      attendance,
      workHours: attendance.workHours,
    };
  }

  @Mutation(() => AttendanceType)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR, UserRole.ADMIN)
  async updateAttendance(
    @Args('updateAttendanceInput') updateAttendanceInput: UpdateAttendanceInput,
  ): Promise<AttendanceType> {
    return this.attendanceService.updateAttendance(updateAttendanceInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR, UserRole.ADMIN)
  async deleteAttendance(
    @Args('attendanceId') attendanceId: string,
  ): Promise<boolean> {
    return this.attendanceService.deleteAttendance(attendanceId);
  }

  // Queries
  @Query(() => AttendanceType, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async getTodayAttendance(@CurrentUser() user: any): Promise<AttendanceType | null> {
    return this.attendanceService.getTodayAttendance(user.userId);
  }

  @Query(() => [AttendanceType])
  @UseGuards(JwtAuthGuard)
  async getAttendanceByDateRange(
    @CurrentUser() user: any,
    @Args('input') input: GetAttendanceByDateRangeInput,
  ): Promise<AttendanceType[]> {
    return this.attendanceService.getAttendanceByDateRange(user.userId, input);
  }

  @Query(() => [AttendanceType])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR, UserRole.ADMIN)
  async getAllAttendance(
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
  ): Promise<AttendanceType[]> {
    return this.attendanceService.getAllAttendance(startDate, endDate);
  }

  @Query(() => AttendanceSummary)
  @UseGuards(JwtAuthGuard)
  async getAttendanceSummary(
    @CurrentUser() user: any,
    @Args('startDate') startDate: Date,
    @Args('endDate') endDate: Date,
  ): Promise<AttendanceSummary> {
    return this.attendanceService.getAttendanceSummary(
      user.userId,
      startDate,
      endDate,
    );
  }
}
