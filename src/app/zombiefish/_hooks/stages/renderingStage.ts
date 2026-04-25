import type { Dims } from "@/types/game/ui";

export function configureZombiefishCanvasRenderingStage(args: {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  screenWidth: number;
  screenHeight: number;
  dims: Dims;
}): void {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const scaleX = args.screenWidth / args.dims.width;
  const scaleY = args.screenHeight / args.dims.height;

  args.canvas.width = args.screenWidth * dpr;
  args.canvas.height = args.screenHeight * dpr;
  args.canvas.style.width = `${args.screenWidth}px`;
  args.canvas.style.height = `${args.screenHeight}px`;
  args.ctx.setTransform(scaleX * dpr, 0, 0, scaleY * dpr, 0, 0);
}
