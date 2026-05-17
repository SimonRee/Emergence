export const BOID_PROFILES = {
  herbivore: {
    separationWeight: 1.15,
    cohesionWeight: 0.85,
    alignmentWeight: 0.75,
    neighborRadius: 95,
    separationRadius: 34,
    maxForce: 180,
  },

  decomposer: {
    separationWeight: 0.9,
    cohesionWeight: 0.35,
    alignmentWeight: 0.25,
    neighborRadius: 80,
    separationRadius: 28,
    maxForce: 120,
  },

  carnivore: {
    separationWeight: 0.45,
    cohesionWeight: 0.0,
    alignmentWeight: 0.0,
    neighborRadius: 80,
    separationRadius: 45,
    maxForce: 80,
  },
};

export function applyBoids(cell, neighbors, deltaSeconds, profileName) {
  const profile = BOID_PROFILES[profileName];
  if (!profile) return;

  const d = cell.data;

  let sepX = 0;
  let sepY = 0;
  let cohX = 0;
  let cohY = 0;
  let aliX = 0;
  let aliY = 0;

  let neighborCount = 0;
  let separationCount = 0;

  for (const other of neighbors) {
    if (other === cell) continue;
    if (!other.data || other.data.state !== "alive") continue;
    if (other.data.type !== d.type) continue;

    const od = other.data;

    const dx = od.x - d.x;
    const dy = od.y - d.y;
    const distSq = dx * dx + dy * dy;

    if (distSq <= 0) continue;

    const dist = Math.sqrt(distSq);

    if (dist < profile.neighborRadius) {
      neighborCount++;

      cohX += od.x;
      cohY += od.y;

      aliX += od.vx || 0;
      aliY += od.vy || 0;
    }

    if (dist < profile.separationRadius) {
      separationCount++;

      const awayStrength = 1 - dist / profile.separationRadius;

      sepX -= (dx / dist) * awayStrength;
      sepY -= (dy / dist) * awayStrength;
    }
  }

  let forceX = 0;
  let forceY = 0;

  if (separationCount > 0) {
    sepX /= separationCount;
    sepY /= separationCount;

    forceX += sepX * profile.separationWeight;
    forceY += sepY * profile.separationWeight;
  }

  if (neighborCount > 0) {
    // Cohesion: verso il centro del gruppo
    cohX = cohX / neighborCount - d.x;
    cohY = cohY / neighborCount - d.y;

    const cohLen = Math.sqrt(cohX * cohX + cohY * cohY) || 1;
    cohX /= cohLen;
    cohY /= cohLen;

    forceX += cohX * profile.cohesionWeight;
    forceY += cohY * profile.cohesionWeight;

    // Alignment: verso la direzione media
    aliX /= neighborCount;
    aliY /= neighborCount;

    const aliLen = Math.sqrt(aliX * aliX + aliY * aliY);

    if (aliLen > 0.001) {
      aliX /= aliLen;
      aliY /= aliLen;

      forceX += aliX * profile.alignmentWeight;
      forceY += aliY * profile.alignmentWeight;
    }
  }

  const forceLen = Math.sqrt(forceX * forceX + forceY * forceY);

  if (forceLen > 0.001) {
    forceX /= forceLen;
    forceY /= forceLen;

    d.vx += forceX * profile.maxForce * deltaSeconds;
    d.vy += forceY * profile.maxForce * deltaSeconds;
  }
}