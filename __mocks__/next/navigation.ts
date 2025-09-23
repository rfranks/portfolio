const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

export const useRouter = () => mockRouter;
export const usePathname = () => "";
export const useSearchParams = () => new URLSearchParams();
export { mockRouter };
