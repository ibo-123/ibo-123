/* eslint-disable react-refresh/only-export-components */
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

export const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ')

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  variant?: 'primary' | 'secondary'
  loading?: boolean
}

export const Button = ({ children, className, variant = 'primary', loading, disabled, ...props }: ButtonProps) => (
  <button
    className={cx('button', variant === 'secondary' && 'secondary', className)}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <LoaderCircle className="spin" size={16} /> : children}
  </button>
)

export const Card = ({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) => <section className={`card ${className}`} style={style}>{children}</section>

export const Badge = ({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'green' | 'red' | 'gold' | 'muted' }) => (
  <span className={`badge ${tone}`}>{children}</span>
)

export const LoadingState = ({ label = 'Loading tournament data...' }: { label?: string }) => (
  <div className="state"><LoaderCircle className="spin" size={22} />{label}</div>
)

export const EmptyState = ({ label }: { label: string }) => <div className="state">{label}</div>

export const ErrorState = ({ error }: { error: string }) => <div className="state error">{error}</div>
