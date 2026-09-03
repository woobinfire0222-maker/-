import { Camera, Mic, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { Input } from '@/components/ui-kit';

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
  return <div className="flex min-h-[100dvh] flex-col bg-white text-[#202124]">
    <header className="flex h-16 items-center justify-end gap-5 px-5 text-[13px] sm:px-7">
      <a href="https://mail.google.com" className="hidden text-[#202124] hover:underline sm:inline" rel="noreferrer">Gmail</a>
      <a href="https://images.google.com" className="hidden text-[#202124] hover:underline sm:inline" rel="noreferrer">이미지</a>
      <Link href="/login" className="rounded-md bg-[#1a73e8] px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-[#185abc] focus-visible:outline-[#1a73e8]" data-testid="link-gate-login">로그인</Link>
    </header>
    <main className="flex flex-1 flex-col items-center px-5 pt-[18vh] text-center sm:pt-[20vh]">
      <Link href="/" aria-label="돼홍존위 홈" className="select-none text-[46px] font-medium tracking-[-.09em] sm:text-[76px]" data-testid="link-gate-logo">
        <span className="text-[#4285f4]">돼</span><span className="text-[#ea4335]">홍</span><span className="text-[#fbbc05]">존</span><span className="text-[#4285f4]">위</span>
      </Link>
      <p className="mt-3 text-sm text-[#5f6368]">공지사항을 검색하세요.</p>
      <form id="gate-search" onSubmit={submit} className="mt-7 flex h-12 w-full max-w-[584px] items-center rounded-full border border-[#dfe1e5] px-4 transition hover:shadow-[0_1px_6px_rgba(32,33,36,.18)] focus-within:shadow-[0_1px_6px_rgba(32,33,36,.18)]">
        <Search size={19} strokeWidth={2} className="mr-3 shrink-0 text-[#9aa0a6]" />
        <Input aria-label="공지 검색" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색어를 입력하세요" className="h-full border-0 bg-transparent p-0 text-[16px] text-[#202124] shadow-none focus:border-0 focus:ring-0" data-testid="input-gate-search" />
        <button type="button" aria-label="음성 검색" className="ml-3 hidden shrink-0 text-[#4285f4] hover:text-[#185abc] sm:block"><Mic size={19} /></button>
        <button type="button" aria-label="이미지로 검색" className="ml-4 hidden shrink-0 text-[#4285f4] hover:text-[#185abc] sm:block"><Camera size={19} /></button>
      </form>
      <div className="mt-7 flex items-center justify-center gap-3">
        <button type="submit" form="gate-search" disabled={!query.trim() || loading} className="rounded border border-transparent bg-[#f8f9fa] px-4 py-2 text-sm text-[#3c4043] transition hover:border-[#dadce0] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-gate-search">돼홍존위 검색</button>
        <button type="button" onClick={() => setQuery('')} className="rounded border border-transparent bg-[#f8f9fa] px-4 py-2 text-sm text-[#3c4043] transition hover:border-[#dadce0] hover:shadow-sm">행운을 눌러요</button>
      </div>
      {loading && <p className="mt-6 text-xs text-[#5f6368]">검색 페이지로 이동하는 중입니다.</p>}
    </main>
    <footer className="mt-auto bg-[#f2f2f2] text-sm text-[#70757a]">
      <div className="border-b border-[#dadce0] px-7 py-3">대한민국</div>
      <div className="flex flex-col justify-between gap-3 px-7 py-4 sm:flex-row">
        <div className="flex flex-wrap gap-5"><a href="https://about.google" className="hover:underline" rel="noreferrer">돼홍존위 정보</a><a href="https://ads.google.com" className="hover:underline" rel="noreferrer">광고</a><a href="https://policies.google.com/privacy" className="hover:underline" rel="noreferrer">개인정보처리방침</a></div>
        <span>© 돼홍존위 운영실</span>
      </div>
    </footer>
  </div>;
}