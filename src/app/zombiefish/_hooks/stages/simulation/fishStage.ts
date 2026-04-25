import type { MutableRefObject, RefObject } from "react";
import type { AudioMgr } from "@/types/audio/audio";
import type { AssetMgr } from "@/types/game/ui";
import type { Bubble, Fish, GameState } from "../../../_types";
import {
  FISH_SPEED_MAX,
  FISH_SPEED_MIN,
  MAX_FISH,
  MAX_SKELETONS,
  MAX_SPECIAL_FISH,
  SKELETON_SPEED,
} from "../../../_constants";
import {
  BUBBLE_MAX,
  BUBBLE_MIN,
  BUBBLE_VX_MAX,
  BUBBLE_VY_MAX,
  BUBBLE_VY_MIN,
  CONVERT_FLASH_DURATION_MS,
  FISH_FRAME_DURATION,
  FISH_SIZE,
  FRAME_MS,
  GAME_TIME,
  MAX_BUBBLES,
  MAX_SCHOOL_SIZE,
  SKELETON_CONVERT_DISTANCE,
  SKELETON_DETECTION_RADIUS,
  SKELETON_REPEL_DISTANCE,
  SKELETON_REPEL_FORCE,
  WANDER_TIMER_MAX_MS,
  WANDER_TIMER_MIN_MS,
  clampIncline,
  orientFish,
} from "../../../_utils/gameConfig";
import { pickRandom, randomInRange } from "@/utils/game/engine2d";

const resolveZombiefishDifficultyFactor = (timer: number): number => 1 + (1 - timer / GAME_TIME);

export function runZombiefishFishSimulationStage(args: {
  stateRef: MutableRefObject<GameState>;
  groupVelocityRef: MutableRefObject<Record<number, { vx: number; vy: number }>>;
  frameRef: MutableRefObject<number>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  getImg: AssetMgr["getImg"];
  makeText: (text: string, x: number, y: number, color?: string) => void;
  play: AudioMgr["play"];
  deltaMs: number;
  scale: number;
}): void {
  const cur = args.stateRef.current;
  const { width, height } = cur.dims;

  const flashImg = args.getImg("fishFlashImg") as HTMLImageElement | undefined;
  const canvas = args.canvasRef.current;
  const ctx = canvas?.getContext("2d");
  cur.fish.forEach((fish) => {
    const frameMap = args.getImg(fish.isSkeleton ? "skeletonFrames" : "fishFrames") as Record<
      string,
      HTMLImageElement[]
    >;
    const frames = frameMap[fish.kind as keyof typeof frameMap];
    if (frames && frames.length > 0) {
      fish.frameCounter += args.deltaMs;
      if (fish.frameCounter >= FISH_FRAME_DURATION) {
        fish.frameCounter = 0;
        fish.frame = (fish.frame + 1) % frames.length;
      }
    }

    if (fish.pendingSkeleton) {
      if (ctx && flashImg) {
        ctx.drawImage(flashImg, fish.x, fish.y, FISH_SIZE, FISH_SIZE);
      }
      fish.flashTimer = (fish.flashTimer || 0) - args.deltaMs;
      if (fish.flashTimer <= 0) {
        fish.isSkeleton = true;
        fish.health = 2;
        fish.hurtTimer = 0;
        fish.pendingSkeleton = undefined;
        fish.flashTimer = undefined;
      }
    }
  });

  const groups: Record<number, { vx: number; vy: number; members: Fish[] }> = {};
  cur.fish.forEach((fish) => {
    if (fish.groupId === undefined) return;
    const group = (groups[fish.groupId] ||= { vx: 0, vy: 0, members: [] });
    group.vx += fish.vx;
    group.vy += fish.vy;
    group.members.push(fish);
  });
  const prevGroupVelocities = args.groupVelocityRef.current;
  Object.entries(groups).forEach(([idString, group]) => {
    const id = Number(idString);
    const avgVx = group.vx / group.members.length;
    const avgVy = group.vy / group.members.length;
    const limited = clampIncline(avgVx, avgVy);
    const prev = prevGroupVelocities[id];
    const angleChanged =
      prev &&
      Math.abs(
        Math.atan2(
          limited.vx * prev.vy - limited.vy * prev.vx,
          limited.vx * prev.vx + limited.vy * prev.vy,
        ),
      ) > 0.2;

    group.members.forEach((fish) => {
      fish.vx = limited.vx;
      fish.vy = limited.vy;
      if (angleChanged) {
        fish.wanderTimer =
          Math.random() * (WANDER_TIMER_MAX_MS - WANDER_TIMER_MIN_MS) + WANDER_TIMER_MIN_MS;
      }
    });
    prevGroupVelocities[id] = { vx: limited.vx, vy: limited.vy };
  });
  Object.keys(prevGroupVelocities).forEach((idString) => {
    const id = Number(idString);
    if (!groups[id]) delete prevGroupVelocities[id];
  });

  const pairs: Record<number, { a?: Fish; b?: Fish }> = {};
  cur.fish.forEach((fish) => {
    if (fish.pairId === undefined) return;
    const pair = (pairs[fish.pairId] ||= {});
    if (fish.kind === "grey_long_a") pair.a = fish;
    else if (fish.kind === "grey_long_b") pair.b = fish;
  });
  Object.values(pairs).forEach(({ a, b }) => {
    if (!a || !b) return;
    b.vy = a.vy;
    const sign = a.vx >= 0 ? 1 : -1;
    const desiredX = a.x + FISH_SIZE * sign;
    const dx = desiredX - b.x;
    b.vx += dx * 0.05 * args.scale;
  });

  const immuneKinds = new Set(["brown", "grey_long_a", "grey_long_b"]);
  const detectionRadiusSquared = SKELETON_DETECTION_RADIUS * SKELETON_DETECTION_RADIUS;
  let skeletonCount = cur.fish.filter((fish) => fish.isSkeleton || fish.pendingSkeleton).length;
  const skeletons = cur.fish.filter((fish) => fish.isSkeleton);

  skeletons.forEach((skeleton, index) => {
    let target: Fish | undefined;
    let targetDistanceSquared = detectionRadiusSquared;

    for (const fish of cur.fish) {
      if (fish.isSkeleton || fish.pendingSkeleton) continue;
      if (immuneKinds.has(fish.kind)) continue;
      const dx = fish.x - skeleton.x;
      const dy = fish.y - skeleton.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < targetDistanceSquared) {
        targetDistanceSquared = distanceSquared;
        target = fish;
      }
    }

    if (!target) {
      skeleton.vx = 0;
      skeleton.vy = 0;
      return;
    }

    const dx = target.x - skeleton.x;
    const dy = target.y - skeleton.y;
    const distance = Math.sqrt(targetDistanceSquared);
    if (distance > 0) {
      skeleton.vx = (dx / distance) * SKELETON_SPEED;
      skeleton.vy = (dy / distance) * SKELETON_SPEED;
    }

    if (
      distance < SKELETON_CONVERT_DISTANCE &&
      skeletonCount < MAX_SKELETONS &&
      !target.pendingSkeleton
    ) {
      args.makeText("POOF", target.x, target.y);
      target.pendingSkeleton = true;
      target.flashTimer = CONVERT_FLASH_DURATION_MS;
      target.vx = 0;
      target.vy = 0;
      target.frame = 0;
      target.frameCounter = 0;
      delete target.groupId;
      cur.conversions += 1;
      args.play("convert");
      skeletonCount += 1;
    }

    for (let i = 0; i < skeletons.length; i += 1) {
      if (i === index) continue;
      const other = skeletons[i];
      const rdx = other.x - skeleton.x;
      const rdy = other.y - skeleton.y;
      const repelDistance = Math.sqrt(rdx * rdx + rdy * rdy);
      if (repelDistance > 0 && repelDistance < SKELETON_REPEL_DISTANCE) {
        skeleton.vx -= (rdx / repelDistance) * SKELETON_REPEL_FORCE * args.scale;
        skeleton.vy -= (rdy / repelDistance) * SKELETON_REPEL_FORCE * args.scale;
      }
    }

    const limited = clampIncline(skeleton.vx, skeleton.vy);
    skeleton.vx = limited.vx;
    skeleton.vy = limited.vy;
  });

  cur.fish.forEach((fish) => {
    if (fish.isSkeleton) return;
    fish.wanderTimer -= args.deltaMs;
    if (fish.wanderTimer <= 0) {
      const range = FISH_SPEED_MAX - FISH_SPEED_MIN;
      const speed = Math.random() * range + FISH_SPEED_MIN;
      const difficultySpeed = speed * resolveZombiefishDifficultyFactor(cur.timer);
      let vx: number;
      let vy: number;

      if (Math.abs(fish.vx) >= Math.abs(fish.vy)) {
        const dir = fish.vx >= 0 ? 1 : -1;
        vx = dir * difficultySpeed;
        vy = (Math.random() * 2 - 1) * difficultySpeed * 0.25;
      } else {
        const dir = fish.vy >= 0 ? 1 : -1;
        vy = dir * difficultySpeed;
        vx = (Math.random() * 2 - 1) * difficultySpeed * 0.25;
      }

      const limited = clampIncline(vx, vy);
      fish.vx = limited.vx;
      fish.vy = limited.vy;
      fish.wanderTimer =
        Math.random() * (WANDER_TIMER_MAX_MS - WANDER_TIMER_MIN_MS) + WANDER_TIMER_MIN_MS;
    }
  });

  cur.fish.forEach((fish) => {
    if (fish.hurtTimer > 0) {
      fish.hurtTimer -= args.deltaMs;
    }
    const osc = Math.sin((args.frameRef.current / FRAME_MS + fish.id) / 20) * 0.5;
    const limited = clampIncline(fish.vx, fish.vy + osc);
    fish.x += limited.vx * args.scale;
    fish.y += limited.vy * args.scale;
    const orient = orientFish(limited.vx, limited.vy);
    fish.angle = orient.angle;
    fish.flipped = orient.flipped;
    if (fish.isSkeleton) {
      fish.x = Math.max(0, Math.min(fish.x, width - FISH_SIZE));
      fish.y = Math.max(0, Math.min(fish.y, height - FISH_SIZE));
    }
  });
}

export function spawnZombiefishFishStage(args: {
  stateRef: MutableRefObject<GameState>;
  inactiveFishRef: MutableRefObject<Fish[]>;
  nextFishIdRef: MutableRefObject<number>;
  nextGroupIdRef: MutableRefObject<number>;
  nextPairIdRef: MutableRefObject<number>;
  kind: string;
  count: number;
}): Fish[] {
  const cur = args.stateRef.current;
  if (args.kind === "skeleton") return [];

  const spawned: Fish[] = [];
  const { width, height } = cur.dims;
  const speedVariance = (FISH_SPEED_MAX - FISH_SPEED_MIN) / 4;
  const specialSingles = ["brown"] as string[];
  const specialPairs: Record<string, string[]> = {
    grey_long: ["grey_long_a", "grey_long_b"],
  };
  const specialPairParts = Object.values(specialPairs).flat();
  const isSpecial = specialSingles.includes(args.kind) || Boolean(specialPairs[args.kind]);

  const specialsOnScreen = cur.fish.filter(
    (fish) => specialSingles.includes(fish.kind) || specialPairParts.includes(fish.kind),
  ).length;
  const basicsOnScreen = cur.fish.filter(
    (fish) =>
      !fish.isSkeleton &&
      !specialSingles.includes(fish.kind) &&
      !specialPairParts.includes(fish.kind),
  ).length;

  let count = args.count;
  if (isSpecial) {
    if (specialsOnScreen >= MAX_SPECIAL_FISH) return [];
    const needed = specialPairs[args.kind]?.length ?? 1;
    if (specialsOnScreen + needed > MAX_SPECIAL_FISH) return [];
    count = 1;
  } else {
    const available = MAX_FISH - basicsOnScreen;
    if (available <= 0) return [];
    count = Math.min(count, available);
  }
  count = Math.min(count, MAX_SCHOOL_SIZE);

  const reuseFish = () => args.inactiveFishRef.current.pop() || ({} as Fish);

  const edges = [0, 0, 0, 1, 1, 1] as const;
  const edge = pickRandom(edges) ?? 0;
  const startX = edge === 0 ? -FISH_SIZE : width + FISH_SIZE;

  const genVelocity = () => {
    const factor = resolveZombiefishDifficultyFactor(cur.timer);
    const range = FISH_SPEED_MAX - FISH_SPEED_MIN;
    const main = (Math.random() * range + FISH_SPEED_MIN) * factor;
    const cross = (Math.random() * range - range / 2) * factor;
    let vx: number;
    let vy: number;
    if (edge === 0) {
      vx = main;
      vy = cross;
    } else {
      vx = -main;
      vy = cross;
    }
    return clampIncline(vx, vy);
  };

  const makeFish = (
    kind: string,
    x: number,
    y: number,
    vx: number,
    vy: number,
    groupId?: number,
    highlight = false,
  ) => {
    const fish = reuseFish();
    fish.id = args.nextFishIdRef.current++;
    fish.kind = kind;
    fish.x = x;
    fish.y = y;
    fish.vx = vx;
    fish.vy = vy;
    const orient = orientFish(vx, vy);
    fish.angle = orient.angle;
    fish.flipped = orient.flipped;
    fish.frame = 0;
    fish.frameCounter = 0;
    fish.health = 0;
    fish.hurtTimer = 0;
    fish.isSkeleton = false;
    fish.groupId = groupId;
    fish.pairId = undefined;
    fish.highlight = highlight ? true : undefined;
    fish.pendingSkeleton = undefined;
    fish.flashTimer = undefined;
    fish.wanderTimer =
      Math.random() * (WANDER_TIMER_MAX_MS - WANDER_TIMER_MIN_MS) + WANDER_TIMER_MIN_MS;
    return fish;
  };

  if (specialPairs[args.kind]) {
    const pairId = args.nextPairIdRef.current++;
    const { vx, vy } = genVelocity();
    const pairStart = edge === 0 ? -2 * FISH_SIZE : width - FISH_SIZE;
    const y = Math.random() * height;
    specialPairs[args.kind].forEach((name, index) => {
      const x = pairStart + index * FISH_SIZE;
      const fish = makeFish(name, x, y, vx, vy);
      fish.pairId = pairId;
      spawned.push(fish);
    });
  } else {
    const baseX = startX;
    const baseY = Math.random() * height;
    const baseVelocity = genVelocity();
    const groupId =
      count > 1 && !specialSingles.includes(args.kind) ? args.nextGroupIdRef.current++ : undefined;

    for (let i = 0; i < count; i += 1) {
      let px = baseX;
      let py = baseY;
      let vx = baseVelocity.vx;
      let vy = baseVelocity.vy;

      if (groupId !== undefined && i > 0) {
        py += (Math.random() - 0.5) * FISH_SIZE;
        px += edge === 0 ? -Math.random() * (FISH_SIZE / 2) : Math.random() * (FISH_SIZE / 2);
        vx += (Math.random() - 0.5) * speedVariance;
        vy += (Math.random() - 0.5) * speedVariance;
        const limited = clampIncline(vx, vy);
        vx = limited.vx;
        vy = limited.vy;
      } else {
        py = Math.random() * height;
      }

      const fish = makeFish(args.kind, px, py, vx, vy, groupId, isSpecial && i === 0);
      spawned.push(fish);
    }
  }

  cur.fish.push(...spawned);
  return spawned;
}

export function spawnZombiefishBubbleStage(args: {
  stateRef: MutableRefObject<GameState>;
  inactiveBubblesRef: MutableRefObject<Bubble[]>;
  nextBubbleIdRef: MutableRefObject<number>;
}): void {
  const { width, height } = args.stateRef.current.dims;
  const kinds = ["bubble_a", "bubble_b", "bubble_c"];
  const kind = pickRandom(kinds);
  if (!kind) return;
  const size = randomInRange(BUBBLE_MIN, BUBBLE_MAX);
  const x = randomInRange(0, Math.max(0, width - size));
  const y = height + size;
  const vx = randomInRange(-BUBBLE_VX_MAX, BUBBLE_VX_MAX);
  const vy = randomInRange(BUBBLE_VY_MIN, BUBBLE_VY_MAX);
  const amp = randomInRange(0.5, 2.5);
  const freq = randomInRange(0.01, 0.06);
  if (args.stateRef.current.bubbles.length >= MAX_BUBBLES) return;

  const bubble = args.inactiveBubblesRef.current.pop() || ({} as Bubble);
  bubble.id = args.nextBubbleIdRef.current++;
  bubble.kind = kind;
  bubble.x = x;
  bubble.y = y;
  bubble.vx = vx;
  bubble.vy = vy;
  bubble.size = size;
  bubble.amp = amp;
  bubble.freq = freq;
  args.stateRef.current.bubbles.push(bubble);
}
