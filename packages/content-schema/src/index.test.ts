import { describe, it, expect } from 'vitest';
import { CONTENT_SCHEMA_PLACEHOLDER } from './index';

describe('content-schema (M0 smoke)', () => {
  it('exposes a placeholder export', () => {
    expect(CONTENT_SCHEMA_PLACEHOLDER).toBe('content-schema');
  });
});
