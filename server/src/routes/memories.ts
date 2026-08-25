import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requirePatientAccess } from '../auth.js';
import { applyMemoryCreate } from '../mutations.js';

export const memoriesRouter = Router();
memoriesRouter.use(requireAuth);

interface MemoryRow {
  id: string;
  patient_id: string;
  category: string;
  title: string;
  description: string;
  image_url: string | null;
  audio_url: string | null;
  voice_text: string | null;
  relationship: string | null;
  notes: string | null;
  created_at: string;
}

function serialize(row: MemoryRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    category: row.category,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url ?? undefined,
    audioUrl: row.audio_url ?? undefined,
    voiceText: row.voice_text ?? undefined,
    relationship: row.relationship ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

memoriesRouter.get('/:patientId', requirePatientAccess, (req, res) => {
  const rows = db.prepare('SELECT * FROM memories WHERE patient_id = ? ORDER BY created_at DESC').all(
    req.params.patientId,
  ) as MemoryRow[];
  res.json({ memories: rows.map(serialize) });
});

memoriesRouter.post('/:patientId', requirePatientAccess, (req, res) => {
  try {
    const row = applyMemoryCreate(String(req.params.patientId), req.body ?? {}) as MemoryRow;
    res.status(201).json({ memory: serialize(row) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

memoriesRouter.patch('/:patientId/:memoryId', requirePatientAccess, (req, res) => {
  const existing = db.prepare('SELECT * FROM memories WHERE id = ? AND patient_id = ?').get(
    req.params.memoryId,
    req.params.patientId,
  ) as MemoryRow | undefined;
  if (!existing) return res.status(404).json({ error: 'Memory not found' });

  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE memories SET category=?, title=?, description=?, image_url=?, audio_url=?, voice_text=?, relationship=?, notes=? WHERE id=?`,
  ).run(
    merged.category,
    merged.title,
    merged.description,
    merged.imageUrl ?? merged.image_url ?? null,
    merged.audioUrl ?? merged.audio_url ?? null,
    merged.voiceText ?? merged.voice_text ?? null,
    merged.relationship ?? null,
    merged.notes ?? null,
    existing.id,
  );
  const row = db.prepare('SELECT * FROM memories WHERE id = ?').get(existing.id) as MemoryRow;
  res.json({ memory: serialize(row) });
});

memoriesRouter.delete('/:patientId/:memoryId', requirePatientAccess, (req, res) => {
  db.prepare('DELETE FROM memories WHERE id = ? AND patient_id = ?').run(req.params.memoryId, req.params.patientId);
  res.status(204).send();
});
