import * as React from "react";
import { useAudio } from "@/hooks/audio/useAudio";
import { useAudioManager } from "@/hooks/audio/useAudioManager";
import type { AudioMgr } from "@/types/audio/audio";

export function useGameAudio(): AudioMgr {
  const artillerySfx = useAudio("/audio/whistle_fall.ogg", true);
  const artilleryExplodeSfx = useAudio("/audio/explosionCrunch_000.ogg");
  const artillerySplashSfx = useAudio("/audio/splash.ogg");
  const beepSfx = useAudio("/audio/drop_003.ogg");
  const boopSfx = useAudio("/audio/drop_004.ogg");
  const bombSfx = useAudio("/audio/explosionCrunch_004.ogg");
  const cannonballSfx = useAudio("/audio/laserRetro_000.ogg");
  const crashSfx = useAudio("/audio/explosionCrunch_002.ogg");
  const duckSfx = useAudio("/audio/select_003.ogg");
  const enemyHitSfx = useAudio("/audio/laser9.ogg");
  const flapSfx = useAudio("/audio/click_001.ogg");
  const flightSfx = useAudio("/audio/engineCircular_001.ogg", true);
  const freezeSfx = useAudio("/audio/freeze.ogg");
  const gameOverSfx = useAudio("/audio/select_005.ogg");
  const groundTouchSfx = useAudio("/audio/explosionCrunch_002.ogg");
  const homingExplSfx = useAudio("/audio/explosionCrunch_001.ogg");
  const medalSfx = useAudio("/audio/confirmation_003.ogg");
  const napalmExplodeSfx = useAudio("/audio/explosionCrunch_000.ogg");
  const powerupSfx = useAudio("/audio/powerUp8.ogg");
  const reloadSfx = useAudio("/audio/scratch_003.ogg");
  const shieldSfx = useAudio("/audio/forceField_002.ogg");
  const shrinkSfx = useAudio("/audio/phaserDown1.ogg");
  const skullSfx = useAudio("/audio/lowDown.ogg");
  const laserBeamFireSfx = useAudio("/audio/laserSmall_001.ogg");
  const shotSfx = useAudio("/audio/laser4.ogg");
  const thunderSfx = useAudio("/audio/thunderstrike.ogg");
  const thrusterSfx = useAudio("/audio/thrusterFire_000.ogg", true);
  const whooshSfx = useAudio("/audio/whoosh.ogg", true);

  const audioMap = React.useMemo(
    () => ({
      artillerySfx,
      artilleryExplodeSfx,
      artillerySplashSfx,
      beepSfx,
      boopSfx,
      bombSfx,
      cannonballSfx,
      crashSfx,
      duckSfx,
      enemyHitSfx,
      flapSfx,
      freezeSfx,
      flightSfx,
      gameOverSfx,
      groundTouchSfx,
      homingExplSfx,
      medalSfx,
      napalmExplodeSfx,
      powerupSfx,
      reloadSfx,
      shieldSfx,
      shrinkSfx,
      skullSfx,
      laserBeamFireSfx,
      shotSfx,
      thunderSfx,
      thrusterSfx,
      whooshSfx,
    }),
    [
      artillerySfx,
      artilleryExplodeSfx,
      artillerySplashSfx,
      beepSfx,
      boopSfx,
      bombSfx,
      cannonballSfx,
      crashSfx,
      duckSfx,
      enemyHitSfx,
      flapSfx,
      freezeSfx,
      flightSfx,
      gameOverSfx,
      groundTouchSfx,
      homingExplSfx,
      medalSfx,
      napalmExplodeSfx,
      powerupSfx,
      reloadSfx,
      shieldSfx,
      shrinkSfx,
      skullSfx,
      laserBeamFireSfx,
      shotSfx,
      thunderSfx,
      thrusterSfx,
      whooshSfx,
    ],
  );

  return useAudioManager(audioMap);
}
