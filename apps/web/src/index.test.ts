import { describe, it, expect } from 'vitest';
import { WEB_PLACEHOLDER } from './index';

describe('web (M0 smoke)', () => {
  it('exposes a placeholder export', () => {
    expect(WEB_PLACEHOLDER).toBe('web');
  });
});
