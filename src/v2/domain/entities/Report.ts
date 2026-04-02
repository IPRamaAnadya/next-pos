/**
 * Report Entity
 * Represents a generated report with PDF storage
 */

export enum ReportType {
  SALES = "SALES",
  PROFIT_LOSS = "PROFIT_LOSS",
}

export enum ReportStatus {
  PENDING = "PENDING",
  GENERATED = "GENERATED",
  FAILED = "FAILED",
}

export interface ReportProps {
  id: string;
  tenantId: string;
  type: ReportType;
  startDate: Date;
  endDate: Date;
  status: ReportStatus;
  pdfUrl: string | null;
  s3Key: string | null;
  data: any; // JSON data used to generate the report
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Report {
  constructor(private props: ReportProps) {}

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get type(): ReportType {
    return this.props.type;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get status(): ReportStatus {
    return this.props.status;
  }

  get pdfUrl(): string | null {
    return this.props.pdfUrl;
  }

  get s3Key(): string | null {
    return this.props.s3Key;
  }

  get data(): any {
    return this.props.data;
  }

  get error(): string | null {
    return this.props.error;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if report is successfully generated
   */
  public isGenerated(): boolean {
    return this.props.status === ReportStatus.GENERATED && this.props.pdfUrl !== null;
  }

  /**
   * Check if report has failed
   */
  public hasFailed(): boolean {
    return this.props.status === ReportStatus.FAILED;
  }

  /**
   * Mark report as generated with PDF URL
   */
  public markAsGenerated(pdfUrl: string, s3Key: string): void {
    this.props.status = ReportStatus.GENERATED;
    this.props.pdfUrl = pdfUrl;
    this.props.s3Key = s3Key;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark report as failed
   */
  public markAsFailed(error: string): void {
    this.props.status = ReportStatus.FAILED;
    this.props.error = error;
    this.props.updatedAt = new Date();
  }

  /**
   * Get period identifier for cache key
   */
  public getPeriodKey(): string {
    const start = this.props.startDate.toISOString().split('T')[0];
    const end = this.props.endDate.toISOString().split('T')[0];
    return `${start}_${end}`;
  }

  public toJSON(): ReportProps {
    return { ...this.props };
  }
}
