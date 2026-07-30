/**
 * Helper to get all course IDs that belong to the same exam track (e.g. NEET, JEE).
 * This ensures that mock tests, questions, or DPPs created under equivalent courses
 * (e.g. "NEET" vs "NEET 2027") are accessible to students enrolled in that track.
 */
export function getEquivalentCourseIds(lockedCourseId: string, courses: any[]): string[] {
  if (!lockedCourseId) return [];

  const targetCourse = (courses || []).find(
    (c) => String(c._id) === String(lockedCourseId) || String(c.id) === String(lockedCourseId) || c.name === lockedCourseId
  );

  const matchedIds = new Set<string>();
  const initialIdStr = String(lockedCourseId);
  matchedIds.add(initialIdStr);

  if (targetCourse && targetCourse._id) {
    matchedIds.add(String(targetCourse._id));
  }

  const targetName = (targetCourse?.name || initialIdStr).toLowerCase().trim();

  (courses || []).forEach((c) => {
    const cName = (c.name || '').toLowerCase().trim();
    const cId = String(c._id || c.id);

    if (
      cName === targetName ||
      (targetName.includes('neet') && cName.includes('neet')) ||
      (targetName.includes('jee') && cName.includes('jee'))
    ) {
      matchedIds.add(cId);
    }
  });

  return Array.from(matchedIds);
}
