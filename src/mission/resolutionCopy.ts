export function resolutionTitleFor(
  actionType: import('@/engine/types').ActionType,
): string {
  const map: Partial<Record<import('@/engine/types').ActionType, string>> = {
    recon: 'INTEL CONFIRMED',
    adapt: 'PLAN UPDATED',
    repair: 'REPAIR UNDERWAY',
    reroute: 'NEW ROUTE',
    hold: 'POSITION HELD',
    ask: 'SIGNAL SENT',
    build: 'STRUCTURE SET',
    retreat: 'WITHDRAWING',
    move: 'POSITION UPDATED',
    continue: 'OBJECTIVE UPDATED',
  }
  return map[actionType] ?? 'PLAN UPDATED'
}
