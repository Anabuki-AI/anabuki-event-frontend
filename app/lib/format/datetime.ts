// Dates from the backend are ISO 8601 UTC. Every portal shows them in Japan
// time because the event is operated domestically.
export function formatJapanDateTime(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value))
}
