import React from 'react';
import { renderToString } from 'react-dom/server';
import ResumeManager from '@/components/talentforge/ResumeManager';
import Inbox from '@/components/talentforge/Inbox';
import ApplicationBoard from '@/components/talentforge/ApplicationBoard';

jest.mock('@/utils/talentforge/dataStore', () => ({
  getResumes: jest.fn(() => []),
  addResume: jest.fn(),
  getJobApplications: jest.fn(() => []),
  addJobApplication: jest.fn(),
  updateJobApplicationStatus: jest.fn(),
  updateJobApplication: jest.fn(),
  getRecruiters: jest.fn(() => []),
  getThreads: jest.fn(() => []),
  getAutoReplyTemplates: jest.fn(() => ({})),
  linkThreadToRecruiter: jest.fn(),
  saveAutoReplyTemplates: jest.fn(),
  getCurrentCompensation: jest.fn(),
}));

jest.mock('@/contexts/TalentForgeDataContext', () => ({
  useTalentForgeData: () => ({
    getThreads: () => [],
    getRecruiters: () => [],
    getAutoReplyTemplates: () => ({}),
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
jest.mock('@/components/talentforge/OpenAiKeyModal', () => () => null);
jest.mock('@/components/talentforge/FileUploader', () => () => null);
jest.mock('@/components/talentforge/ResumeVariants/List', () => () => null);
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
  test('ResumeManager initial render shows loader', () => {
    const html = renderToString(<ResumeManager />);
    expect(html).toContain('aria-label="Loading resumes"');
  });

  test('Inbox initial render shows loader', () => {
    const html = renderToString(<Inbox />);
    expect(html).toContain('aria-label="Loading inbox"');
  });

  test('ApplicationBoard initial render shows loader', () => {
    const html = renderToString(<ApplicationBoard />);
    expect(html).toContain('aria-label="Loading applications"');
  });
});
