const MAX_RESPONSE_SIZE_BYTES = 25 * 1024; // 25kb
const DEFAULT_LATENCY_THRESHOLD_MS = 5000;

export interface ValidationResult {
  schemaValid: boolean;
  sizeBytes: number;
  withinSizeLimit: boolean;
  withinLatencyLimit: boolean;
  errors: string[];
}

export function validateToolResponse(
  response: unknown,
  latencyMs: number,
  latencyThresholdMs = DEFAULT_LATENCY_THRESHOLD_MS
): ValidationResult {
  const errors: string[] = [];

  const serialized = JSON.stringify(response);
  const sizeBytes = Buffer.byteLength(serialized, 'utf-8');

  // Must have content array
  if (!response || typeof response !== 'object') {
    errors.push('Response is not an object');
    return { schemaValid: false, sizeBytes, withinSizeLimit: sizeBytes <= MAX_RESPONSE_SIZE_BYTES, withinLatencyLimit: latencyMs <= latencyThresholdMs, errors };
  }

  const res = response as Record<string, unknown>;

  if (!Array.isArray(res['content'])) {
    errors.push('Response missing "content" array');
  } else {
    const content = res['content'] as unknown[];
    for (let i = 0; i < content.length; i++) {
      const item = content[i] as Record<string, unknown>;
      if (!item['type'] || typeof item['type'] !== 'string') {
        errors.push(`content[${i}] missing valid "type" field`);
      }
      if (item['type'] === 'text' && typeof item['text'] !== 'string') {
        errors.push(`content[${i}] of type "text" missing "text" string`);
      }
    }
  }

  if ('isError' in res && typeof res['isError'] !== 'boolean') {
    errors.push('"isError" field must be a boolean when present');
  }

  const withinSizeLimit = sizeBytes <= MAX_RESPONSE_SIZE_BYTES;
  const withinLatencyLimit = latencyMs <= latencyThresholdMs;

  if (!withinSizeLimit) {
    errors.push(`Response too large: ${(sizeBytes / 1024).toFixed(1)}kb (max 25kb)`);
  }
  if (!withinLatencyLimit) {
    errors.push(`Latency too high: ${latencyMs}ms (max ${latencyThresholdMs}ms)`);
  }

  return {
    schemaValid: errors.length === 0,
    sizeBytes,
    withinSizeLimit,
    withinLatencyLimit,
    errors,
  };
}
