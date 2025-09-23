import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Inbox from '@/components/talentforge/Inbox';
import ApplicationBoard, {
  loadListingsWhenEmpty,
} from '@/components/talentforge/ApplicationBoard';
import type { JobApplication } from '@/types';

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({ setNodeRef: jest.fn() }),
}));

const { STATUSES } = jest.requireActual('@/utils/talentforge/keyboard');
type Status = (typeof STATUSES)[number];

const layoutPreferencesMock: { order: Status[]; collapsed: Status[] } = {
  order: [...STATUSES],
  collapsed: [],
};

let jobApplicationsMock: JobApplication[] = [];

const normalizeLayout = (prefs: { order?: string[]; collapsed?: string[] }) => {
  const order: Status[] = [];
  const seen = new Set<Status>();
  (prefs.order ?? []).forEach((entry) => {
    const status = entry as Status;
    if (STATUSES.includes(status) && !seen.has(status)) {
      seen.add(status);
      order.push(status);
    }
  });
  STATUSES.forEach((status) => {
    if (!seen.has(status)) {
      seen.add(status);
      order.push(status);
    }
  });
  const collapsedSet = new Set<Status>();
  (prefs.collapsed ?? []).forEach((entry) => {
    const status = entry as Status;
    if (STATUSES.includes(status)) {
      collapsedSet.add(status);
    }
  });
  const collapsed = order.filter((status) => collapsedSet.has(status));
  return { order, collapsed };
};

jest.mock('@/utils/talentforge/dataStore', () => ({
  getResumes: jest.fn(() => []),
  addResume: jest.fn(),
  getJobApplications: jest.fn(() => jobApplicationsMock),
  addJobApplication: jest.fn((app: JobApplication) => {
    jobApplicationsMock = [...jobApplicationsMock, app];
    return jobApplicationsMock;
  }),
  updateJobApplicationStatus: jest.fn((id: string, status: Status) => {
    jobApplicationsMock = jobApplicationsMock.map((app) =>
      app.id === id ? { ...app, status } : app,
    );
    return jobApplicationsMock;
  }),
  updateJobApplication: jest.fn(
    (id: string, updates: Partial<JobApplication>) => {
      jobApplicationsMock = jobApplicationsMock.map((app) =>
        app.id === id ? { ...app, ...updates } : app,
      );
      return jobApplicationsMock;
    },
  ),
  getRecruiters: jest.fn(() => []),
  getThreads: jest.fn(() => []),
  getAutoReplyTemplates: jest.fn(() => ({})),
  linkThreadToRecruiter: jest.fn(),
  saveAutoReplyTemplates: jest.fn(),
  getCurrentCompensation: jest.fn(),
  getPipelineLayoutPreferences: jest.fn(() => ({
    order: [...layoutPreferencesMock.order],
    collapsed: [...layoutPreferencesMock.collapsed],
  })),
  savePipelineLayoutPreferences: jest.fn(
    (prefs: { order?: string[]; collapsed?: string[] }) => {
      const normalized = normalizeLayout(prefs);
      layoutPreferencesMock.order = [...normalized.order];
      layoutPreferencesMock.collapsed = [...normalized.collapsed];
      return { ...normalized };
    },
  ),
}));

beforeEach(() => {
  layoutPreferencesMock.order = [...STATUSES];
  layoutPreferencesMock.collapsed = [];
  jobApplicationsMock = [];
});

const baseApplicant: JobApplication['applicant'] = {
  id: 'applicant-1',
  name: 'Test User',
  email: 'test@example.com',
};

const baseRole = {
  title: 'Engineer',
  company: 'Acme',
  location: 'Remote',
  description: '',
  source: 'site',
  url: '',
};

function buildApplication(id: string, status: Status): JobApplication {
  return {
    id,
    applicant: baseApplicant,
    role: { ...baseRole, id: `role-${id}` },
    status,
    history: [{ status, changedAt: '2024-01-01T00:00:00.000Z' }],
    recruiters: [],
    threads: [],
    offerHistory: [],
  } as JobApplication;
}

jest.mock('@/contexts/TalentForgeDataContext', () => ({
  useTalentForgeData: () => ({
    getThreads: () => [],
    getRecruiters: () => [],
    getAutoReplyTemplates: () => ({}),
    getOffers: () => [],
    updateThreadStatus: jest.fn(),
    addThreadReply: jest.fn(),
    linkThreadToRecruiter: jest.fn(),
    saveAutoReplyTemplates: jest.fn(),
  }),
}));

jest.mock('@/utils/talentforge/jobAggregator', () => ({
  fetchAllListings: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/utils/autoReply', () => ({
  autoReply: jest.fn(),
  buildAutoReplyMessages: jest.fn(),
}));

jest.mock('@/components/talentforge/PromptSelector', () => () => null);
jest.mock('@/components/talentforge/promptTiles/Tile', () => () => null);
jest.mock('@/components/talentforge/EmptyState', () => () => null);
jest.mock('@/components/talentforge/OpenAIKeyModal', () => () => null);
jest.mock('@/components/talentforge/FileUploader', () => () => null);
jest.mock('@/components/talentforge/ResumeVariants/List', () => () => null);
jest.mock('@/components/talentforge/offers/CompareOffers', () => () => null);
jest.mock('@/utils/talentforge/tagging', () => ({ tagResume: jest.fn() }));
jest.mock('@/utils/talentforge/utils', () => ({
  askOpenAI: jest.fn(),
  hasOpenAIKey: jest.fn(() => false),
  hasValidOpenAIKey: jest.fn(() => true),
  pdfToMarkdown: jest.fn(),
  pdfToText: jest.fn(),
}));
jest.mock('@/utils/talentforge/resumeIngest', () => ({
  parseResumeText: jest.fn(),
}));
jest.mock('@/utils/talentforge/pasteParser', () => ({
  parsePastedHtml: jest.fn((t: string) => t),
}));
jest.mock('@/consts/prompts', () => ({ PROMPT_TEMPLATES: {} }));
jest.mock('@/consts/promptTiles', () => ({ PROMPT_TILES: {} }));

describe('Loader visuals', () => {
  test('Inbox initial render shows loader', () => {
    const html = renderToStaticMarkup(<Inbox />);
    expect(html).toContain('aria-label="Loading inbox"');
  });

  test('ApplicationBoard initial render shows loader', () => {
    const html = renderToStaticMarkup(<ApplicationBoard />);
    expect(html).toContain('aria-label="Loading applications"');
  });
});

describe('loadListingsWhenEmpty', () => {
  const baseListing = {
    title: 'Frontend Engineer',
    company: 'Acme Corp',
    location: 'Remote',
    description: 'Build modern interfaces.',
    url: 'https://example.com/jobs/frontend',
    source: 'linkedin',
  };

  test('returns error and keeps loading when fetch fails', async () => {
    const fetchMock = jest.fn<Promise<Array<typeof baseListing>>, [string]>(() =>
      Promise.reject(new Error('network down')),
    );
    const addMock = jest.fn((app: JobApplication) => [app]);
    const logger = jest.fn();

    const result = await loadListingsWhenEmpty({
      existingApplications: [],
      fetchListings: fetchMock,
      addApplication: addMock,
      createId: () => 'app-1',
      now: () => '2025-01-01T00:00:00.000Z',
      logger,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(addMock).not.toHaveBeenCalled();
    expect(logger).toHaveBeenCalledWith(
      'Failed to fetch job listings',
      expect.any(Error),
    );
    expect(result.loading).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.applications).toEqual([]);
  });

  test('retries successfully after an initial failure', async () => {
    const fetchMock = jest
      .fn<Promise<Array<typeof baseListing>>, [string]>()
      .mockRejectedValueOnce(new Error('temporary outage'))
      .mockResolvedValueOnce([baseListing]);

    const logger = jest.fn();
    let stored: JobApplication[] = [];
    let idCounter = 0;
    const addMock = jest.fn((app: JobApplication) => {
      stored = [...stored, app];
      return stored;
    });
    const createId = () => {
      idCounter += 1;
      return `app-${idCounter}`;
    };

    const firstAttempt = await loadListingsWhenEmpty({
      existingApplications: [],
      fetchListings: fetchMock,
      addApplication: addMock,
      createId,
      now: () => '2025-01-01T00:00:00.000Z',
      logger,
    });

    expect(firstAttempt.loading).toBe(true);
    expect(firstAttempt.error).toBeInstanceOf(Error);
    expect(stored).toHaveLength(0);

    const secondAttempt = await loadListingsWhenEmpty({
      existingApplications: stored,
      fetchListings: fetchMock,
      addApplication: addMock,
      createId,
      now: () => '2025-01-01T00:00:00.000Z',
      logger,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(addMock).toHaveBeenCalledTimes(1);
    expect(secondAttempt.loading).toBe(false);
    expect(secondAttempt.error).toBeNull();
    expect(secondAttempt.applications).toHaveLength(1);
    expect(secondAttempt.applications[0].id).toBe('app-1');
    expect(logger).toHaveBeenCalledTimes(1);
  });
});
