import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

export function Button({ className = '', variant = 'primary', loading, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; loading?: boolean }) {
  const styles = { primary: 'bg-primary text-primary-foreground hover:brightness-105 shadow-sm', secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/75', quiet: 'text-muted-foreground hover:text-foreground hover:bg-muted', danger: 'bg-destructive/10 text-destructive hover:bg-destructive/15' };
  return <button {...props} disabled={props.disabled || loading} className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`}>{loading && <LoaderCircle size={16} className="animate-spin" />}{children}</button>;
}
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold text-foreground"><span>{label}</span>{children}{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>;
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`h-11 w-full rounded-lg border bg-card px-3.5 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 ${props.className ?? ''}`} />; }
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={`min-h-32 w-full resize-y rounded-lg border bg-card px-3.5 py-3 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 ${props.className ?? ''}`} />; }
export function Badge({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'amber' | 'green' | 'gray' | 'red' }) {
  const colors = { blue: 'bg-primary/10 text-primary', amber: 'bg-accent/20 text-accent-foreground', green: 'bg-emerald-100 text-emerald-800', gray: 'bg-muted text-muted-foreground', red: 'bg-destructive/10 text-destructive' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[tone]}`}>{children}</span>;
}
export function Card({ className = '', children }: { className?: string; children: ReactNode }) { return <section className={`rounded-xl border bg-card panel-shadow ${className}`}>{children}</section>; }
export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <div className="mono mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary/75">{eyebrow}</div>}<h1 className="text-2xl font-extrabold tracking-[-.04em] text-foreground sm:text-3xl">{title}</h1>{description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}</div>{action}</div>;
}
export function EmptyState({ title, description, icon }: { title: string; description: string; icon: ReactNode }) { return <div className="flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">{icon}</div><h3 className="font-bold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p></div>; }
export function Skeleton({ className = '' }: { className?: string }) { return <div className={`animate-pulse rounded-lg bg-secondary/70 ${className}`} />; }