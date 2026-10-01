export interface Therapist {
  id: number;
  name: string;
  title: string;
  reg: string; // CRP or CRM
  /** Photo URL; professionals without one are shown by their initials */
  avatar: string | null;
  rating: number;
  reviewCount: number;
  badge?: string | null;
  bio: string;
  tags: { label: string; icon: string; category?: 'burnout' | 'tcc' | 'sleep' | 'medical' }[];
  /** Recurring weekly slots the therapist offers. weekday follows Date.getDay() (0 = domingo) */
  weeklyAvailability: { weekday: number; times: string[] }[];
  /** Psychologists only see this on their own profile: 'pending' until the registration is checked */
  status?: 'pending' | 'active';
}

export type CognitiveLoadLevel = 'calm' | 'balanced' | 'tired' | 'exhausted';

export interface AssessmentState {
  step: number;
  totalSteps: number;
  cognitiveLoad: CognitiveLoadLevel;
  energyLevel: number;
  selectedFactors: string[];
  customFactors: string[];
  sleepQuality?: number;
  focusLevel?: number;
  somaticTension?: string;
  notes?: string;
}

export type DepartmentScope = 'all' | 'engineering' | 'sales' | 'marketing' | 'operations';
export type TimePeriod = '30days' | '7days' | 'quarter' | 'year';

export interface TeamResilience {
  id: string;
  name: string;
  healthyPct: number;
  moderatePct: number;
  riskPct: number;
  trend: 'up' | 'stable' | 'down';
  memberCount: number;
  riskIcon: string;
}

export interface ManagementKPIs {
  wellnessIndex: number;
  wellnessDelta: string;
  activeAdoptionPct: number;
  activeMembers: number;
  totalEmployees: number;
  burnoutRiskPct: number;
  burnoutDelta: string;
  monthlySessions: number;
  savingsRoi: string;
  leaveReductionPct: number;
}

export type SessionFormat = 'video' | 'audio';

/** The employee's weekly session: a fixed therapist and slot, plus an optional one-off change */
export interface WeeklyPlan {
  therapistId: number;
  weekday: number;
  time: string;
  format: SessionFormat;
  /** Local date-time (YYYY-MM-DDTHH:MM) of a session moved for a single week */
  rescheduledTo?: string;
}
