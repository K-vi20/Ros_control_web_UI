export type BadgeTone = 'accent' | 'ok' | 'warn' | 'danger' | 'neutral'

interface StatusBadgeProps {
  tone?: BadgeTone
  children: string
}

/** Status is always spelled out in text; the dot colour is only a secondary cue. */
export function StatusBadge({ tone = 'accent', children }: StatusBadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}
