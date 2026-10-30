export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthDays(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const startDay = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const dayValue = i - startDay + 1;
    const currentDate = new Date(year, monthIndex, dayValue);

    cells.push({
      key: formatDateKey(currentDate),
      day: currentDate.getDate(),
      inCurrentMonth: currentDate.getMonth() === monthIndex
    });
  }

  return cells;
}

export function getMonthTitle(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function getPastDays(count = 7) {
  const days = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      date: formatDateKey(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short' })
    });
  }
  return days;
}

export function getRelativeDateLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}
