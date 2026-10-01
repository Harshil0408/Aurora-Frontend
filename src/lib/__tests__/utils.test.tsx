import { useState } from 'react';
import { renderWithProviders, screen } from '@/test-utils';
import { formatDay, formatMonth, machineCode, useResetKey } from '../utils';

describe('utils', () => {
  it('formats ISO months and days, passing through bad input', () => {
    expect(formatMonth('2026-09-18T10:00:00.000Z')).toBe('Sep 2026');
    expect(formatMonth('nope')).toBe('nope');
    // Noon UTC stays Sep 18 in every zone (formatDay renders local time).
    expect(formatDay('2026-09-18T12:00:00.000Z')).toMatch(/^Sep 18, 2026 · \d{2}:\d{2}$/);
    expect(formatDay(null)).toBe('—');
    expect(formatDay('nope')).toBe('nope');
  });

  it('machineCode reads the backend code, falling back to INTERNAL_ERROR', () => {
    expect(
      machineCode({ status: 409, data: { success: false, error: { code: 'ROLE_HAS_ASSIGNMENTS' } } }),
    ).toBe('ROLE_HAS_ASSIGNMENTS');
    expect(machineCode(null)).toBe('INTERNAL_ERROR');
    expect(machineCode({ status: 500 })).toBe('INTERNAL_ERROR');
  });

  it('useResetKey syncs on mount-with-data and on key change only', () => {
    function Harness({ k, value }: { k: string | null; value: string }) {
      const [draft, setDraft] = useState('init');
      useResetKey(k, () => setDraft(value));
      return <p>{draft}</p>;
    }
    const { rerender } = renderWithProviders(<Harness k="a" value="A" />);
    // Mount-with-data syncs immediately.
    expect(screen.getByText('A')).toBeInTheDocument();
    rerender(<Harness k="a" value="B" />);
    // Same key: user edits preserved.
    expect(screen.getByText('A')).toBeInTheDocument();
    rerender(<Harness k="b" value="B" />);
    expect(screen.getByText('B')).toBeInTheDocument();
    rerender(<Harness k={null} value="Z" />);
    expect(screen.getByText('Z')).toBeInTheDocument();
  });
});
