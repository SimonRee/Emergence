export function distanceSquared(a, b) {
  const dx = a.data.x - b.data.x;
  const dy = a.data.y - b.data.y;
  return dx * dx + dy * dy;
}

export function findNearestTarget(cell, targets, filterFn, maxDistance = 200) {
  let nearest = null;
  let nearestDistSq = maxDistance * maxDistance;

  for (const target of targets) {
    if (!filterFn(target)) continue;

    const distSq = distanceSquared(cell, target);

    if (distSq < nearestDistSq) {
      nearest = target;
      nearestDistSq = distSq;
    }
  }

  return nearest;
}

export function moveToward(cell, target, deltaSeconds, worldWidth, worldHeight) {
  const d = cell.data;
  const dna = d.dna;

  if (!target) {
    wander(cell, deltaSeconds, worldWidth, worldHeight);
    return;
  }

  const dx = target.data.x - d.x;
  const dy = target.data.y - d.y;

  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  const nx = dx / dist;
  const ny = dy / dist;

  const speed = dna.speed * (0.35 + dna.attraction);

  d.vx += nx * speed * deltaSeconds;
  d.vy += ny * speed * deltaSeconds;

  applyMotion(cell, deltaSeconds, worldWidth, worldHeight);
}

export function wander(cell, deltaSeconds, worldWidth, worldHeight) {
  const d = cell.data;
  const dna = d.dna;

  d.wanderAngle += randomRange(-1.5, 1.5) * deltaSeconds;

  const force = dna.speed * 0.55;

  d.vx += Math.cos(d.wanderAngle) * force * deltaSeconds;
  d.vy += Math.sin(d.wanderAngle) * force * deltaSeconds;

  applyMotion(cell, deltaSeconds, worldWidth, worldHeight);
}

export function applyMotion(cell, deltaSeconds, worldWidth, worldHeight) {
  const d = cell.data;
  const dna = d.dna;

  const friction = 0.92;
  d.vx *= friction;
  d.vy *= friction;

  const maxSpeed = dna.speed;
  const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);

  if (speed > maxSpeed) {
    d.vx = (d.vx / speed) * maxSpeed;
    d.vy = (d.vy / speed) * maxSpeed;
  }

  d.x += d.vx * deltaSeconds;
  d.y += d.vy * deltaSeconds;

  // rimbalzo morbido sui bordi
  if (d.x < 0) {
    d.x = 0;
    d.vx *= -0.4;
  }

  if (d.x > worldWidth) {
    d.x = worldWidth;
    d.vx *= -0.4;
  }

  if (d.y < 0) {
    d.y = 0;
    d.vy *= -0.4;
  }

  if (d.y > worldHeight) {
    d.y = worldHeight;
    d.vy *= -0.4;
  }

  cell.position.set(d.x, d.y);

  // orientamento morbido verso la direzione del movimento
  if (speed > 1) {
    const targetRotation = Math.atan2(d.vy, d.vx);
    cell.rotation = lerpAngle(cell.rotation, targetRotation, 0.08);
  }
}

export function isCloseEnough(a, b, radius = 10) {
  return distanceSquared(a, b) < radius * radius;
}

function lerpAngle(a, b, t) {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + diff * t;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function fleeFromTarget(cell, threat, deltaSeconds, worldWidth, worldHeight) { //per far scappare erbivore e decompositrici ds predatore
  const d = cell.data;
  const dna = d.dna;

  if (!threat) {
    wander(cell, deltaSeconds, worldWidth, worldHeight);
    return;
  }

  const dx = d.x - threat.data.x;
  const dy = d.y - threat.data.y;

  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  const nx = dx / dist;
  const ny = dy / dist;

  const fearBoost = 1 + dna.fear * 0.8; // Aumenta la velocità in base al livello di paura
  const speed = dna.speed * fearBoost;

  d.vx += nx * speed * deltaSeconds;
  d.vy += ny * speed * deltaSeconds;

  applyMotion(cell, deltaSeconds, worldWidth, worldHeight);
}