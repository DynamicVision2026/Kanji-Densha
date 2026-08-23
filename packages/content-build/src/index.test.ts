import { describe, it, expect } from 'vitest';
import { CONTENT_BUILD_PLACEHOLDER } from './index';

describe('content-build (M0 smoke)', () => {
  it('exposes a placeholder export', () => {
    expect(CONTENT_BUILD_PLACEHOLDER).toBe('content-build');
  });
});
