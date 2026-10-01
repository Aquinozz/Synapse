// What a psychologist can list on the profile and employees can filter by.
// Served by GET /api/catalog, so the front end and the validation use the same lists.

/** Specialties, grouped by theme for the profile editor. The selection targets working adults. */
export const SPECIALTY_GROUPS = [
  {
    name: 'Emoções e humor',
    items: [
      'Ansiedade',
      'Depressão',
      'Estresse',
      'Síndrome de Burnout',
      'Síndrome do Pânico',
      'Alterações de humor',
      'Angústia',
      'Raiva',
      'Medos e fobias',
      'Fobia social',
      'Insônia',
    ],
  },
  {
    name: 'Trabalho e carreira',
    items: [
      'Saúde do trabalhador',
      'Assédio moral',
      'Transição de carreira',
      'Orientação profissional',
      'Síndrome do impostor',
      'Procrastinação',
      'Falta de foco',
      'Perfeccionismo',
      'Autocobrança',
      'Medo de falar em público',
    ],
  },
  {
    name: 'Relações e família',
    items: [
      'Relacionamentos',
      'Conflitos familiares',
      'Casais',
      'Dependência emocional',
      'Divórcio',
      'Maternidade',
      'Paternidade',
      'Luto',
    ],
  },
  {
    name: 'Desenvolvimento pessoal',
    items: [
      'Autoestima',
      'Autoconhecimento',
      'Autoconfiança',
      'Inteligência emocional',
      'Habilidades sociais',
      'Timidez',
      'Mindfulness',
    ],
  },
  {
    name: 'Diversidade',
    items: ['LGBTQIA+', 'Identidade de gênero', 'Racismo', 'Pessoas com deficiência'],
  },
  {
    name: 'Saúde e hábitos',
    items: ['Compulsão alimentar', 'Dependência química', 'Tabagismo', 'Doenças crônicas', 'Sexualidade'],
  },
  {
    name: 'Transtornos e neurodiversidade',
    items: [
      'TDAH',
      'Autismo',
      'Transtorno bipolar',
      'Transtorno obsessivo-compulsivo (TOC)',
      'Ansiedade generalizada (TAG)',
      'Estresse pós-traumático',
    ],
  },
];

/** Therapeutic approaches */
export const APPROACHES = [
  'Terapia Cognitivo-Comportamental (TCC)',
  'Psicanálise',
  'Psicologia Analítica (Junguiana)',
  'Gestalt-terapia',
  'Abordagem Centrada na Pessoa',
  'Fenomenológico-existencial',
  'Terapia de Aceitação e Compromisso (ACT)',
  'Terapia Comportamental Dialética (DBT)',
  'Terapia do Esquema',
  'Terapia Sistêmica',
  'Análise do Comportamento',
  'Psicodrama',
  'Psicologia Positiva',
  'Psicoterapia Breve',
  'Logoterapia',
  'Terapia EMDR',
  'Mindfulness',
];

/** Languages a session can be held in */
export const LANGUAGES = ['Português', 'Inglês', 'Espanhol', 'Francês', 'Italiano', 'Libras'];

/** How many of each a profile can list */
export const PROFILE_LIMITS = { specialties: 10, approaches: 3, languages: LANGUAGES.length };

export const SPECIALTIES = SPECIALTY_GROUPS.flatMap((group) => group.items);

export const CATALOG = {
  specialtyGroups: SPECIALTY_GROUPS,
  approaches: APPROACHES,
  languages: LANGUAGES,
  limits: PROFILE_LIMITS,
};
