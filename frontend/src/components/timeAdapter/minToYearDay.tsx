export default function formatTimeRemaining(m: number): string {
    const days = Math.floor(m / 1440); // 60 * 24
    const hours = Math.floor((m % 1440) / 60);
    const minutes = m % 60;
  
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  }
  