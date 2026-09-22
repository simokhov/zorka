export function formatCatchCount(count: number): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return `${count} поимок`;
  }
  const mod10 = count % 10;
  if (mod10 === 1) {
    return `${count} поимка`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} поимки`;
  }
  return `${count} поимок`;
}
