export function formatDuration(minutes: number | null) {
  if (minutes == null) return null;
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${minutes} min`;
}

export function serviceCountLabel(total: number) {
  return total === 1 ? '1 service' : `${total} services`;
}
