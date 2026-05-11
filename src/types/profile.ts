export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  targetScore: number | null;
  examDate: string | null;
  role: string;
  vipExpiresAt: string | null;
  createdAt: string;
}

export interface UpdateProfileBody {
  name?: string;
  targetScore?: number; // 10–990
  examDate?: string; // ISO string, phải >= today
}
