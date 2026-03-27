import { existsSync } from 'fs';
import { join, dirname } from 'path';

export function isInsideMcpProject(startDir = process.cwd()): boolean {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, '.mcp', 'manifest.json'))) return true;
    const parent = dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

export function detectLanguage(dir = process.cwd()): 'typescript' | 'python' | 'unknown' {
  if (existsSync(join(dir, 'package.json'))) return 'typescript';
  if (existsSync(join(dir, 'pyproject.toml')) || existsSync(join(dir, 'requirements.txt'))) return 'python';
  return 'unknown';
}

export function findMcpRoot(startDir = process.cwd()): string | null {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, '.mcp', 'manifest.json'))) return current;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}
