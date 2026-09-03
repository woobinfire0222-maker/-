import { ArrowLeft, Compass } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button, Card } from '@/components/ui-kit';

export default function NotFound() {
  const [, setLocation] = useLocation();
  return <div className="app-grid flex min-h-[100dvh] items-center justify-center p-6"><Card className="w-full max-w-md p-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Compass size={25} /></div><p className="mono mt-6 text-xs font-bold tracking-[.16em] text-primary">404 · NOT FOUND</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-.05em]">페이지를 찾을 수 없습니다</h1><p className="mt-2 text-sm text-muted-foreground">주소를 다시 확인하거나 운영실 홈으로 돌아가 주세요.</p><Button onClick={() => setLocation('/')} className="mt-6" data-testid="button-not-found-home"><ArrowLeft size={16} />처음으로</Button></Card></div>;
}