import {
  APPLICATION_EXPORT_HEADERS,
  createApplicationsCsv,
} from '@/utils/talentforge/applicationExport';
import type { JobApplication, Recruiter, ResumeEntry } from '@/types';

describe('applicationExport', () => {
  const applicant: JobApplication['applicant'] = {
    id: 'user-1',
    name: 'Test User',
    email: 'user@example.com',
  };

  const role: JobApplication['role'] = {
    id: 'role-1',
    title: 'Senior Software Engineer',
    company: 'Acme Corp',
    location: 'Remote',
    description: 'Builds platform features',
    url: 'https://example.com/job',
    source: 'LinkedIn',
  };

  const recruiter: Recruiter = {
    id: 'recruiter-1',
    name: 'Jane Recruiter',
    email: 'jane@agency.com',
    connector: 'email',
    tags: ['preferred'],
    notes: 'Responsive',
    threadIds: [],
  };

  const resume: ResumeEntry = {
    id: 'resume-1',
    userId: 'user-1',
    label: 'Primary',
    title: 'Primary Resume',
    url: 'https://example.com/resume.pdf',
    content: 'Summary',
    parsed: {
      contact: '',
      experience: [],
      education: [],
      skills: [],
    },
    tags: [],
    importedAt: '2024-03-01T12:00:00.000Z',
  };

  const dueAt = '2024-03-06T09:00:00-05:00';
  const interviewAt = '2024-03-07T13:30:00-05:00';

  const decisionAt = '2024-03-10T09:00:00-05:00';
  const application: JobApplication = {
    id: 'application-1',
    applicant,
    role,
    resumeVariant: resume,
    status: 'interview',
    history: [
      { status: 'applied', changedAt: '2024-03-01T15:00:00-05:00' },
      {
        status: 'interview',
        changedAt: '2024-03-05T10:30:00-05:00',
        reason: 'Phone screen complete',
      },
    ],
    nextAction: 'Send thank you email',
    dueAt,
    recruiters: [recruiter],
    interviewDateTime: interviewAt,
    interviewLocation: 'Zoom',
    decision: {
      status: 'accepted',
      decidedAt: decisionAt,
      notes: 'Signed offer',
    },
    offer: {
      id: 'offer-1',
      application: {} as JobApplication,
      compensation: [
        { type: 'base', amount: 150000, notes: 'USD' },
        { type: 'bonus', amount: 15000 },
      ],
      summary: ['Initial offer'],
      decision: {
        status: 'accepted',
        decidedAt: decisionAt,
        notes: 'Signed offer',
      },
    },
  };

  test('createApplicationsCsv exports headers and values in expected order', () => {
    const csv = createApplicationsCsv([application]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    const [headerLine, rowLine] = lines;
    const expectedHeader = APPLICATION_EXPORT_HEADERS.map((h) => h.label).join(',');
    expect(headerLine).toBe(expectedHeader);

    const values = rowLine.split(',');
    expect(values).toHaveLength(APPLICATION_EXPORT_HEADERS.length);

    const record = APPLICATION_EXPORT_HEADERS.reduce<Record<string, string>>(
      (acc, header, index) => {
        acc[header.key] = values[index];
        return acc;
      },
      {},
    );

    expect(record.status).toBe('Interview');
    expect(record.nextAction).toBe('Send thank you email');
    expect(record.nextActionDue).toBe(new Date(dueAt).toISOString());
    expect(record.recruiters).toBe('Jane Recruiter');
    expect(record.recruiterEmails).toBe('jane@agency.com');
    expect(record.interviewDate).toBe(new Date(interviewAt).toISOString());
    expect(record.interviewLocation).toBe('Zoom');
    expect(record.offerSummary).toBe('Initial offer');
    expect(record.offerCompensation).toBe('base: 150000 (USD); bonus: 15000');
    expect(record.decisionStatus).toBe('Accepted');
    expect(record.decisionDate).toBe(new Date(decisionAt).toISOString());
    expect(record.decisionNotes).toBe('Signed offer');
    expect(record.source).toBe('LinkedIn');
    expect(record.url).toBe('https://example.com/job');
  });
});
