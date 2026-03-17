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

jest.mock('@/hooks/talentforge/useOpenAIKey', () => {
  const mock = jest.fn(() => ({
    hasKey: true,
    isChecking: false,
    modalOpen: false,
    openModal: jest.fn(),
    closeModal: jest.fn(),
    refresh: jest.fn(),
  }));
  return {
    __esModule: true,
    default: mock,
    useOpenAIKey: mock,
  };
});

const { STATUSES } = jest.requireActual('@/utils/talentforge/keyboard');
type Status = (typeof STATUSES)[number];

const layoutPreferencesMock: { order: Status[]; collapsed: Status[] } = {
  order: [...STATUSES],
  collapsed: [],
};

let jobApplicationsMock: JobApplication[] = [];
type NegotiationEntry = {
  id: string;
  label: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
let negotiationLibraryMock: NegotiationEntry[] = [];

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
  getNegotiationLibrary: jest.fn(() => negotiationLibraryMock),
  addNegotiationLibraryEntry: jest.fn((entry: NegotiationEntry) => {
    negotiationLibraryMock = [
      ...negotiationLibraryMock.filter((item) => item.id !== entry.id),
      entry,
    ];
    return negotiationLibraryMock;
  }),
  updateNegotiationLibraryEntry: jest.fn((id: string, updates: Partial<NegotiationEntry>) => {
    negotiationLibraryMock = negotiationLibraryMock.map((entry) =>
      entry.id === id ? { ...entry, ...updates } : entry,
    );
    return negotiationLibraryMock;
  }),
  deleteNegotiationLibraryEntry: jest.fn((id: string) => {
    negotiationLibraryMock = negotiationLibraryMock.filter((entry) => entry.id !== id);
    return negotiationLibraryMock;
  }),
  getCustomPromptTiles: jest.fn(() => []),
}));

beforeEach(() => {
  layoutPreferencesMock.order = [...STATUSES];
  layoutPreferencesMock.collapsed = [];
  jobApplicationsMock = [];
  negotiationLibraryMock = [];
});

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
    getNegotiationLibrary: () => negotiationLibraryMock,
    addNegotiationLibraryEntry: jest.fn(),
    updateNegotiationLibraryEntry: jest.fn(),
    deleteNegotiationLibraryEntry: jest.fn(),
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
jest.mock('react-markdown', () => ({ __esModule: true, default: () => null }));
jest.mock('@/hooks/talentforge/useAIErrorHandler', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn(() => ({ message: '', isKeyIssue: false }))),
}));
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

describe('screen role analysis badges', () => {
  test('renders severity chips when analysis data is present', async () => {
    jobApplicationsMock = [
      {
        id: 'app-1',
        applicant: { id: 'candidate-1', name: 'Casey Candidate', email: 'casey@example.com' },
        role: {
          id: 'role-1',
          title: 'Platform Engineer',
          company: 'Innotech',
          location: 'Remote',
          description: 'Maintain core infrastructure.',
          source: 'LinkedIn',
        },
        status: 'applied',
        history: [{ status: 'applied', changedAt: '2024-01-01T00:00:00.000Z' }],
        screenRoleAnalysis: {
          summary: 'Solid role but clarify long-term support expectations.',
          issues: [
            { severity: 'red', message: 'Non-compete clause extends two years.' },
            { severity: 'yellow', message: 'Undefined on-call compensation.' },
          ],
        },
      },
    ];

    const html = renderToStaticMarkup(<ApplicationBoard />);

    expect(html).toContain('Red flag');
    expect(html).toContain('Caution');
    expect(html).toContain('Solid role but clarify long-term support expectations.');
  });
});
