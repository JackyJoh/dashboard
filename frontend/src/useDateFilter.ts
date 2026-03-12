import { useMemo } from 'react';
import usePersistedState from './usePersistedState';

export type DateRange = '3M' | '6M' | '1Y' | 'All';

export function filterByRange<T extends { date: string }>(data: T[], range: DateRange): T[] {
  if (range === 'All' || !data.length) return data;
  const months = range === '3M' ? 3 : range === '6M' ? 6 : 12;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return data.filter(d => new Date(d.date) >= cutoff);
}

export function useDateFilter<T extends { date: string }>(data: T[]) {
  const [range, setRange] = usePersistedState<DateRange>('nch-date-range', 'All');
  const filteredData = useMemo(() => filterByRange(data, range), [data, range]);
  return { filteredData, range, setRange };
}
