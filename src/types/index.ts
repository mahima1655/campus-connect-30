export type UserRole = 'student' | 'teacher' | 'admin';

export type NoticeCategory =
  | 'exam'
  | 'sports'
  | 'events'
  | 'hackathons'
  | 'symposium'
  | 'department'
  | 'placement'
  | 'coe'
  | 'office'
  | 'staff'
  | string;

export type VisibleTo = 'student' | 'teacher' | 'admin' | 'all';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  year?: string;
  createdAt: Date;
  photoURL?: string;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  category: NoticeCategory;
  department?: string;
  visibleTo: VisibleTo[];
  targetUids?: string[]; // Added for specific user targeting
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'pdf' | 'image';
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  expiryDate?: Date;
  isPinned: boolean;
  isApproved: boolean;
  viewCount?: number;
  viewedBy?: { uid: string; displayName: string; role: string; seenAt: Date }[];
}

export interface NoticeStats {
  total: number;
  byCategory: Record<NoticeCategory, number>;
  pinnedCount: number;
  recentCount: number;
}

export const NOTICE_CATEGORIES: { value: NoticeCategory; label: string; color: string }[] = [
  { value: 'exam', label: 'Exam', color: 'bg-category-exam' },
  { value: 'sports', label: 'Sports', color: 'bg-category-sports' },
  { value: 'events', label: 'Events', color: 'bg-category-events' },
  { value: 'hackathons', label: 'Hackathons', color: 'bg-category-hackathons' },
  { value: 'symposium', label: 'Symposium', color: 'bg-category-symposium' },
  { value: 'department', label: 'Department', color: 'bg-category-department' },
  { value: 'placement', label: 'Placement', color: 'bg-category-placement' },
  { value: 'coe', label: 'COE', color: 'bg-category-coe' },
  { value: 'office', label: 'Office', color: 'bg-category-office' },
  { value: 'staff', label: 'Staff Only', color: 'bg-category-staff' },
];

export const DEPARTMENTS = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
  'Information Technology',
  'Chemical',
  'Biotechnology',
];

export const STUDENT_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];

export const getCategoryColor = (category: string): string => {
  const categoryMap: Record<string, string> = {
    exam: 'bg-red-500/10 text-red-600 border-red-200',
    sports: 'bg-green-500/10 text-green-600 border-green-200',
    events: 'bg-purple-500/10 text-purple-600 border-purple-200',
    hackathons: 'bg-orange-500/10 text-orange-600 border-orange-200',
    symposium: 'bg-blue-500/10 text-blue-600 border-blue-200',
    department: 'bg-slate-500/10 text-slate-600 border-slate-200',
    placement: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
    coe: 'bg-pink-500/10 text-pink-600 border-pink-200',
    office: 'bg-teal-500/10 text-teal-600 border-teal-200',
    staff: 'bg-gray-500/10 text-gray-600 border-gray-200',
  };
  return categoryMap[category] || 'bg-primary/10 text-primary border-primary/20'; // Default for dynamic categories
};
