import { Job } from './types';

const day = 24 * 60 * 60 * 1000;
// Fixed base timestamp (avoids Date.now nondeterminism concerns in tooling; app overrides at runtime anyway)
const base = 1752000000000;

function isoInDays(n: number): string {
  return new Date(base + n * day).toISOString().slice(0, 10);
}

export const MOCK_JOBS: Job[] = [
  {
    id: 'job-1',
    employerId: 'emp-1',
    employerName: 'Ramirez Construction',
    title: 'Concrete pour helpers needed',
    description:
      'Need 3 laborers for a driveway concrete pour. Must be able to lift 50lbs and work a full day. Tools and water provided.',
    category: 'Construction',
    payRate: 22,
    payType: 'hourly',
    location: 'Austin, TX',
    date: isoInDays(2),
    status: 'open',
    createdAt: base - 1 * day,
  },
  {
    id: 'job-2',
    employerId: 'emp-2',
    employerName: 'QuickMove LLC',
    title: 'Apartment move — 2 movers',
    description:
      'Moving a 2-bedroom apartment across town. About 5 hours. Some heavy furniture. Truck already booked.',
    category: 'Moving',
    payRate: 140,
    payType: 'fixed',
    location: 'Round Rock, TX',
    date: isoInDays(1),
    status: 'open',
    createdAt: base - 2 * day,
  },
  {
    id: 'job-3',
    employerId: 'emp-3',
    employerName: 'GreenLeaf Landscaping',
    title: 'Yard cleanup + mulch spreading',
    description:
      'Full day of yard work: hauling brush, spreading 4 yards of mulch, trimming hedges. Gloves recommended.',
    category: 'Landscaping',
    payRate: 160,
    payType: 'daily',
    location: 'Cedar Park, TX',
    date: isoInDays(3),
    status: 'open',
    createdAt: base - 3 * day,
  },
  {
    id: 'job-4',
    employerId: 'emp-1',
    employerName: 'Ramirez Construction',
    title: 'Warehouse loading crew',
    description:
      'Unload two shipping containers and organize stock. 4-6 hours. Steel-toe boots required.',
    category: 'Warehouse',
    payRate: 20,
    payType: 'hourly',
    location: 'Austin, TX',
    date: isoInDays(4),
    status: 'open',
    createdAt: base - 1 * day,
  },
  {
    id: 'job-5',
    employerId: 'emp-4',
    employerName: 'BrightHome Cleaning',
    title: 'Deep clean — move-out',
    description:
      'Move-out deep clean of a 3-bed house. Supplies provided. Attention to detail on kitchen and bathrooms.',
    category: 'Cleaning',
    payRate: 18,
    payType: 'hourly',
    location: 'Pflugerville, TX',
    date: isoInDays(2),
    status: 'open',
    createdAt: base - 2 * day,
  },
];
