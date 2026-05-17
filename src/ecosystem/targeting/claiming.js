const CLAIM_DURATION = 1.2;

export function isClaimAvailable(target, claimantId, now) {
  if (!target.data.claimedBy) return true;
  if (target.data.claimedBy === claimantId) return true;
  if ((target.data.claimedUntil || 0) < now) return true;

  return false;
}

export function claimTarget(target, claimantId, now, duration = CLAIM_DURATION) {
  target.data.claimedBy = claimantId;
  target.data.claimedUntil = now + duration;
}

export function releaseClaim(target, claimantId) {
  if (!target || !target.data) return;

  if (target.data.claimedBy === claimantId) {
    target.data.claimedBy = null;
    target.data.claimedUntil = 0;
  }
}

export function cleanupExpiredClaim(target, now) {
  if (!target || !target.data) return;

  if (target.data.claimedBy && (target.data.claimedUntil || 0) < now) {
    target.data.claimedBy = null;
    target.data.claimedUntil = 0;
  }
}

export function getBestClaimableTarget({
  cell,
  targets,
  now,
  maxDistance,
  filterFn,
  scoreFn = null,
}) {
  let bestTarget = null;
  let bestScore = Infinity;

  const claimantId = cell.data.id;

  for (const target of targets) {
    if (!target.data) continue;

    cleanupExpiredClaim(target, now);

    if (!filterFn(target)) continue;
    if (!isClaimAvailable(target, claimantId, now)) continue;

    const dx = target.data.x - cell.data.x;
    const dy = target.data.y - cell.data.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > maxDistance * maxDistance) continue;

    const score = scoreFn
      ? scoreFn(cell, target, distSq)
      : distSq;

    if (score < bestScore) {
      bestScore = score;
      bestTarget = target;
    }
  }

  if (bestTarget) {
    claimTarget(bestTarget, claimantId, now);
  }

  return bestTarget;
}