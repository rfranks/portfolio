import { calculateStageMetrics, getMetricDisplay } from '@/utils/talentforge/metrics';
import type { JobApplication } from '@/types';

const createApplications = (): JobApplication[] => [
  {
    id: 'app-1',
    applicant: {
      id: 'candidate-1',
      name: 'Candidate One',
      email: 'candidate1@example.com',
    },
    role: {
      id: 'role-1',
      title: 'Frontend Engineer',
      company: 'Acme Corp',
      location: 'Remote',
      description: 'Build modern web experiences.',
    },
    status: 'offer',
    history: [
      { status: 'applied', changedAt: '2024-01-01T00:00:00.000Z' },
      { status: 'interview', changedAt: '2024-01-10T00:00:00.000Z' },
      { status: 'offer', changedAt: '2024-01-15T00:00:00.000Z' },
    ],
  },
  {
    id: 'app-2',
    applicant: {
      id: 'candidate-2',
      name: 'Candidate Two',
      email: 'candidate2@example.com',
    },
    role: {
      id: 'role-2',
      title: 'Product Designer',
      company: 'Design Co',
      location: 'Hybrid',
      description: 'Shape end-to-end product experiences.',
    },
    status: 'rejected',
    history: [
      { status: 'applied', changedAt: '2024-01-05T00:00:00.000Z' },
      { status: 'interview', changedAt: '2024-01-12T00:00:00.000Z' },
      { status: 'rejected', changedAt: '2024-01-20T00:00:00.000Z' },
    ],
  },
  {
    id: 'app-3',
    applicant: {
      id: 'candidate-3',
      name: 'Candidate Three',
      email: 'candidate3@example.com',
    },
    role: {
      id: 'role-3',
      title: 'Data Analyst',
      company: 'Insights Inc',
      location: 'Remote',
      description: 'Surface insights from complex datasets.',
    },
    status: 'applied',
    history: [
      { status: 'applied', changedAt: '2023-12-20T00:00:00.000Z' },
    ],
  },
];

const NOW = new Date('2024-02-01T00:00:00.000Z').getTime();

describe('Application pipeline metrics', () => {
  test('calculateStageMetrics snapshot', () => {
    const metrics = calculateStageMetrics(createApplications(), NOW);
    const serialized = metrics.map((metric) => ({
      status: metric.status,
      currentCount: metric.currentCount,
      reachedCount: metric.reachedCount,
      conversionRate: metric.conversionRate,
      averageDurationDays: metric.averageDurationDays,
      slaBreached: metric.slaBreached,
    }));
    expect(serialized).toMatchSnapshot();
  });

  test('getMetricDisplay snapshot', () => {
    const metrics = calculateStageMetrics(createApplications(), NOW);
    const displays = metrics.map((metric) => getMetricDisplay(metric));
    expect(displays).toMatchSnapshot();
  });

  test('applied stage assistive text highlights SLA breach', () => {
    const metrics = calculateStageMetrics(createApplications(), NOW);
    const applied = metrics.find((metric) => metric.status === 'applied');
    expect(applied?.slaBreached).toBe(true);
    const assistive = applied ? getMetricDisplay(applied).assistiveText : '';
    expect(assistive).toContain('exceeds SLA');
  });
});
