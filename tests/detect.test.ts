import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { isInsideMcpProject, detectLanguage, findMcpRoot } from '../src/utils/detect.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'mcpinnit-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('isInsideMcpProject', () => {
  it('returns false when no manifest exists', () => {
    expect(isInsideMcpProject(tmpDir)).toBe(false);
  });

  it('returns true when .mcp/manifest.json exists in the given dir', () => {
    mkdirSync(join(tmpDir, '.mcp'));
    writeFileSync(join(tmpDir, '.mcp', 'manifest.json'), '{}');
    expect(isInsideMcpProject(tmpDir)).toBe(true);
  });

  it('returns true when manifest exists in a parent directory', () => {
    mkdirSync(join(tmpDir, '.mcp'));
    writeFileSync(join(tmpDir, '.mcp', 'manifest.json'), '{}');
    const nested = join(tmpDir, 'src', 'tools');
    mkdirSync(nested, { recursive: true });
    expect(isInsideMcpProject(nested)).toBe(true);
  });
});

describe('detectLanguage', () => {
  it('returns "unknown" when no marker files exist', () => {
    expect(detectLanguage(tmpDir)).toBe('unknown');
  });

  it('returns "typescript" when package.json exists', () => {
    writeFileSync(join(tmpDir, 'package.json'), '{}');
    expect(detectLanguage(tmpDir)).toBe('typescript');
  });

  it('returns "python" when pyproject.toml exists', () => {
    writeFileSync(join(tmpDir, 'pyproject.toml'), '');
    expect(detectLanguage(tmpDir)).toBe('python');
  });

  it('returns "python" when requirements.txt exists', () => {
    writeFileSync(join(tmpDir, 'requirements.txt'), '');
    expect(detectLanguage(tmpDir)).toBe('python');
  });
});

describe('findMcpRoot', () => {
  it('returns null when no manifest exists', () => {
    expect(findMcpRoot(tmpDir)).toBeNull();
  });

  it('returns the directory containing .mcp/manifest.json', () => {
    mkdirSync(join(tmpDir, '.mcp'));
    writeFileSync(join(tmpDir, '.mcp', 'manifest.json'), '{}');
    expect(findMcpRoot(tmpDir)).toBe(tmpDir);
  });

  it('returns the parent when called from a nested directory', () => {
    mkdirSync(join(tmpDir, '.mcp'));
    writeFileSync(join(tmpDir, '.mcp', 'manifest.json'), '{}');
    const nested = join(tmpDir, 'src');
    mkdirSync(nested);
    expect(findMcpRoot(nested)).toBe(tmpDir);
  });
});
