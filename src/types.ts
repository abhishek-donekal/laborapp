export type Role = 'worker' | 'employer';

export type PayType = 'hourly' | 'daily' | 'fixed';

export type JobStatus = 'open' | 'closed';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export const CATEGORIES = [
  'Construction',
  'Moving',
  'Cleaning',
  'Landscaping',
  'Warehouse',
  'Painting',
  'Delivery',
  'General',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface User {
  id: string;
  name: string;
  role: Role;
  phone?: string;
  bio?: string;
  skills?: string[];
}

export interface Job {
  id: string;
  employerId: string;
  employerName: string;
  title: string;
  description: string;
  category: Category;
  payRate: number;
  payType: PayType;
  location: string;
  date: string; // ISO date the work is needed
  status: JobStatus;
  createdAt: number;
}

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  message: string;
  status: ApplicationStatus;
  createdAt: number;
}
