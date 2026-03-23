import { ProviderColors } from '../theme/colors';
import { ProviderLevel } from '../database/types';

export function getProviderColor(level: string): string {
  return (ProviderColors as Record<string, string>)[level] || ProviderColors.All;
}

export function getProviderLabel(level: string): string {
  const labels: Record<string, string> = {
    EMT: 'EMT',
    AEMT: 'AEMT',
    Paramedic: 'MEDIC',
    CCP: 'CCP',
    All: 'ALL',
  };
  return labels[level] || level;
}

/**
 * Filter provider levels to unique, display-worthy values
 */
export function displayProviderLevels(levels: string[]): string[] {
  if (levels.includes('All')) return ['All'];
  const order: ProviderLevel[] = ['EMT', 'AEMT', 'Paramedic', 'CCP'];
  return order.filter(l => levels.includes(l));
}
