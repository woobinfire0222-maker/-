import { Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { AuthFrame } from '@/components/app-shell';
import { Button, Field, Input } from '@/components/ui-kit';
import { DEPARTMENT_LABELS, resetPassword, signIn, signUp, type Department } from '@/lib/data-services';

export function LoginPage() {
  const [, setLocation] = useLocation(); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const submit = async (event: FormEvent) => { event.preventDefault(); setLoading(true); setError(''); setMessage(''); try { await signIn(email, password); setLocation('/app'); } catch (reason) { setError(reason instanceof Error ? reason.message : '로그인에 실패했습니다.'); } finally { setLoading(false); } };
  const forgot = async () => { if (!email.trim()) { setError('비밀번호 재설정 메일을 받을 이메일을 먼저 입력해 주세요.'); return; } setError(''); setMessage(''); try { await resetPassword(email); setMessage('비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해 주세요.'); } catch (reason) { setError(reason instanceof Error ? reason.message : '메일을 보내지 못했습니다.'); } };
  return <AuthFrame title="다시 만나서 반갑습니다" subtitle="회원 계정으로 운영실에 들어오세요."><form onSubmit={submit} className="grid gap-5">
    <Field label="이메일"><div className="relative"><Mail size={17} className="absolute left-3.5 top-3.5 text-muted-foreground" /><Input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="pl-10" data-testid="input-login-email" /></div></Field>
    <Field label="비밀번호"><div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-3.5 text-muted-foreground" /><Input autoComplete="current-password" required minLength={6} type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6자 이상 입력" className="pl-10 pr-11" data-testid="input-login-password" /><button type="button" className="absolute right-2 top-2 rounded-md p-2 text-muted-foreground hover:bg-muted" onClick={() => setShow(!show)} data-testid="button-toggle-password">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>
    <div className="flex justify-end"><button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={forgot} data-testid="button-forgot-password">비밀번호를 잊으셨나요?</button></div>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
    <Button type="submit" loading={loading} className="mt-1 w-full" data-testid="button-login-submit">로그인</Button>
    <p className="text-center text-sm text-muted-foreground">아직 회원이 아니신가요? <Link href="/signup" className="font-bold text-primary hover:underline" data-testid="link-to-signup">회원가입</Link></p>
  </form></AuthFrame>;
}

export function SignupPage() {
  const [, setLocation] = useLocation(); const [loading, setLoading] = useState(false); const [agree, setAgree] = useState(false); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [department, setDepartment] = useState<Department>('dohongjonwi'); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const submit = async (event: FormEvent) => { event.preventDefault(); setLoading(true); setError(''); setMessage(''); try { const result = await signUp(name, email, password, department); if (result.session) setLocation('/app'); else setMessage('가입이 완료되었습니다. 이메일 인증을 마친 뒤 로그인해 주세요.'); } catch (reason) { setError(reason instanceof Error ? reason.message : '회원가입에 실패했습니다.'); } finally { setLoading(false); } };
  return <AuthFrame title="새 계정 만들기" subtitle="회원위원회의 소식을 가장 먼저 확인하세요."><form onSubmit={submit} className="grid gap-4">
    <Field label="이름"><div className="relative"><UserRound size={17} className="absolute left-3.5 top-3.5 text-muted-foreground" /><Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="표시할 이름" className="pl-10" data-testid="input-signup-name" /></div></Field>
    <Field label="이메일"><div className="relative"><Mail size={17} className="absolute left-3.5 top-3.5 text-muted-foreground" /><Input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="pl-10" data-testid="input-signup-email" /></div></Field>
    <Field label="비밀번호" hint="영문, 숫자를 포함해 6자 이상"><div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-3.5 text-muted-foreground" /><Input autoComplete="new-password" required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="안전한 비밀번호" className="pl-10" data-testid="input-signup-password" /></div></Field>
    <Field label="부서" hint="가입 후에는 같은 부서 대화방에 참여할 수 있습니다."><select required value={department} onChange={(event) => setDepartment(event.target.value as Department)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring" data-testid="select-signup-department"><option value="dohongjonwi">{DEPARTMENT_LABELS.dohongjonwi}</option><option value="hongjukwi">{DEPARTMENT_LABELS.hongjukwi}</option></select></Field>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
    <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" data-testid="input-signup-agree" /><Check size={13} className="pointer-events-none -ml-6 text-primary opacity-0" /> 운영실 이용약관과 개인정보 처리방침에 동의합니다.</label>
    <Button type="submit" disabled={!agree} loading={loading} className="mt-2 w-full" data-testid="button-signup-submit">회원가입</Button>
    <p className="text-center text-sm text-muted-foreground">이미 계정이 있으신가요? <Link href="/login" className="font-bold text-primary hover:underline" data-testid="link-to-login">로그인</Link></p>
  </form></AuthFrame>;
}