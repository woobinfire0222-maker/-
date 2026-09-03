import { Link, useLocation } from 'wouter';
import { Bell, ChevronDown, Coins, FileText, Home, LogOut, Menu, MessageCircle, Settings, ShieldCheck, Siren, TrendingUp, UserRound, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { getNotifications, signOut, subscribeToTable, type Profile } from '@/lib/data-services';

const navItems = [
  { href: '/app', label: '홈', icon: Home },
  { href: '/app/notices', label: '공지사항', icon: FileText },
  { href: '/app/chat', label: '단체 채팅', icon: MessageCircle },
  { href: '/app/meetings', label: '긴급회의', icon: Siren },
  { href: '/app/stocks', label: '주식', icon: TrendingUp },
  { href: '/app/notifications', label: '알림', icon: Bell },
  { href: '/app/profile', label: '회원 정보', icon: UserRound },
];

export function AppShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const isAdmin = profile.role === 'admin';
  const [unreadCount, setUnreadCount] = useState(0);
  const current = navItems.find((item) => location === item.href || (item.href !== '/app' && location.startsWith(item.href)));
  const navigate = (href: string) => { setLocation(href); setOpen(false); };
  useEffect(() => {
    let mounted = true;
    getNotifications().then((items) => { if (mounted) setUnreadCount(items.filter((item) => !item.read_at).length); }).catch(() => undefined);
    const unsubscribe = subscribeToTable('notifications', (payload) => {
      if (payload.eventType === 'INSERT' && String(payload.new.user_id) === profile.id) setUnreadCount((count) => count + 1);
      if (payload.eventType === 'UPDATE' && String(payload.new.user_id) === profile.id && payload.new.read_at) setUnreadCount((count) => Math.max(0, count - 1));
    }, `user_id=eq.${profile.id}`);
    return () => { mounted = false; unsubscribe(); };
  }, [profile.id]);
  return <div className="min-h-[100dvh] bg-background">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r bg-card transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[74px] items-center justify-between border-b px-6">
        <Link href="/app" className="flex items-center gap-3" data-testid="link-sidebar-home">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-sm font-extrabold text-primary-foreground">ㄷ</span>
          <span><strong className="block text-[15px] font-extrabold tracking-[-.04em]">돼홍존위</strong><small className="block text-[10px] font-semibold tracking-[.08em] text-muted-foreground">회원위원회 운영실</small></span>
        </Link>
        <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setOpen(false)} data-testid="button-close-sidebar"><X size={18} /></button>
      </div>
      <div className="px-4 pt-7">
        <div className="mb-3 px-3 text-[10px] font-bold tracking-[.15em] text-muted-foreground">메뉴</div>
        <nav className="grid gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = current?.href === href;
            return <Link key={href} href={href} onClick={() => setOpen(false)} className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid={`link-nav-${href.split('/').pop()}`}>
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} /><span>{label}</span>{label === '알림' && unreadCount > 0 && <span className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] ${active ? 'bg-primary-foreground/20' : 'bg-accent text-accent-foreground'}`}>{unreadCount}</span>}
            </Link>;
          })}
          {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${location === '/admin' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid="link-nav-admin"><ShieldCheck size={18} /><span>관리자</span><span className="ml-auto rounded bg-accent/25 px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">ADMIN</span></Link>}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="rounded-xl border bg-secondary/60 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>내 코인</span><Coins size={15} className="text-accent-foreground" /></div>
          <div className="flex items-end justify-between"><span className="mono text-xl font-bold text-foreground">{profile.coin_balance.toLocaleString()}</span><span className="mb-0.5 text-xs text-muted-foreground">COIN</span></div>
        </div>
        <button className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" onClick={async () => { await signOut(); navigate('/'); }} data-testid="button-logout"><LogOut size={17} />로그아웃</button>
      </div>
    </aside>
    {open && <button aria-label="메뉴 닫기" className="fixed inset-0 z-30 bg-foreground/25 lg:hidden" onClick={() => setOpen(false)} data-testid="button-overlay-close" />}
    <main className="min-h-[100dvh] lg:pl-[264px]">
      <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b bg-background/90 px-5 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setOpen(true)} data-testid="button-open-sidebar"><Menu size={20} /></button><div className="text-sm font-bold lg:hidden">돼홍존위</div><div className="hidden text-sm text-muted-foreground sm:block"><span className="text-primary">운영실</span><span className="mx-2 text-border">/</span>{current?.label ?? '홈'}</div></div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/app/notifications" className="relative rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="link-header-notifications"><Bell size={19} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" /></Link>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <Link href="/app/profile" className="flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-muted" data-testid="link-header-profile"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{profile.display_name.slice(0, 1)}</span><span className="hidden text-left sm:block"><strong className="block text-xs font-bold">{profile.display_name}</strong><small className="block text-[10px] text-muted-foreground">{isAdmin ? '관리자' : '회원'}</small></span><ChevronDown size={14} className="hidden text-muted-foreground sm:block" /></Link>
        </div>
      </header>
      <div className="app-grid min-h-[calc(100dvh-74px)] px-5 py-7 pb-24 sm:px-8 sm:py-9 lg:px-12 lg:pb-12">{children}</div>
    </main>
    <nav className="fixed inset-x-3 bottom-3 z-30 flex h-16 items-center justify-around rounded-2xl border bg-card/95 px-1 shadow-[0_12px_35px_rgba(17,53,86,.16)] backdrop-blur lg:hidden">
      {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex min-w-[52px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold ${current?.href === href ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`} data-testid={`link-mobile-${href.split('/').pop()}`}><Icon size={18} /><span>{label}</span></Link>)}
    </nav>
  </div>;
}

export function AuthFrame({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return <div className="min-h-[100dvh] bg-background app-grid"><div className="mx-auto flex min-h-[100dvh] max-w-[1180px] flex-col px-5 py-6 sm:px-8"><Link href="/" className="flex w-fit items-center gap-3" data-testid="link-auth-logo"><span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-sm font-extrabold text-primary-foreground">ㄷ</span><span className="font-extrabold tracking-[-.04em]">돼홍존위</span></Link><div className="flex flex-1 items-center justify-center py-12"><div className="w-full max-w-[420px]"><div className="mb-8"><p className="mono mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-primary">MEMBER ACCESS</p><h1 className="text-3xl font-extrabold tracking-[-.05em]">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p></div>{children}</div></div><p className="text-center text-xs text-muted-foreground">돼홍존위 · 회원위원회 운영실</p></div></div>;
}