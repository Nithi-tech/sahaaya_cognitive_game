// Onboarding router: allows a caregiver to read and save the 6 preference
// interview sections for a patient they own. Sections are merged into the
// patient's preferences_json under an `onboarding` key so each section can be
// saved independently across multiple sittings without losing earlier work.
import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requirePatientAccess, requireRole } from '../auth.js';

export const onboardingRouter = Router();
onboardingRouter.use(requireAuth);

const VALID_SECTIONS = ['people', 'favorites', 'routine', 'cultural', 'health', 'emotional'] as const;
type Section = typeof VALID_SECTIONS[number];

interface PatientRow {
  id: string;
  preferences_json: string;
  onboarding_complete: number;
}

function getPrefs(patientId: string): Record<string, unknown> {
  const row = db.prepare('SELECT preferences_json FROM patients WHERE id = ?').get(patientId) as
    | { preferences_json: string }
    | undefined;
  if (!row) throw new Error('Patient not found');
  return JSON.parse(row.preferences_json) as Record<string, unknown>;
}

// GET /api/onboarding/:patientId
// Returns the onboarding sub-object (which sections are filled vs. null) and
// the overall onboarding_complete flag.
onboardingRouter.get('/:patientId', requirePatientAccess, (req, res) => {
  const row = db
    .prepare('SELECT preferences_json, onboarding_complete FROM patients WHERE id = ?')
    .get(req.params.patientId) as PatientRow | undefined;
  if (!row) return res.status(404).json({ error: 'Patient not found' });

  const prefs = JSON.parse(row.preferences_json) as Record<string, unknown>;
  const onboarding = (prefs.onboarding ?? {}) as Record<string, unknown>;

  // Report which of the 6 sections have been filled so the wizard can restore state.
  const progress = Object.fromEntries(
    VALID_SECTIONS.map((s) => [s, onboarding[s] ?? null]),
  );

  res.json({
    onboardingComplete: row.onboarding_complete === 1,
    progress,
  });
});

// PATCH /api/onboarding/:patientId/:section
// Saves one section at a time. The section data is merged (not replaced) into
// preferences_json.onboarding so earlier sections are never clobbered.
// Only the assigned caregiver can write onboarding data — the elder's own
// account should never be able to edit sensitive sections like 'health'.
onboardingRouter.patch('/:patientId/:section', requireRole('caregiver'), requirePatientAccess, (req, res) => {
  const section = req.params.section as Section;
  if (!VALID_SECTIONS.includes(section)) {
    return res.status(400).json({ error: `Invalid section. Must be one of: ${VALID_SECTIONS.join(', ')}` });
  }

  const patientId = String(req.params.patientId);
  const sectionData = req.body?.data;
  if (sectionData === undefined || sectionData === null) {
    return res.status(400).json({ error: 'Request body must contain a "data" field' });
  }

  let prefs: Record<string, unknown>;
  try {
    prefs = getPrefs(patientId);
  } catch {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const onboarding = ((prefs.onboarding ?? {}) as Record<string, unknown>);
  onboarding[section] = sectionData;
  prefs.onboarding = onboarding;

  db.prepare('UPDATE patients SET preferences_json = ? WHERE id = ?').run(
    JSON.stringify(prefs),
    patientId,
  );

  res.json({ section, saved: true, data: sectionData });
});
