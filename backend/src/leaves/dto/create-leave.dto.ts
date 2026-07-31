export class CreateLeaveDto {
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'paid' | 'unpaid';
}

export class UpdateLeaveDto {
  status: 'pending' | 'approved' | 'rejected';
}
