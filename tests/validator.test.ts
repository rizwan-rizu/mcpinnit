import { describe, it, expect } from 'vitest';
import { validateToolResponse } from '../src/tester/validator.js';

const validResponse = {
  content: [{ type: 'text', text: 'hello' }],
  isError: false,
};

describe('validateToolResponse', () => {
  it('passes a well-formed response', () => {
    const result = validateToolResponse(validResponse, 100);
    expect(result.schemaValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.withinSizeLimit).toBe(true);
    expect(result.withinLatencyLimit).toBe(true);
  });

  it('fails when content is missing', () => {
    const result = validateToolResponse({ isError: false }, 100);
    expect(result.schemaValid).toBe(false);
    expect(result.errors.some((e) => e.includes('"content"'))).toBe(true);
  });

  it('fails when content is not an array', () => {
    const result = validateToolResponse({ content: 'text', isError: false }, 100);
    expect(result.schemaValid).toBe(false);
  });

  it('fails when a content item is missing type', () => {
    const result = validateToolResponse(
      { content: [{ text: 'hello' }], isError: false },
      100
    );
    expect(result.schemaValid).toBe(false);
    expect(result.errors.some((e) => e.includes('"type"'))).toBe(true);
  });

  it('fails when isError is missing', () => {
    const result = validateToolResponse({ content: [{ type: 'text', text: 'hi' }] }, 100);
    expect(result.schemaValid).toBe(false);
    expect(result.errors.some((e) => e.includes('"isError"'))).toBe(true);
  });

  it('fails when response is not an object', () => {
    const result = validateToolResponse('bad', 100);
    expect(result.schemaValid).toBe(false);
  });

  it('fails when response exceeds 25kb', () => {
    const big = { content: [{ type: 'text', text: 'x'.repeat(26 * 1024) }], isError: false };
    const result = validateToolResponse(big, 100);
    expect(result.withinSizeLimit).toBe(false);
    expect(result.schemaValid).toBe(false);
  });

  it('fails when latency exceeds threshold', () => {
    const result = validateToolResponse(validResponse, 6000);
    expect(result.withinLatencyLimit).toBe(false);
    expect(result.schemaValid).toBe(false);
  });

  it('respects a custom latency threshold', () => {
    const result = validateToolResponse(validResponse, 6000, 10_000);
    expect(result.withinLatencyLimit).toBe(true);
  });

  it('reports correct size in bytes', () => {
    const result = validateToolResponse(validResponse, 100);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.sizeBytes).toBe(Buffer.byteLength(JSON.stringify(validResponse)));
  });
});
