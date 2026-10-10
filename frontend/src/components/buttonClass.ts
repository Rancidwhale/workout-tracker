// Shared button styles, usable on <button> and on router <Link>s.
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'border border-border bg-surface text-text hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-text',
  danger: 'border border-border bg-surface text-danger hover:bg-danger-bg',
}

export function buttonClass(variant: ButtonVariant = 'primary', extra = '') {
  return [
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium',
    'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'disabled:cursor-not-allowed disabled:opacity-50',
    buttonVariants[variant],
    extra,
  ].join(' ')
}
