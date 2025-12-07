export function convertMinutes(minutes: number): string {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (mins > 0) parts.push(`${mins} minute${mins !== 1 ? 's' : ''}`);

  return parts.length > 0 ? parts.join(', ') : '0 minutes';
}

export function combineStrings(strings: string[]): string {
  if (strings.length === 0) return '';
  if (strings.length === 1) return strings[0];
  if (strings.length === 2) return `${strings[0]} and ${strings[1]}`;

  const lastString = strings[strings.length - 1];
  const otherStrings = strings.slice(0, -1).join(', ');
  return `${otherStrings}, and ${lastString}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function parseDuration(duration: string): number {
  // Parse ISO 8601 duration format (e.g., PT1H30M)
  const regex = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) return 3600000; // Default 1 hour in milliseconds

  const days = parseInt(matches[1] || '0', 10);
  const hours = parseInt(matches[2] || '0', 10);
  const minutes = parseInt(matches[3] || '0', 10);
  const seconds = parseInt(matches[4] || '0', 10);

  return (days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000;
}
