import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument, AttendanceStatus } from './schema/attendance.schema';
import { User, UserDocument } from '../user/schema/user.schema';
import {
  CheckInInput,
  CheckOutInput,
  GetAttendanceByDateRangeInput,
  UpdateAttendanceInput,
  AttendanceSummary,
} from './dto/attendance.input';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AttendanceService {
  private readonly OFFICE_START_TIME = 9; // 9:00 AM
  private readonly LATE_THRESHOLD_MINUTES = 15; // 15 minutes grace period

  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private calculateWorkHours(checkIn: Date, checkOut: Date): number {
    const diff = checkOut.getTime() - checkIn.getTime();
    return parseFloat((diff / (1000 * 60 * 60)).toFixed(2)); // Convert to hours with 2 decimal places
  }

  private checkIfLate(checkInTime: Date): { isLate: boolean; lateByMinutes: number } {
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const officeStartMinutes = this.OFFICE_START_TIME * 60 + this.LATE_THRESHOLD_MINUTES;

    if (totalMinutes > officeStartMinutes) {
      return {
        isLate: true,
        lateByMinutes: totalMinutes - officeStartMinutes,
      };
    }

    return { isLate: false, lateByMinutes: 0 };
  }

  async checkIn(userId: string, checkInInput: CheckInInput): Promise<any> {
    // Get user details
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = this.getStartOfDay(new Date());
    const endOfDay = this.getEndOfDay(new Date());

    // Check if already checked in today
    const existingAttendance = await this.attendanceModel.findOne({
      userId: user._id,
      date: { $gte: today, $lte: endOfDay },
    });

    if (existingAttendance) {
      throw new ConflictException('You have already checked in today');
    }

    // Check if late
    const checkInTime = new Date();
    const lateStatus = this.checkIfLate(checkInTime);

    // Create attendance record
    const attendance = await this.attendanceModel.create({
      userId: user._id,
      employeeId: user.employeeId,
      date: today,
      checkInTime,
      status: lateStatus.isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      isLate: lateStatus.isLate,
      lateByMinutes: lateStatus.lateByMinutes,
      location: checkInInput.location,
      remarks: checkInInput.remarks,
    });

    return attendance.toObject();
  }

  async checkOut(userId: string, checkOutInput: CheckOutInput): Promise<any> {
    const today = this.getStartOfDay(new Date());
    const endOfDay = this.getEndOfDay(new Date());

    // Find today's attendance
    const attendance = await this.attendanceModel.findOne({
      userId,
      date: { $gte: today, $lte: endOfDay },
    });

    if (!attendance) {
      throw new NotFoundException('No check-in record found for today. Please check in first.');
    }

    if (attendance.checkOutTime) {
      throw new ConflictException('You have already checked out today');
    }

    // Update with check-out time
    const checkOutTime = new Date();
    const workHours = this.calculateWorkHours(attendance.checkInTime, checkOutTime);

    attendance.checkOutTime = checkOutTime;
    attendance.workHours = workHours;
    
    // Update status if half day (less than 4 hours)
    if (workHours < 4) {
      attendance.status = AttendanceStatus.HALF_DAY;
    }

    if (checkOutInput.remarks) {
      attendance.remarks = attendance.remarks
        ? `${attendance.remarks} | Checkout: ${checkOutInput.remarks}`
        : checkOutInput.remarks;
    }

    await attendance.save();
    return attendance.toObject();
  }

  async getTodayAttendance(userId: string): Promise<any> {
    const today = this.getStartOfDay(new Date());
    const endOfDay = this.getEndOfDay(new Date());

    const attendance = await this.attendanceModel.findOne({
      userId,
      date: { $gte: today, $lte: endOfDay },
    });

    return attendance ? attendance.toObject() : null;
  }

  async getAttendanceByDateRange(
    userId: string,
    input: GetAttendanceByDateRangeInput,
  ): Promise<any[]> {
    const { startDate, endDate, employeeId } = input;

    const query: any = {
      date: {
        $gte: this.getStartOfDay(new Date(startDate)),
        $lte: this.getEndOfDay(new Date(endDate)),
      },
    };

    // If employeeId is provided, search by employeeId (for admin/HR)
    // Otherwise, search by userId (for employee's own records)
    if (employeeId) {
      query.employeeId = employeeId;
    } else {
      query.userId = userId;
    }

    const records = await this.attendanceModel
      .find(query)
      .sort({ date: -1 })
      .exec();

    return records.map(record => record.toObject());
  }

  async getAllAttendance(
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const query: any = {};

    if (startDate && endDate) {
      query.date = {
        $gte: this.getStartOfDay(new Date(startDate)),
        $lte: this.getEndOfDay(new Date(endDate)),
      };
    }

    const records = await this.attendanceModel
      .find(query)
      .sort({ date: -1 })
      .exec();

    return records.map(record => record.toObject());
  }

  async getAttendanceSummary(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceSummary> {
    const attendanceRecords = await this.attendanceModel.find({
      userId,
      date: {
        $gte: this.getStartOfDay(new Date(startDate)),
        $lte: this.getEndOfDay(new Date(endDate)),
      },
    });

    const summary: AttendanceSummary = {
      totalDays: attendanceRecords.length,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      leaveDays: 0,
      totalWorkHours: 0,
      averageWorkHours: 0,
    };

    attendanceRecords.forEach((record) => {
      switch (record.status) {
        case AttendanceStatus.PRESENT:
          summary.presentDays++;
          break;
        case AttendanceStatus.LATE:
          summary.lateDays++;
          summary.presentDays++;
          break;
        case AttendanceStatus.ABSENT:
          summary.absentDays++;
          break;
        case AttendanceStatus.HALF_DAY:
          summary.halfDays++;
          break;
        case AttendanceStatus.ON_LEAVE:
          summary.leaveDays++;
          break;
      }

      summary.totalWorkHours += record.workHours || 0;
    });

    summary.averageWorkHours =
      summary.totalDays > 0
        ? parseFloat((summary.totalWorkHours / summary.totalDays).toFixed(2))
        : 0;

    return summary;
  }

  async updateAttendance(
    input: UpdateAttendanceInput,
  ): Promise<any> {
    const { attendanceId, status, remarks } = input;

    const attendance = await this.attendanceModel.findById(attendanceId);

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    if (status) {
      attendance.status = status;
    }

    if (remarks) {
      attendance.remarks = remarks;
    }

    await attendance.save();
    return attendance.toObject();
  }

  async deleteAttendance(attendanceId: string): Promise<boolean> {
    const result = await this.attendanceModel.findByIdAndDelete(attendanceId);
    return !!result;
  }
}
