import { ArrowRight, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { Button, Input } from '@/components/ui-kit';

export default function SearchGate() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) return;
    setLoading(true);
    if (normalized === '홍연우 못생김') {
      setLocation('/login');
      return;
    }
    window.location.assign(`https://www.google.com/search?q=${encodeURIComponent(normalized)}`);
  };
  return <div className="min-h-[100dvh] bg-background">
    <header className="mx-auto flex h-20 max-w-[1180px] items-center justify-between px-5 sm:px-8"><Link href="/" className="flex items-center gap-3" data-testid="link-gate-logo"><span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-sm font-extrabold text-primary-foreground">ㄷ</span><span className="font-extrabold tracking-[-.04em]">돼홍존위</span></Link><Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-gate-login">로그인</Link></header>
    <main className="mx-auto flex max-w-[760px] flex-col items-center px-5 pb-20 pt-[13vh] text-center sm:pt-[16vh]">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-extrabold text-primary-foreground shadow-[0_10px_24px_rgba(17,79,130,.22)]">ㄷ</div>
      <h1 className="text-4xl font-extrabold tracking-[-.07em] sm:text-5xl">돼홍존위</h1>
      <p className="mt-3 text-sm text-muted-foreground">공지사항을 검색하세요.</p>
      <form onSubmit={submit} className="mt-9 flex w-full max-w-[620px] gap-2 rounded-xl border bg-card p-2 shadow-[0_9px_30px_rgba(17,53,86,.1)]"><div className="flex flex-1 items-center gap-3 px-3"><Search size={19} className="text-muted-foreground" /><Input aria-label="공지 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색어를 입력하세요" className="h-10 border-0 p-0 shadow-none focus:ring-0" data-testid="input-gate-search" /></div><Button type="submit" disabled={!query.trim()} loading={loading} className="hidden sm:inline-flex" data-testid="button-gate-search">검색</Button><button aria-label="검색" type="submit" disabled={!query.trim()} className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 sm:hidden" data-testid="button-gate-search-mobile"><ArrowRight size={17} /></button></form>
      {loading && <p className="mt-7 text-xs text-muted-foreground">검색 페이지로 이동하는 중입니다.</p>}
    </main>
  </div>;
}