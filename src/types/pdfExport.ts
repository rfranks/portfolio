export type JsPdf = {
  new (): {
    text: (content: string, x: number, y: number) => void;
    save: (name: string) => void;
  };
};
