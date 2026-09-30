export type ActiveTab = 'inicio' | 'bem-estar' | 'especialistas' | 'synapse-ai' | 'gestao';

export interface Therapist {
  id: string;
  name: string;
  title: string;
  reg: string; // CRP or CRM
  avatar: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  bio: string;
  tags: { label: string; icon: string; category?: 'burnout' | 'tcc' | 'sleep' | 'medical' }[];
  slots: string[];
  nextSlotLabel: string;
  nextSlotTime: string;
  isAvailableNow?: boolean;
  corporateCovered: boolean;
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
