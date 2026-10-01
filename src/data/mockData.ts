import { TeamResilience, ManagementKPIs, DepartmentScope } from '../types';

export const DEPARTMENT_NAMES: Record<DepartmentScope, string> = {
  all: 'Toda a Empresa',
  engineering: 'Engenharia & Tech',
  sales: 'Vendas & Comercial',
  marketing: 'Marketing & Criação',
  operations: 'Operações & CS',
};

export const TEAMS_DATA: Record<string, TeamResilience[]> = {
  all: [
    { id: 'eng', name: 'Engenharia & Tech', healthyPct: 62, moderatePct: 24, riskPct: 14, trend: 'stable', memberCount: 120, riskIcon: '⚠️' },
    { id: 'sales', name: 'Vendas & Comercial', healthyPct: 55, moderatePct: 27, riskPct: 18, trend: 'down', memberCount: 85, riskIcon: '⛔' },
    { id: 'mkt', name: 'Marketing & Criação', healthyPct: 78, moderatePct: 14, riskPct: 8, trend: 'up', memberCount: 65, riskIcon: '✓' },
    { id: 'ops', name: 'Operações & CS', healthyPct: 69, moderatePct: 20, riskPct: 11, trend: 'stable', memberCount: 180, riskIcon: '⚠️' },
  ],
  engineering: [
    { id: 'eng-fe', name: 'Frontend & Mobile', healthyPct: 68, moderatePct: 22, riskPct: 10, trend: 'up', memberCount: 45, riskIcon: '✓' },
    { id: 'eng-be', name: 'Backend & Plataforma', healthyPct: 58, moderatePct: 26, riskPct: 16, trend: 'down', memberCount: 50, riskIcon: '⚠️' },
    { id: 'eng-devops', name: 'SRE & Infraestrutura', healthyPct: 54, moderatePct: 25, riskPct: 21, trend: 'down', memberCount: 25, riskIcon: '⛔' },
  ],
  sales: [
    { id: 'sales-inbound', name: 'SDR & Inbound', healthyPct: 60, moderatePct: 26, riskPct: 14, trend: 'stable', memberCount: 35, riskIcon: '⚠️' },
    { id: 'sales-enterprise', name: 'Enterprise Closers', healthyPct: 48, moderatePct: 29, riskPct: 23, trend: 'down', memberCount: 50, riskIcon: '⛔' },
  ],
  marketing: [
    { id: 'mkt-growth', name: 'Growth & Performance', healthyPct: 74, moderatePct: 18, riskPct: 8, trend: 'up', memberCount: 30, riskIcon: '✓' },
    { id: 'mkt-brand', name: 'Design & Conteúdo', healthyPct: 82, moderatePct: 12, riskPct: 6, trend: 'up', memberCount: 35, riskIcon: '✓' },
  ],
  operations: [
    { id: 'ops-support', name: 'Suporte Nível 1 & 2', healthyPct: 64, moderatePct: 23, riskPct: 13, trend: 'stable', memberCount: 110, riskIcon: '⚠️' },
    { id: 'ops-success', name: 'Customer Success', healthyPct: 76, moderatePct: 17, riskPct: 7, trend: 'up', memberCount: 70, riskIcon: '✓' },
  ],
};

export const KPIS_BY_DEPARTMENT: Record<string, ManagementKPIs> = {
  all: {
    wellnessIndex: 78,
    wellnessDelta: '+4.2 pts',
    activeAdoptionPct: 68,
    activeMembers: 306,
    totalEmployees: 450,
    burnoutRiskPct: 12,
    burnoutDelta: '-3.5% pós-pausas',
    monthlySessions: 312,
    savingsRoi: 'R$ 142.000',
    leaveReductionPct: 28,
  },
  engineering: {
    wellnessIndex: 74,
    wellnessDelta: '+2.1 pts',
    activeAdoptionPct: 75,
    activeMembers: 90,
    totalEmployees: 120,
    burnoutRiskPct: 14,
    burnoutDelta: '-2.0% pós-pausas',
    monthlySessions: 104,
    savingsRoi: 'R$ 58.000',
    leaveReductionPct: 22,
  },
  sales: {
    wellnessIndex: 69,
    wellnessDelta: '-1.4 pts',
    activeAdoptionPct: 61,
    activeMembers: 52,
    totalEmployees: 85,
    burnoutRiskPct: 18,
    burnoutDelta: '+1.2% pico trimestral',
    monthlySessions: 78,
    savingsRoi: 'R$ 34.000',
    leaveReductionPct: 18,
  },
  marketing: {
    wellnessIndex: 82,
    wellnessDelta: '+5.6 pts',
    activeAdoptionPct: 72,
    activeMembers: 47,
    totalEmployees: 65,
    burnoutRiskPct: 8,
    burnoutDelta: '-4.8% pós-pausas',
    monthlySessions: 52,
    savingsRoi: 'R$ 22.000',
    leaveReductionPct: 35,
  },
  operations: {
    wellnessIndex: 77,
    wellnessDelta: '+3.8 pts',
    activeAdoptionPct: 65,
    activeMembers: 117,
    totalEmployees: 180,
    burnoutRiskPct: 11,
    burnoutDelta: '-3.1% pós-pausas',
    monthlySessions: 78,
    savingsRoi: 'R$ 28.000',
    leaveReductionPct: 26,
  },
};
