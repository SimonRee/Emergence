export class SpatialGrid {
  constructor({ worldWidth, worldHeight, cellSize = 180 }) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.cellSize = cellSize;

    this.cols = Math.ceil(worldWidth / cellSize);
    this.rows = Math.ceil(worldHeight / cellSize);

    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  rebuild(objects) {
    this.clear();

    for (const obj of objects) {
      this.insert(obj);
    }
  }

  insert(obj) {
    const key = this.getCellKeyFromObject(obj);

    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }

    this.cells.get(key).push(obj);
  }

  queryRadius(x, y, radius) {
    const results = [];

    const minCol = this.clampCol(Math.floor((x - radius) / this.cellSize));
    const maxCol = this.clampCol(Math.floor((x + radius) / this.cellSize));
    const minRow = this.clampRow(Math.floor((y - radius) / this.cellSize));
    const maxRow = this.clampRow(Math.floor((y + radius) / this.cellSize));

    const radiusSq = radius * radius;

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const key = this.getCellKey(col, row);
        const bucket = this.cells.get(key);

        if (!bucket) continue;

        for (const obj of bucket) {
          const dx = obj.data.x - x;
          const dy = obj.data.y - y;

          if (dx * dx + dy * dy <= radiusSq) {
            results.push(obj);
          }
        }
      }
    }

    return results;
  }

  getCellKeyFromObject(obj) {
    const col = this.clampCol(Math.floor(obj.data.x / this.cellSize));
    const row = this.clampRow(Math.floor(obj.data.y / this.cellSize));

    return this.getCellKey(col, row);
  }

  getCellKey(col, row) {
    return `${col},${row}`;
  }

  clampCol(col) {
    return Math.max(0, Math.min(this.cols - 1, col));
  }

  clampRow(row) {
    return Math.max(0, Math.min(this.rows - 1, row));
  }
}