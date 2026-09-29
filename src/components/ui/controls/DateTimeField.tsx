'use client';

import { useId, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Popover,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  type TextFieldProps,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ClearIcon from '@mui/icons-material/Clear';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  getHours,
  getMinutes,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { mercatoTokens } from '@/lib/theme';

export type DateTimeMode = 'date' | 'time' | 'datetime' | 'range';

export interface DateRangeValue {
  start: string;
  end: string;
}

/** ISO value formatters for the matching mode (safe under TZ=UTC). */
export const toDateInput = (iso: string) => format(parseISO(iso), 'yyyy-MM-dd');
export const toTimeInput = (iso: string) => format(parseISO(iso), 'HH:mm');
export const toDateTimeInput = (iso: string) => format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");

interface CommonProps {
  /** Calm guidance shown when there is no error. */
  hint?: string;
  /** Earliest selectable value (`yyyy-MM-dd` for date/range, `HH:mm` for time, `yyyy-MM-dd'T'HH:mm` for datetime). */
  min?: string;
  /** Latest selectable value (same shape as `min`). */
  max?: string;
  /** Disable every day before today (date/datetime/range). */
  disablePast?: boolean;
  /** Disable every day after today (date/datetime/range). */
  disableFuture?: boolean;
  /** Minute granularity for the time columns (default 5). */
  timeStep?: number;
  /** Show 12-hour clock with AM/PM instead of 24-hour (default false). Storage stays `HH:mm`. */
  use12Hour?: boolean;
  /** Show the inline clear (X) button when a value is set (default true). */
  clearable?: boolean;
}

type SingleProps = CommonProps & {
  /** Pick exactly what the user may enter: date only, time only, or both. */
  mode: 'date' | 'time' | 'datetime';
  /** Same string shape as before (`yyyy-MM-dd`, `HH:mm`, `yyyy-MM-dd'T'HH:mm`). */
  value: string;
  onChange: (value: string) => void;
};

type RangeProps = CommonProps & {
  /** Pick a start and an end date (`{ start, end }`, each `yyyy-MM-dd`). */
  mode: 'range';
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
};

export type DateTimeFieldProps = Omit<
  TextFieldProps,
  'type' | 'value' | 'onChange' | 'defaultValue'
> &
  (SingleProps | RangeProps);

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => format(d, 'yyyy-MM-dd');
const fmtTime = (h: number, m: number) => `${pad(h)}:${pad(m)}`;

function parseDay(s: string): Date | null {
  if (!s) return null;
  const d = parse(s, 'yyyy-MM-dd', new Date());
  return isValid(d) ? startOfDay(d) : null;
}

function parseDayTime(s: string): Date | null {
  if (!s) return null;
  const d = parse(s, "yyyy-MM-dd'T'HH:mm", new Date());
  return isValid(d) ? d : null;
}

function parseClock(s: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isRangeMode(props: SingleProps | RangeProps): props is RangeProps {
  return props.mode === 'range';
}

/**
 * Fully custom date/time/range picker — no native `<input type="date">`
 * popup. The text field is read-only; clicking it (or the calendar/clock
 * icon) opens a themed calendar and/or time columns in a popover:
 * `date` → calendar, `time` → hour/minute columns, `datetime` → both,
 * `range` → start/end calendar with hover preview + Apply/Clear footer.
 */
export function DateTimeField(props: DateTimeFieldProps) {
  const {
    mode,
    hint,
    min,
    max,
    disablePast,
    disableFuture,
    timeStep = 5,
    use12Hour = false,
    clearable = true,
    size = 'small',
    helperText,
    disabled,
    label,
    placeholder,
    slotProps,
    value: _rawValue,
    onChange: _rawOnChange,
    ...rest
  } = props as DateTimeFieldProps & { value: string | DateRangeValue };

  void _rawValue;
  void _rawOnChange;

  const single = !isRangeMode(props as SingleProps | RangeProps);
  const singleValue = (single ? (props as SingleProps).value : '') as string;
  const rangeValue = useMemo<DateRangeValue>(
    () => (isRangeMode(props) ? props.value : { start: '', end: '' }),
    [props],
  );
  const handleSingle = single ? (props as SingleProps).onChange : () => {};
  const handleRange = !single ? (props as RangeProps).onChange : () => {};

  const popId = useId();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = anchor != null;

  // Pending (draft) state — initialised lazily when the popover opens.
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [day, setDay] = useState<Date | null>(null);
  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [hoverDay, setHoverDay] = useState<Date | null>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const minDay = useMemo(() => {
    if (mode === 'time') return null;
    if (mode === 'datetime') return parseDayTime(min ?? '') ?? parseDay(min ?? '');
    return parseDay(min ?? '');
  }, [min, mode]);
  const maxDay = useMemo(() => {
    if (mode === 'time') return null;
    if (mode === 'datetime') return parseDayTime(max ?? '') ?? parseDay(max ?? '');
    return parseDay(max ?? '');
  }, [max, mode]);
  const minClock = mode === 'time' ? parseClock(min ?? '') : null;
  const maxClock = mode === 'time' ? parseClock(max ?? '') : null;

  const today = useMemo(() => startOfDay(new Date()), []);

  const dayDisabled = (d: Date): boolean => {
    const t = startOfDay(d);
    if (disablePast && isBefore(t, today)) return true;
    if (disableFuture && isAfter(t, today)) return true;
    if (minDay && isBefore(t, startOfDay(minDay))) return true;
    if (maxDay && isAfter(t, startOfDay(maxDay))) return true;
    return false;
  };

  const clockDisabled = (h: number, m: number): boolean => {
    if (minClock && (h < minClock.h || (h === minClock.h && m < minClock.m))) return true;
    if (maxClock && (h > maxClock.h || (h === maxClock.h && m > maxClock.m))) return true;
    return false;
  };

  const openFrom = (el: HTMLElement) => {
    if (mode === 'date') {
      const d = parseDay(singleValue);
      setDay(d);
      setViewDate(d ?? new Date());
    } else if (mode === 'datetime') {
      const d = parseDayTime(singleValue);
      setDay(d ? startOfDay(d) : null);
      setViewDate(d ?? new Date());
      const c = parseClock(singleValue.slice(11) || '');
      const h = d ? getHours(d) : (c?.h ?? 12);
      const m = d ? getMinutes(d) : (c?.m ?? 0);
      setHour(h);
      setMinute(m - (m % timeStep));
      setPeriod(h >= 12 ? 'PM' : 'AM');
    } else if (mode === 'time') {
      const c = parseClock(singleValue) ?? { h: 12, m: 0 };
      setHour(c.h);
      setMinute(c.m - (c.m % timeStep));
      setPeriod(c.h >= 12 ? 'PM' : 'AM');
    } else {
      const s = parseDay(rangeValue.start);
      const e = parseDay(rangeValue.end);
      setRangeStart(s);
      setRangeEnd(e);
      setHoverDay(null);
      setViewDate(s ?? e ?? new Date());
    }
    setAnchor(el);
  };

  const close = () => {
    setAnchor(null);
    setHoverDay(null);
  };

  const apply = () => {
    if (mode === 'date') {
      handleSingle(day ? fmtDate(day) : '');
    } else if (mode === 'time') {
      handleSingle(fmtTime(hour, minute));
    } else if (mode === 'datetime') {
      handleSingle(day ? `${fmtDate(day)}T${fmtTime(hour, minute)}` : '');
    } else {
      if (rangeStart && rangeEnd) {
        const [s, e] = isAfter(rangeStart, rangeEnd) ? [rangeEnd, rangeStart] : [rangeStart, rangeEnd];
        handleRange({ start: fmtDate(s), end: fmtDate(e) });
      } else {
        handleRange({ start: '', end: '' });
      }
    }
    close();
  };

  const clear = () => {
    if (single) handleSingle('');
    else handleRange({ start: '', end: '' });
    setDay(null);
    setRangeStart(null);
    setRangeEnd(null);
    setHoverDay(null);
    close();
  };

  const hasValue = single ? singleValue !== '' : rangeValue.start !== '' || rangeValue.end !== '';

  const display = useMemo(() => {
    if (mode === 'date') {
      const d = parseDay(singleValue);
      return d ? format(d, 'MMM d, yyyy') : '';
    }
    if (mode === 'time') {
      const c = parseClock(singleValue);
      if (!c) return '';
      if (!use12Hour) return fmtTime(c.h, c.m);
      const p = c.h >= 12 ? 'PM' : 'AM';
      const h12 = c.h % 12 === 0 ? 12 : c.h % 12;
      return `${h12}:${pad(c.m)} ${p}`;
    }
    if (mode === 'datetime') {
      const d = parseDayTime(singleValue);
      if (!d) return '';
      const datePart = format(d, 'MMM d, yyyy');
      const h = getHours(d);
      const m = getMinutes(d);
      const timePart = use12Hour
        ? `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`
        : fmtTime(h, m);
      return `${datePart} · ${timePart}`;
    }
    const s = parseDay(rangeValue.start);
    const e = parseDay(rangeValue.end);
    if (s && e) {
      return isSameMonth(s, e)
        ? `${format(s, 'MMM d')} – ${format(e, 'd, yyyy')}`
        : `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
    }
    if (s) return `${format(s, 'MMM d, yyyy')} – …`;
    return '';
  }, [mode, singleValue, rangeValue, use12Hour]);

  const defaultPlaceholder =
    mode === 'date' ? 'Select date'
    : mode === 'time' ? 'Select time'
    : mode === 'datetime' ? 'Select date & time'
    : 'Select start – end';

  const ModeIcon = mode === 'time' ? AccessTimeIcon : mode === 'range' ? DateRangeIcon : CalendarMonthIcon;
  const dialogLabel = typeof label === 'string' ? `${label} picker` : 'Date and time picker';

  const yearOptions = useMemo(() => {
    const viewYear = viewDate.getFullYear();
    const lo = minDay ? minDay.getFullYear() : viewYear - 80;
    const hi = maxDay ? maxDay.getFullYear() : viewYear + 20;
    const years: number[] = [];
    for (let y = Math.min(lo, hi); y <= Math.max(lo, hi); y += 1) years.push(y);
    return years;
  }, [minDay, maxDay, viewDate]);

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
    const days: Date[] = [];
    let cur = start;
    while (!isAfter(cur, end)) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    return days;
  }, [viewDate]);

  const inRangePreview = (d: Date): boolean => {
    if (mode !== 'range') return false;
    const t = startOfDay(d).getTime();
    if (rangeStart && rangeEnd) {
      const lo = Math.min(rangeStart.getTime(), rangeEnd.getTime());
      const hi = Math.max(rangeStart.getTime(), rangeEnd.getTime());
      return t >= lo && t <= hi;
    }
    if (rangeStart && hoverDay) {
      const lo = Math.min(rangeStart.getTime(), startOfDay(hoverDay).getTime());
      const hi = Math.max(rangeStart.getTime(), startOfDay(hoverDay).getTime());
      return t >= lo && t <= hi;
    }
    return false;
  };

  const isEndpoint = (d: Date): boolean =>
    mode === 'range' &&
    ((rangeStart != null && isSameDay(d, rangeStart)) || (rangeEnd != null && isSameDay(d, rangeEnd)));

  const pickDay = (d: Date) => {
    if (dayDisabled(d)) return;
    if (mode === 'range') {
      const t = startOfDay(d);
      if (rangeStart == null || (rangeStart != null && rangeEnd != null)) {
        setRangeStart(t);
        setRangeEnd(null);
      } else {
        setRangeEnd(t);
      }
      return;
    }
    setDay(startOfDay(d));
  };

  const hours = useMemo(() => {
    if (!use12Hour) return Array.from({ length: 24 }, (_, h) => h);
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, [use12Hour]);

  const minutes = useMemo(() => {
    const step = Math.max(1, Math.min(30, Math.floor(timeStep) || 5));
    const out: number[] = [];
    for (let m = 0; m < 60; m += step) out.push(m);
    return out;
  }, [timeStep]);

  const shownHour = (h: number) => (use12Hour ? (h % 12 === 0 ? 12 : h % 12) : h);

  const chooseHour = (h12or24: number) => {
    if (use12Hour) {
      const base = h12or24 % 12;
      setHour(period === 'AM' ? base : base + 12);
    } else {
      setHour(h12or24);
    }
  };

  const applyDisabled =
    mode === 'date' ? day == null
    : mode === 'range' ? rangeStart == null || rangeEnd == null
    : false;

  const showCalendar = mode !== 'time';
  const showTime = mode === 'time' || mode === 'datetime';

  const scrollActiveIntoView = (ref: React.RefObject<HTMLDivElement | null>) => {
    const el = ref.current?.querySelector('[aria-selected="true"]');
    if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  return (
    <>
      <TextField
        label={label}
        value={display}
        placeholder={placeholder ?? defaultPlaceholder}
        size={size}
        helperText={helperText ?? hint}
        disabled={disabled}
        onClick={(e) => {
          if (!disabled) openFrom(e.currentTarget as unknown as HTMLElement);
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && anchor == null) {
            e.preventDefault();
            openFrom(e.currentTarget as unknown as HTMLElement);
          }
        }}
        slotProps={{
          ...slotProps,
          htmlInput: { readOnly: true, 'aria-readonly': true, ...(slotProps?.htmlInput as object | undefined) },
          inputLabel: { ...slotProps?.inputLabel, shrink: true },
          input: {
            ...(slotProps?.input as object | undefined),
            sx: {
              cursor: disabled ? undefined : 'pointer',
              ...(((slotProps?.input as { sx?: object } | undefined)?.sx) ?? {}),
            },
            endAdornment: (
              <InputAdornment position="end" sx={{ gap: 0.25 }}>
                {clearable && hasValue && !disabled ? (
                  <IconButton
                    size="small"
                    edge="end"
                    aria-label="Clear value"
                    onClick={(e) => {
                      e.stopPropagation();
                      clear();
                    }}
                    sx={{ transition: 'color 200ms, background-color 200ms' }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ) : null}
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={`Open ${dialogLabel}`}
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    const root = (e.currentTarget as HTMLElement).closest('.MuiTextField-root') as HTMLElement | null;
                    openFrom(root ?? (e.currentTarget as HTMLElement));
                  }}
                  sx={{ transition: 'color 200ms, background-color 200ms' }}
                >
                  <ModeIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        {...rest}
      />
      <Popover
        id={open ? popId : undefined}
        open={open}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        transitionDuration={reduceMotion ? 0 : undefined}
        slotProps={{ paper: { role: 'dialog', 'aria-label': dialogLabel } as object }}
        onTransitionEnter={() => {
          scrollActiveIntoView(hourListRef);
          scrollActiveIntoView(minuteListRef);
        }}
      >
        <Box sx={{ p: 1.5, minWidth: showCalendar && showTime ? 440 : 300, maxWidth: 'calc(100vw - 32px)' }}>
          {showCalendar ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <IconButton
                  size="small"
                  aria-label="Previous month"
                  onClick={() => setViewDate((v) => subMonths(v, 1))}
                  sx={{ transition: 'color 200ms, background-color 200ms' }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Select
                  size="small"
                  value={viewDate.getMonth()}
                  onChange={(e) => setViewDate((v) => {
                    const next = new Date(v);
                    next.setMonth(Number(e.target.value));
                    return next;
                  })}
                  aria-label="Month"
                  sx={{ flex: 1, fontSize: '0.84rem', fontWeight: 700 }}
                >
                  {MONTHS.map((m, i) => (
                    <MenuItem key={m} value={i}>{m}</MenuItem>
                  ))}
                </Select>
                <Select
                  size="small"
                  value={viewDate.getFullYear()}
                  onChange={(e) => setViewDate((v) => {
                    const next = new Date(v);
                    next.setFullYear(Number(e.target.value));
                    return next;
                  })}
                  aria-label="Year"
                  sx={{ width: 96, fontSize: '0.84rem', fontWeight: 700 }}
                >
                  {yearOptions.map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
                <IconButton
                  size="small"
                  aria-label="Next month"
                  onClick={() => setViewDate((v) => addMonths(v, 1))}
                  sx={{ transition: 'color 200ms, background-color 200ms' }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box role="grid" aria-label={mode === 'range' ? 'Choose start and end dates' : 'Choose a date'}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
                  {WEEKDAYS.map((w) => (
                    <Typography
                      key={w}
                      variant="caption"
                      color="text.secondary"
                      sx={{ textAlign: 'center', fontWeight: 700, fontSize: '0.68rem' }}
                    >
                      {w}
                    </Typography>
                  ))}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                  {weeks.map((d) => {
                    const outside = !isSameMonth(d, viewDate);
                    const dis = dayDisabled(d);
                    const selectedSingle = mode !== 'range' && day != null && isSameDay(d, day);
                    const endpoint = isEndpoint(d);
                    const inRange = inRangePreview(d);
                    const isToday = isSameDay(d, today);
                    return (
                      <ButtonBase
                        key={d.toISOString()}
                        role="gridcell"
                        aria-selected={selectedSingle || endpoint || inRange}
                        aria-label={format(d, 'EEEE, MMMM d, yyyy')}
                        aria-disabled={dis || undefined}
                        disabled={dis}
                        onClick={() => pickDay(d)}
                        onMouseEnter={() => {
                          if (mode === 'range' && rangeStart && !rangeEnd) setHoverDay(d);
                        }}
                        onFocus={() => {
                          if (mode === 'range' && rangeStart && !rangeEnd) setHoverDay(d);
                        }}
                        sx={{
                          height: 34,
                          borderRadius: 1.5,
                          fontSize: '0.8rem',
                          fontWeight: selectedSingle || endpoint ? 800 : 600,
                          cursor: dis ? 'not-allowed' : 'pointer',
                          color: dis ? 'text.disabled' : outside ? 'text.disabled' : 'text.primary',
                          bgcolor:
                            selectedSingle || endpoint
                              ? 'primary.main'
                              : inRange
                                ? mercatoTokens.brandSoft
                                : 'transparent',
                          ...(selectedSingle || endpoint
                            ? { color: '#fff' }
                            : inRange
                              ? { color: 'primary.dark' }
                              : null),
                          ...(!selectedSingle && !endpoint && isToday
                            ? { outline: `1.5px solid ${mercatoTokens.brand}`, outlineOffset: -1.5 }
                            : null),
                          transition: 'background-color 200ms, color 200ms',
                          '&:hover': dis
                            ? undefined
                            : {
                                bgcolor:
                                  selectedSingle || endpoint ? 'primary.dark' : mercatoTokens.brandSoft,
                                color: selectedSingle || endpoint ? '#fff' : 'primary.dark',
                              },
                          '&:focus-visible': {
                            outline: `2px solid ${mercatoTokens.brand}`,
                            outlineOffset: 1,
                          },
                        }}
                      >
                        {format(d, 'd')}
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  onClick={() => {
                    const t = new Date();
                    setViewDate(t);
                    if (mode !== 'range' && !dayDisabled(t)) setDay(startOfDay(t));
                  }}
                >
                  Today
                </Button>
                {mode === 'range' ? (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {rangeStart && !rangeEnd
                      ? `Start ${format(rangeStart, 'MMM d, yyyy')} — pick the end date`
                      : rangeStart && rangeEnd
                        ? `${format(rangeStart, 'MMM d')} – ${format(rangeEnd, 'MMM d, yyyy')}`
                        : 'Pick the start date first'}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          ) : null}

          {showCalendar && showTime ? <Divider sx={{ my: 1.25 }} /> : null}

          {showTime ? (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.75 }}>
                {use12Hour ? 'Time (12-hour)' : 'Time (24-hour)'} · {fmtTime(hour, minute)}
                {use12Hour ? ` ${period}` : ''}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Hour</Typography>
                  <Box
                    ref={hourListRef}
                    role="listbox"
                    aria-label="Hour"
                    sx={{
                      maxHeight: 176,
                      overflowY: 'auto',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      p: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {hours.map((h) => {
                      const h24 = use12Hour ? (period === 'AM' ? h % 12 : (h % 12) + 12) : h;
                      const active = shownHour(hour) === h;
                      const dis = minutes.every((m) => clockDisabled(h24, m));
                      return (
                        <ButtonBase
                          key={h}
                          role="option"
                          aria-selected={active}
                          aria-label={use12Hour ? `${h} o'clock` : `${pad(h)} hours`}
                          disabled={dis}
                          onClick={() => chooseHour(h)}
                          sx={{
                            px: 1,
                            py: 0.6,
                            borderRadius: 1,
                            fontSize: '0.82rem',
                            fontWeight: active ? 800 : 600,
                            textAlign: 'center',
                            cursor: dis ? 'not-allowed' : 'pointer',
                            color: dis ? 'text.disabled' : active ? '#fff' : 'text.primary',
                            bgcolor: active ? 'primary.main' : 'transparent',
                            transition: 'background-color 200ms, color 200ms',
                            '&:hover': dis ? undefined : { bgcolor: active ? 'primary.dark' : mercatoTokens.brandSoft },
                            '&:focus-visible': { outline: `2px solid ${mercatoTokens.brand}`, outlineOffset: 1 },
                          }}
                        >
                          {use12Hour ? h : pad(h)}
                        </ButtonBase>
                      );
                    })}
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Minute</Typography>
                  <Box
                    ref={minuteListRef}
                    role="listbox"
                    aria-label="Minute"
                    sx={{
                      maxHeight: 176,
                      overflowY: 'auto',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      p: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {minutes.map((m) => {
                      const active = minute === m;
                      const dis = clockDisabled(hour, m);
                      return (
                        <ButtonBase
                          key={m}
                          role="option"
                          aria-selected={active}
                          aria-label={`${pad(m)} minutes`}
                          disabled={dis}
                          onClick={() => setMinute(m)}
                          sx={{
                            px: 1,
                            py: 0.6,
                            borderRadius: 1,
                            fontSize: '0.82rem',
                            fontWeight: active ? 800 : 600,
                            textAlign: 'center',
                            cursor: dis ? 'not-allowed' : 'pointer',
                            color: dis ? 'text.disabled' : active ? '#fff' : 'text.primary',
                            bgcolor: active ? 'primary.main' : 'transparent',
                            transition: 'background-color 200ms, color 200ms',
                            '&:hover': dis ? undefined : { bgcolor: active ? 'primary.dark' : mercatoTokens.brandSoft },
                            '&:focus-visible': { outline: `2px solid ${mercatoTokens.brand}`, outlineOffset: 1 },
                          }}
                        >
                          {pad(m)}
                        </ButtonBase>
                      );
                    })}
                  </Box>
                </Box>
                {use12Hour ? (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Period</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {(['AM', 'PM'] as const).map((p) => (
                        <Button
                          key={p}
                          size="small"
                          variant={period === p ? 'contained' : 'outlined'}
                          aria-pressed={period === p}
                          onClick={() => {
                            setPeriod(p);
                            setHour((h) => {
                              const base = h % 12;
                              return p === 'AM' ? base : base + 12;
                            });
                          }}
                        >
                          {p}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                ) : null}
              </Box>
            </Box>
          ) : null}

          <Divider sx={{ my: 1.25 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {clearable ? (
              <Button size="small" color="inherit" onClick={clear} disabled={!hasValue && day == null && rangeStart == null}>
                Clear
              </Button>
            ) : null}
            <Box sx={{ flex: 1 }} />
            <Button size="small" color="inherit" onClick={close}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={apply} disabled={applyDisabled}>
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
