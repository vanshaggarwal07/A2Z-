export interface PassportNode {
  owner_alias: string
  owned_from: string
  owned_until: string | null
  condition_at_transfer: string
  grade_at_transfer: string
  reason_for_transfer: string
  is_original_purchase: boolean
}

export function getOwnershipDuration(from: string, until: string | null): string {
  if (!until) return 'Current owner'
  // Simple human-readable duration
  const months = monthsBetween(from, until)
  if (months < 1) return 'Less than a month'
  if (months < 12) return `${months} month${months > 1 ? 's' : ''}`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${years} year${years > 1 ? 's' : ''}`
  return `${years}y ${rem}m`
}

function monthsBetween(from: string, until: string): number {
  // Parse "Mon YYYY" format
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }
  const parts1 = from.split(' ')
  const parts2 = until.split(' ')
  if (parts1.length < 2 || parts2.length < 2) return 6 // fallback
  const d1 = new Date(parseInt(parts1[1]), months[parts1[0]] ?? 0)
  const d2 = new Date(parseInt(parts2[1]), months[parts2[0]] ?? 0)
  return Math.max(0, (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()))
}

export function buildPassportChain(nodes: PassportNode[]): PassportNode[] {
  return nodes.sort((a, b) => {
    if (a.is_original_purchase) return -1
    if (b.is_original_purchase) return 1
    return 0
  })
}
