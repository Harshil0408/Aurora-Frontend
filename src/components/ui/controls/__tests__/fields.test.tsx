import { useState } from 'react';
import { format } from 'date-fns';
import { renderWithProviders, screen, userEvent, within } from '@/test-utils';
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
  it('renders a readonly text field (never a native date/time input)', () => {
    const noop = () => {};
    const { unmount } = renderWithProviders(
      <DateTimeField mode="date" label="From" value="2026-09-01" onChange={noop} />,
    );
    const from = screen.getByLabelText('From') as HTMLInputElement;
    expect(from).toHaveAttribute('type', 'text');
    expect(from).toHaveAttribute('readonly');
    // Human-readable display instead of the raw ISO value.
    expect(from).toHaveValue('Sep 1, 2026');
    unmount();
    renderWithProviders(
      <DateTimeField mode="time" label="At" value="14:30" onChange={noop} />,
    );
    const at = screen.getByLabelText('At') as HTMLInputElement;
    expect(at).toHaveAttribute('type', 'text');
    expect(at).toHaveValue('14:30');
  });

  it('picks a date from the custom calendar (date mode)', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <DateTimeField mode="date" label="From" value="" onChange={onChange} />,
    );
    await user.click(screen.getByLabelText('From'));
    const dialog = await screen.findByRole('dialog', { name: 'From picker' });
    expect(dialog).toBeInTheDocument();
    // No native date input anywhere.
    expect(dialog.querySelector('input[type="date"]')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Today' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBe(format(new Date(), 'yyyy-MM-dd'));
  });

  it('picks hour + minute from custom columns (time mode)', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <DateTimeField mode="time" label="At" value="" onChange={onChange} />,
    );
    await user.click(screen.getByLabelText('At'));
    await screen.findByRole('dialog', { name: 'At picker' });
    await user.click(screen.getByRole('option', { name: '30 minutes' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith('12:30');
  });

  it('combines calendar and time columns (datetime mode)', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <DateTimeField mode="datetime" label="When" value="" onChange={onChange} />,
    );
    await user.click(screen.getByLabelText('When'));
    const dialog = await screen.findByRole('dialog', { name: 'When picker' });
    expect(within(dialog).getByRole('grid', { name: 'Choose a date' })).toBeInTheDocument();
    expect(within(dialog).getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Today' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith(`${format(new Date(), 'yyyy-MM-dd')}T12:00`);
  });

  it('picks a start and end date (range mode)', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <DateTimeField mode="range" label="Period" value={{ start: '', end: '' }} onChange={onChange} />,
    );
    const input = screen.getByLabelText('Period') as HTMLInputElement;
    expect(input).toHaveAttribute('placeholder', 'Select start – end');
    await user.click(input);
    await screen.findByRole('dialog', { name: 'Period picker' });
    const todayLabel = format(new Date(), 'EEEE, MMMM d, yyyy');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowLabel = format(tomorrow, 'EEEE, MMMM d, yyyy');
    await user.click(screen.getByRole('gridcell', { name: todayLabel }));
    await user.click(screen.getByRole('gridcell', { name: tomorrowLabel }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({
      start: format(new Date(), 'yyyy-MM-dd'),
      end: format(tomorrow, 'yyyy-MM-dd'),
    });
  });

  it('clears the value with one click', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <DateTimeField mode="date" label="From" value="2026-09-01" onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: 'Clear value' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('respects min/max by disabling out-of-range days', async () => {
    const user = userEvent.setup();
    const noop = () => {};
    renderWithProviders(
      <DateTimeField mode="date" label="From" value="" onChange={noop} min="2026-09-10" max="2026-09-20" />,
    );
    await user.click(screen.getByLabelText('From'));
    await screen.findByRole('dialog', { name: 'From picker' });
    // Navigate the calendar to September 2026.
    await user.click(screen.getByLabelText('Year'));
    await user.click(await screen.findByRole('option', { name: '2026' }));
    const before = screen.getByRole('gridcell', { name: 'Wednesday, September 9, 2026' });
    const inside = screen.getByRole('gridcell', { name: 'Thursday, September 10, 2026' });
    expect(before).toBeDisabled();
    expect(inside).toBeEnabled();
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
