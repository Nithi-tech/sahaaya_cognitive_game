import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { GAME_REGISTRY } from '../games/registry';

/**
 * The one place that decides which games are unlocked for the current
 * patient — currently just the family_faces gate (needs 2+ known family
 * members). Extracted out of ElderlyActivities.tsx/ElderlyGames.tsx, which
 * both had this exact logic duplicated; a future unlock rule change only
 * needs to happen here once.
 */
export function useAvailableGames() {
  const { memories, currentPatient } = useApp();

  // Counts both the legacy Memory[] store and the newer onboarding.people
  // section — a caregiver who only did the guided interview (the common
  // path now) still unlocks the game, not just one who used "My Memories".
  const familyMemoryCount = useMemo(() => {
    const legacy = memories.filter((m) => m.category === 'family' && m.relationship).length;
    const onboarding = currentPatient?.preferences?.onboarding?.people?.people?.length ?? 0;
    return legacy + onboarding;
  }, [memories, currentPatient]);

  const availableGames = useMemo(
    () => GAME_REGISTRY.filter((g) => g.id !== 'family_faces' || familyMemoryCount >= 2),
    [familyMemoryCount],
  );

  return { availableGames, familyMemoryCount };
}
