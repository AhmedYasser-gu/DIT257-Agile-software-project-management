export default function isoToDate(isoString: string): string {
    const date = new Date(isoString);
  
    // Format in Swedish timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Stockholm',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
  
    const formatter = new Intl.DateTimeFormat('sv-SE', options);
    const parts = formatter.formatToParts(date);
  
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  
    const year = get('year');
    const month = get('month');
    const day = get('day');
    const hour = get('hour');
    const minute = get('minute');
  
    // Get current Swedish time for comparison
    const now = new Date();
    const nowParts = formatter.formatToParts(now);
    const currentYear = nowParts.find(p => p.type === 'year')?.value;
  
    const isSameYear = year === currentYear;
  
    // Build formatted output: always show date, but drop year if same year
    const datePart = isSameYear ? `${month}/${day}` : `${year}/${month}/${day}`;
    const timePart = `${hour}:${minute}`;
  
    return `${datePart} ${timePart}`;
  }
  