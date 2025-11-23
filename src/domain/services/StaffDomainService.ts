import { Staff } from '../entities/Staff';

export class StaffDomainService {
  static validateUsername(username: string): void {
    if (!username || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    
    if (username.length > 50) {
      throw new Error('Username cannot exceed 50 characters');
    }
    
    // Check for valid characters (alphanumeric and underscore)
    const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!validUsernameRegex.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }
  }

  static validateRole(role: string): void {
    const validRoles = ['MANAGER', 'CASHIER'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role. Must be MANAGER or CASHIER');
    }
  }

  static validatePassword(password: string): void {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    if (password.length > 100) {
      throw new Error('Password cannot exceed 100 characters');
    }
  }

  static validateSalaryAmount(amount: number): void {
    if (amount < 0) {
      throw new Error('Salary amount cannot be negative');
    }
    
    if (amount > 999999999) {
      throw new Error('Salary amount exceeds maximum allowed value');
    }
  }

  static validateAttendanceTime(time: string): void {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new Error('Invalid time format. Use HH:MM format');
    }
  }

  static calculateOvertimePay(
    overtimeHours: number,
    hourlyRate: number,
    isWeekend: boolean = false,
    overtimeRate1: number = 1.5,
    overtimeRate2: number = 2.0,
    weekendRate1: number = 2.0
  ): number {
    if (overtimeHours <= 0) return 0;
    
    let totalPay = 0;
    
    if (isWeekend) {
      // Weekend overtime uses different rates
      totalPay = overtimeHours * hourlyRate * weekendRate1;
    } else {
      // Weekday overtime - first hour at rate1, rest at rate2
      const firstHour = Math.min(overtimeHours, 1);
      const remainingHours = Math.max(0, overtimeHours - 1);
      
      totalPay = (firstHour * hourlyRate * overtimeRate1) + 
                 (remainingHours * hourlyRate * overtimeRate2);
    }
    
    return Math.round(totalPay * 100) / 100; // Round to 2 decimal places
  }

  static canDeleteStaff(staff: Staff, hasActivePayroll: boolean): { canDelete: boolean; reason?: string } {
    if (staff.isOwner) {
      return { canDelete: false, reason: 'Cannot delete owner staff' };
    }
    
    if (hasActivePayroll) {
      return { canDelete: false, reason: 'Cannot delete staff with active payroll records' };
    }
    
    return { canDelete: true };
  }

  static filterStaffsByRole(staffs: Staff[], requesterRole: string, isOwner: boolean, requesterStaffId?: string): Staff[] {
    console.log(`[StaffDomainService] filterStaffsByRole called with:`, {
      staffsCount: staffs.length,
      requesterRole,
      isOwner,
      requesterStaffId,
      staffIds: staffs.map(s => s.id),
      staffRoles: staffs.map(s => s.role)
    });
    
    if (isOwner) {
      console.log(`[StaffDomainService] User is owner, returning all ${staffs.length} staffs`);
      return staffs; // Owners can see all staff
    }
    
    if (requesterRole === 'MANAGER') {
      // Managers can see all staff except other managers (unless they're owners)
      const filtered = staffs.filter(staff => staff.role !== 'MANAGER' || staff.isOwner);
      console.log(`[StaffDomainService] User is MANAGER, filtered from ${staffs.length} to ${filtered.length} staffs`);
      return filtered;
    }
    
    if (requesterRole === 'CASHIER') {
      // Cashiers can only see themselves if staffId is provided
      if (requesterStaffId) {
        const filtered = staffs.filter(staff => staff.id === requesterStaffId);
        console.log(`[StaffDomainService] User is CASHIER with staffId, filtered from ${staffs.length} to ${filtered.length} staffs`);
        return filtered;
      }
      console.log(`[StaffDomainService] User is CASHIER but no staffId provided, returning empty array`);
      return []; // No staffId provided, return empty
    }
    
    // Default case - return all staffs (for other roles like OWNER that might not be explicitly handled)
    console.log(`[StaffDomainService] Unknown role '${requesterRole}', returning all ${staffs.length} staffs`);
    return staffs;
  }
}