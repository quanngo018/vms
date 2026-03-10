/**
 * Mock data for Video Playback page
 * 
 * Production endpoints:
 *   GET /api/playback/search   → search recordings
 *   GET /api/playback/timeline → timeline segments for a camera
 *   GET /api/playback/stream   → playback stream URL
 * 
 * To switch to real data: replace these exports with fetch() calls.
 */

import { cameras } from './data';

// ─── Recording segments for timeline ───
export function generateTimelineSegments(cameraId, date) {
  const segments = [];
  const baseDate = date || new Date();
  const dayStr = baseDate.toISOString().split('T')[0];

  // Generate segments throughout the day (some gaps)
  const segmentPatterns = [
    { start: 0, end: 2, type: 'continuous' },
    // gap 2-3am (maintenance window)
    { start: 3, end: 7, type: 'continuous' },
    { start: 7, end: 9, type: 'continuous', hasEvents: true },
    { start: 9, end: 12, type: 'continuous' },
    // gap 12-12:30 (short outage)
    { start: 12.5, end: 17, type: 'continuous' },
    { start: 17, end: 19, type: 'continuous', hasEvents: true },
    { start: 19, end: 23.5, type: 'continuous' },
  ];

  segmentPatterns.forEach((pat, i) => {
    const startH = Math.floor(pat.start);
    const startM = Math.round((pat.start - startH) * 60);
    const endH = Math.floor(pat.end);
    const endM = Math.round((pat.end - endH) * 60);

    segments.push({
      id: `seg_${cameraId}_${i}`,
      cameraId,
      startTime: `${dayStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00Z`,
      endTime: `${dayStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00Z`,
      type: pat.type,
      hasEvents: pat.hasEvents || false,
      size: Math.round((pat.end - pat.start) * 1.2 * 1024), // MB
    });
  });

  return segments;
}

// ─── Event markers on timeline ───
export function generatePlaybackEvents(cameraId, date) {
  const events = [];
  const baseDate = date || new Date();
  const dayStr = baseDate.toISOString().split('T')[0];

  const templates = [
    { hour: 7, min: 23, type: 'vehicle_detected', desc: 'Vehicle entering restricted zone' },
    { hour: 7, min: 45, type: 'person_detected', desc: 'Person detected at entrance' },
    { hour: 8, min: 12, type: 'illegal_parking', desc: 'Illegal parking detected' },
    { hour: 8, min: 34, type: 'loitering', desc: 'Loitering detected for 3 minutes' },
    { hour: 9, min: 5, type: 'person_detected', desc: 'Multiple persons detected' },
    { hour: 14, min: 20, type: 'vehicle_detected', desc: 'Truck in no-truck zone' },
    { hour: 17, min: 10, type: 'crowd', desc: 'Crowd build-up detected (12 people)' },
    { hour: 17, min: 45, type: 'suspicious_activity', desc: 'Unusual activity detected' },
    { hour: 18, min: 30, type: 'illegal_parking', desc: 'Double parking detected' },
    { hour: 20, min: 15, type: 'person_detected', desc: 'Person near restricted area' },
  ];

  templates.forEach((t, i) => {
    events.push({
      id: `pbe_${cameraId}_${i}`,
      cameraId,
      timestamp: `${dayStr}T${String(t.hour).padStart(2, '0')}:${String(t.min).padStart(2, '0')}:00Z`,
      type: t.type,
      description: t.desc,
      confidence: 0.7 + Math.random() * 0.25,
    });
  });

  return events;
}

// ─── Search results (recordings matching query) ───
export function searchRecordings({ cameraIds, startDate, endDate, eventType }) {
  const results = [];
  const cams = cameraIds?.length > 0 ? cameras.filter(c => cameraIds.includes(c.id)) : cameras.slice(0, 5);
  
  cams.forEach(cam => {
    const count = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const hour = 6 + Math.floor(Math.random() * 16);
      const minute = Math.floor(Math.random() * 60);
      const duration = 30 + Math.floor(Math.random() * 300); // seconds

      results.push({
        id: `rec_${cam.id}_${i}`,
        cameraId: cam.id,
        cameraName: cam.name,
        startTime: `2026-02-24T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`,
        duration,
        size: Math.round(duration * 0.5), // MB
        hasEvents: Math.random() > 0.5,
        eventCount: Math.floor(Math.random() * 5),
        thumbnail: `/snapshots/${cam.id}_${i}.jpg`,
      });
    }
  });

  return results.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
}
