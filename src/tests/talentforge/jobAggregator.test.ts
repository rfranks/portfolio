import type { JobListing } from '@/types';
import { fetchAllListings } from '@/utils/talentforge/jobAggregator';

const mockLinkedInSearch = jest.fn<Promise<JobListing[]>, [string]>();
const mockIndeedSearch = jest.fn<Promise<JobListing[]>, [string]>();

jest.mock('@/utils/talentforge/connectors/linkedin', () => ({
  LinkedInConnector: jest.fn().mockImplementation(() => ({
    searchJobs: mockLinkedInSearch,
  })),
}));

jest.mock('@/utils/talentforge/connectors/indeed', () => ({
  IndeedConnector: jest.fn().mockImplementation(() => ({
    searchJobs: mockIndeedSearch,
  })),
}));

describe('fetchAllListings', () => {
  beforeEach(() => {
    mockLinkedInSearch.mockReset();
    mockIndeedSearch.mockReset();
  });

  it('combines listings from all connectors when available', async () => {
    const linkedinListings: JobListing[] = [
      {
        title: 'Frontend Engineer',
        company: 'Example Co',
        location: 'Remote',
        url: 'https://linkedin.example/jobs/1',
        source: 'LinkedIn',
      },
    ];
    const indeedListings: JobListing[] = [
      {
        title: 'Data Analyst',
        company: 'Data Corp',
        location: 'Austin, TX',
        url: 'https://indeed.example/jobs/2',
        source: 'Indeed',
      },
    ];

    mockLinkedInSearch.mockResolvedValue(linkedinListings);
    mockIndeedSearch.mockResolvedValue(indeedListings);

    const results = await fetchAllListings('engineer');

    expect(mockLinkedInSearch).toHaveBeenCalledWith('engineer');
    expect(mockIndeedSearch).toHaveBeenCalledWith('engineer');
    expect(results).toEqual([...linkedinListings, ...indeedListings]);
  });

  it('returns listings from successful connectors even if one fails', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const indeedListings: JobListing[] = [
      {
        title: 'Backend Engineer',
        company: 'Service Inc',
        location: 'New York, NY',
        url: 'https://indeed.example/jobs/3',
        source: 'Indeed',
      },
    ];

    mockLinkedInSearch.mockRejectedValue(new Error('LinkedIn unavailable'));
    mockIndeedSearch.mockResolvedValue(indeedListings);

    const results = await fetchAllListings('engineer');

    expect(results).toEqual(indeedListings);
    expect(consoleWarn).toHaveBeenCalled();

    consoleWarn.mockRestore();
  });
});
