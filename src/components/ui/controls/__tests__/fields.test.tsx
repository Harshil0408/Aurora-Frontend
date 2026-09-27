import { useState } from 'react';
import { format } from 'date-fns';
import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { FormField } from '../FormField';
import { SelectField } from '../SelectField';
import {
  DateTimeField,
  toDateInput,
  toDateTimeInput,
  toTimeInput,
} from '../DateTimeField';
import { SearchField } from '../SearchField';

describe('FormField', () => {
  it('labels, hints, and announces errors', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <FormField label="Work email" hint="We never share it." value="" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('Work email')).toBeInTheDocument();
    expect(screen.getByText('We never share it.')).toBeInTheDocument();

    rerender(
      <FormField label="Work email" error helperText="Enter a valid email" value="x" onChange={() => {}} />,
    );
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Work email'));
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormField label="Password" type="password" value="secret" onChange={() => {}} />,
    );
    const input = screen.getByLabelText('Password') as HTMLInputElement;
    expect(input.type).toBe('password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input.type).toBe('text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input.type).toBe('password');
  });

  it('renders a leading icon', () => {
    renderWithProviders(
      <FormField label="Code" startIcon={<span data-testid="lead" />} value="" onChange={() => {}} />,
    );
    expect(screen.getByTestId('lead')).toBeInTheDocument();
  });
});

describe('SelectField', () => {
  it('picks from labeled options', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [v, setV] = useState('');
      return (
        <>
          <SelectField
            label="Role"
            value={v}
            onChange={setV}
            options={['Admin', 'Support']}
            placeholder="All roles"
          />
          <output data-testid="out">{v || 'none'}</output>
        </>
      );
    }
    renderWithProviders(<Harness />);
    await user.click(screen.getByRole('combobox', { name: 'Role' }));
    await user.click(await screen.findByRole('option', { name: 'Support' }));
    expect(screen.getByTestId('out')).toHaveTextContent('Support');
  });

  it('shows hint or announced error text', () => {
    const { rerender } = renderWithProviders(
      <SelectField label="Role" value="" onChange={() => {}} options={['A']} hint="Pick one" />,
    );
    expect(screen.getByText('Pick one')).toBeInTheDocument();
    rerender(
      <SelectField label="Role" value="" onChange={() => {}} options={['A']} error errorText="Required" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});

describe('DateTimeField', () => {
  it('renders date-only, time-only, and combined inputs', () => {
    const noop = () => {};
    const { unmount } = renderWithProviders(
      <DateTimeField mode="date" label="From" value="2026-09-01" onChange={noop} />,
    );
    expect(screen.getByLabelText('From') as HTMLInputElement).toHaveAttribute('type', 'date');
    unmount();
    renderWithProviders(
      <DateTimeField mode="time" label="At" value="14:30" onChange={noop} />,
    );
    expect(screen.getByLabelText('At') as HTMLInputElement).toHaveAttribute('type', 'time');
  });

  it('forwards typed values', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <DateTimeField mode="datetime" label="When" value="" onChange={onChange} />,
    );
    const input = screen.getByLabelText('When') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'datetime-local');
    await user.type(input, '2026-09-27T10:00');
    expect(onChange).toHaveBeenCalled();
  });

  it('formats ISO values for each mode (timezone-independent)', () => {
    const at = (h: number, m: number) =>
      format(new Date(Date.UTC(2026, 8, 27, h, m)), 'HH:mm');
    const noon = '2026-09-27T12:00:00.000Z';
    expect(toDateInput(noon)).toBe('2026-09-27');
    expect(toTimeInput(noon)).toBe(at(12, 0));
    expect(toDateTimeInput(noon)).toBe(`${toDateInput(noon)}T${at(12, 0)}`);
  });
});

describe('SearchField', () => {
  it('clears with one click', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [v, setV] = useState('tom');
      return <SearchField value={v} onChange={setV} aria-label="Search admins" />;
    }
    renderWithProviders(<Harness />);
    expect(screen.getByLabelText('Search admins')).toHaveValue('tom');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByLabelText('Search admins')).toHaveValue('');
  });

  it('hides the clear button when empty', () => {
    renderWithProviders(<SearchField value="" onChange={() => {}} aria-label="Search admins" />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });
});
