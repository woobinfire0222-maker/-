import { Activity, Bell, Check, ChevronRight, Coins, FileText, Pencil, Plus, RefreshCw, Search, ShieldAlert, Siren, Trash2, UserCheck, Users, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, EmptyState, Field, Input, PageTitle, Skeleton, Textarea } from '@/components/ui-kit';
import {
  adjustCoins, createAnnouncement, createMeeting, deleteAnnouncement, getAdminLogs, getAnnouncements, getCoinTransactions,
  getCurrentProfile, getMeetings, getProfiles, sendGlobalNotification, updateAnnouncement, updateMeetingStatus,
  updateMemberRole, updateMemberStatus, type AdminLog, type Announcement, type EmergencyMeeting, type Profile,
} from '@/lib/data-services';

function date(value: string) { return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }
function selectClass() { return 'h-9 rounded-lg border bg-card px-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10'; }

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<Profile[] | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meetings, setMeetings] = useState<EmergencyMeeting[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [editingNotice, setEditingNotice] = useState<string | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationContent, setNotificationContent] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setError('');
    try {
      const [me, all, noticeRows, meetingRows, logRows] = await Promise.all([
        getCurrentProfile(), getProfiles(), getAnnouncements(), getMeetings(), getAdminLogs(),
      ]);
      setProfile(me); setMembers(all); setAnnouncements(noticeRows); setMeetings(meetingRows); setLogs(logRows);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '관리자 데이터를 불러오지 못했습니다.');
    }
  };
  useEffect(() => { void load(); }, []);

  if (!profile || !members) return <div className="min-h-[100dvh] bg-background p-6 lg:pl-[296px]"><div className="mx-auto max-w-6xl pt-12"><Skeleton className="h-8 w-48" /><Skeleton className="mt-8 h-80 w-full" /></div></div>;
  if (profile.role !== 'admin') return <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6"><Card className="max-w-md p-8 text-center"><EmptyState title="관리자 권한이 필요합니다" description="이 페이지는 운영위원만 접근할 수 있습니다." icon={<ShieldAlert size={22} />} /><Button onClick={() => setLocation('/app')} data-testid="button-unauthorized-home">홈으로 돌아가기</Button></Card></div>;

  const shown = members.filter((member) => `${member.display_name} ${member.email}`.toLowerCase().includes(search.toLowerCase()));
  const showSuccess = (message: string) => { setSuccess(message); window.setTimeout(() => setSuccess(''), 2800); };
  const handleCoin = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !Number(amount) || !reason.trim()) return;
    setSaving(true); setError('');
    try { await adjustCoins(selected.id, Number(amount), reason); setMembers(await getProfiles()); setLogs(await getAdminLogs()); setSelected(null); setAmount(''); setReason(''); showSuccess('코인 변경 내역이 저장되었습니다.'); }
    catch (reasonError) { setError(reasonError instanceof Error ? reasonError.message : '코인을 변경하지 못했습니다.'); }
    finally { setSaving(false); }
  };
  const saveNotice = async (event: FormEvent) => {
    event.preventDefault(); if (!noticeTitle.trim() || !noticeContent.trim()) return;
    setSaving(true); setError('');
    try {
      const saved = editingNotice ? await updateAnnouncement(editingNotice, { title: noticeTitle, content: noticeContent }) : await createAnnouncement({ title: noticeTitle, content: noticeContent });
      setAnnouncements((items) => editingNotice ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items]);
      setNoticeTitle(''); setNoticeContent(''); setEditingNotice(null); setLogs(await getAdminLogs()); showSuccess(editingNotice ? '공지사항을 수정했습니다.' : '공지사항을 등록했습니다.');
    } catch (reasonError) { setError(reasonError instanceof Error ? reasonError.message : '공지사항을 저장하지 못했습니다.'); } finally { setSaving(false); }
  };
  const removeNotice = async (item: Announcement) => {
    if (!window.confirm(`"${item.title}" 공지사항을 삭제할까요?`)) return;
    try { await deleteAnnouncement(item.id); setAnnouncements((items) => items.filter((entry) => entry.id !== item.id)); setLogs(await getAdminLogs()); showSuccess('공지사항을 삭제했습니다.'); }
    catch (reasonError) { setError(reasonError instanceof Error ? reasonError.message : '공지사항을 삭제하지 못했습니다.'); }
  };
  const createEmergencyMeeting = async (event: FormEvent) => {
    event.preventDefault(); if (!meetingTitle.trim()) return;
    setSaving(true); setError('');
    try { const created = await createMeeting(meetingTitle, meetingDescription); setMeetings((items) => [created, ...items]); setMeetingTitle(''); setMeetingDescription(''); setLogs(await getAdminLogs()); showSuccess('긴급회의를 개설했습니다.'); }
    catch (reasonError) { setError(reasonError instanceof Error ? reasonError.message : '긴급회의를 개설하지 못했습니다.'); } finally { setSaving(false); }
  };
  const sendNotification = async (event: FormEvent) => {
    event.preventDefault(); if (!notificationTitle.trim()) return;
    setSaving(true); setError('');
    try { const count = await sendGlobalNotification(notificationTitle, notificationContent); setNotificationTitle(''); setNotificationContent(''); setLogs(await getAdminLogs()); showSuccess(`${count}명의 활성 회원에게 알림을 보냈습니다.`); }
    catch (reasonError) { setError(reasonError instanceof Error ? reasonError.message : '전체 알림을 보내지 못했습니다.'); } finally { setSaving(false); }
  };
  const changeRole = async (member: Profile, role: 'member' | 'admin') => {
    try { const updated = await updateMemberRole(member.id, role); setMembers((items) => (items ?? []).map((item) => item.id === updated.id ? updated : item)); setLogs(await getAdminLogs()); showSuccess('회원 권한을 변경했습니다.'); }
    catch (reasonError) { setError(reasonError instanceof Error ? reasonError.message : '회원 권한을 변경하지 못했습니다.'); }
  };
  const changeStatus = async (member: Profile, status: 'active' | 'suspended') => {
    try { const updated = await updateMemberStatus(member.id, status); setMembers((items) => (items ?? []).map((item) => item.id === updated.id ? updated : item)); setLogs(await getAdminLogs()); showSuccess('회원 상태를 변경했습니다.'); }
    catch (reasonError) { setError(reasonError instanceof Error ? reasonError.message : '회원 상태를 변경하지 못했습니다.'); }
  };

  return <AppShell profile={profile}><div className="mx-auto max-w-6xl">
    <PageTitle eyebrow="CONTROL ROOM" title="관리자 대시보드" description="회원과 운영실 활동을 살펴보고 관리하세요." action={<Button variant="secondary" onClick={() => void load()} data-testid="button-refresh-admin"><RefreshCw size={16} />새로고침</Button>} />
    {error && <div role="alert" className="mb-5 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><span>{error}</span><button onClick={() => void load()} className="font-bold underline" data-testid="button-retry-admin">다시 시도</button></div>}
    {success && <div role="status" className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><Check size={16} />{success}</div>}
    <div className="grid gap-4 sm:grid-cols-3"><Stat icon={<Users size={18} />} label="전체 회원" value={`${members.length}명`} hint="등록된 회원" /><Stat icon={<UserCheck size={18} />} label="활성 회원" value={`${members.filter((m) => m.status === 'active').length}명`} hint="정상 이용 중" /><Stat icon={<Activity size={18} />} label="감사 로그" value={`${logs.length}건`} hint="최근 50건" /></div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_.55fr]">
      <Card className="overflow-hidden"><div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="font-bold">회원 관리</h2><p className="mt-1 text-xs text-muted-foreground">회원 상태, 권한과 코인을 관리합니다.</p></div><div className="relative w-full sm:w-56"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름 또는 이메일" className="h-10 pl-9" data-testid="input-admin-member-search" /></div></div>{shown.length ? <div className="divide-y">{shown.map((member) => <div key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6" data-testid={`row-member-${member.id}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{member.display_name.slice(0, 1)}</span><div className="min-w-[140px] flex-1"><div className="flex items-center gap-2"><strong className="text-sm">{member.display_name}</strong></div><p className="truncate text-xs text-muted-foreground">{member.email}</p></div><div className="flex items-center gap-2"><select aria-label={`${member.display_name} 권한`} className={selectClass()} value={member.role} onChange={(e) => void changeRole(member, e.target.value as 'member' | 'admin')}><option value="member">회원</option><option value="admin">관리자</option></select><select aria-label={`${member.display_name} 상태`} className={selectClass()} value={member.status} onChange={(e) => void changeStatus(member, e.target.value as 'active' | 'suspended')}><option value="active">활성</option><option value="suspended">정지</option></select></div><div className="hidden text-right sm:block"><div className="mono text-sm font-bold">{member.coin_balance.toLocaleString()} <span className="text-[10px] text-muted-foreground">COIN</span></div><div className="mt-1 text-[11px] text-muted-foreground">{date(member.updated_at)}</div></div><button onClick={() => setSelected(member)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary" aria-label={`${member.display_name} 코인 관리`} data-testid={`button-adjust-coins-${member.id}`}><Coins size={17} /></button></div>)}</div> : <EmptyState title="검색 결과가 없습니다" description="다른 이름이나 이메일로 검색해 보세요." icon={<Search size={21} />} />}</Card>
      <Card><div className="border-b px-5 py-5"><h2 className="font-bold">최근 감사 로그</h2><p className="mt-1 text-xs text-muted-foreground">관리자 작업 기록</p></div><div className="max-h-[420px] space-y-4 overflow-y-auto p-5">{logs.length ? logs.slice(0, 8).map((log) => <ActivityRow key={log.id} icon={<Activity size={16} />} title={log.description} time={date(log.created_at)} />) : <EmptyState title="기록이 없습니다" description="관리자 작업이 이곳에 쌓입니다." icon={<Activity size={20} />} />}</div></Card>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText size={19} /></span><div><h2 className="font-bold">{editingNotice ? '공지사항 수정' : '공지사항 관리'}</h2><p className="mt-1 text-xs text-muted-foreground">회원에게 보여지는 공지를 관리합니다.</p></div></div><form onSubmit={saveNotice} className="grid gap-3"><Field label="제목"><Input value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="공지 제목" /></Field><Field label="내용"><Textarea value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} placeholder="공지 내용을 작성하세요" className="min-h-24" /></Field><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setEditingNotice(null); setNoticeTitle(''); setNoticeContent(''); }}>{editingNotice ? '수정 취소' : '초기화'}</Button><Button type="submit" loading={saving} disabled={!noticeTitle.trim() || !noticeContent.trim()}><Plus size={15} />{editingNotice ? '수정 저장' : '공지 등록'}</Button></div></form><div className="mt-6 divide-y border-t">{announcements.slice(0, 5).map((item) => <div key={item.id} className="flex items-center gap-3 py-3"><span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</span><button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" aria-label={`${item.title} 수정`} onClick={() => { setEditingNotice(item.id); setNoticeTitle(item.title); setNoticeContent(item.content); }}><Pencil size={15} /></button><button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`${item.title} 삭제`} onClick={() => void removeNotice(item)}><Trash2 size={15} /></button></div>)}</div></Card>
      <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground"><Siren size={19} /></span><div><h2 className="font-bold">긴급회의 관리</h2><p className="mt-1 text-xs text-muted-foreground">회의를 만들고 상태를 변경합니다.</p></div></div><form onSubmit={createEmergencyMeeting} className="grid gap-3"><Field label="제목"><Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="긴급회의 제목" /></Field><Field label="설명"><Textarea value={meetingDescription} onChange={(e) => setMeetingDescription(e.target.value)} placeholder="회의 목적과 내용을 작성하세요" className="min-h-20" /></Field><div className="flex justify-end"><Button type="submit" loading={saving} disabled={!meetingTitle.trim()}><Plus size={15} />회의 개설</Button></div></form><div className="mt-5 divide-y border-t">{meetings.slice(0, 5).map((meeting) => <div key={meeting.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{meeting.title}</p><p className="mt-1 text-xs text-muted-foreground">{meeting.status === 'live' ? '진행 중' : meeting.status === 'scheduled' ? '예정' : '종료'}</p></div>{meeting.status === 'scheduled' && <Button className="h-8 px-2 text-xs" onClick={() => void updateMeetingStatus(meeting.id, 'active').then((updated) => { setMeetings((items) => items.map((item) => item.id === updated.id ? updated : item)); showSuccess('긴급회의를 시작했습니다.'); }).catch((reasonError) => setError(reasonError instanceof Error ? reasonError.message : '회의를 시작하지 못했습니다.'))}>시작</Button>}{meeting.status === 'live' && <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => void updateMeetingStatus(meeting.id, 'ended').then((updated) => { setMeetings((items) => items.map((item) => item.id === updated.id ? updated : item)); setLogs((items) => items); showSuccess('긴급회의를 종료했습니다.'); }).catch((reasonError) => setError(reasonError instanceof Error ? reasonError.message : '회의를 종료하지 못했습니다.'))}>종료</Button>}</div>)}</div></Card>
    </div>

    <Card className="mt-6 p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Bell size={19} /></span><div><h2 className="font-bold">전체 알림 보내기</h2><p className="mt-1 text-xs text-muted-foreground">활성 상태의 모든 회원에게 알림을 보냅니다.</p></div></div><form onSubmit={sendNotification} className="grid gap-3 md:grid-cols-[.65fr_1.35fr_auto] md:items-end"><Field label="제목"><Input value={notificationTitle} onChange={(e) => setNotificationTitle(e.target.value)} placeholder="알림 제목" /></Field><Field label="내용"><Input value={notificationContent} onChange={(e) => setNotificationContent(e.target.value)} placeholder="알림 내용을 입력하세요" /></Field><Button type="submit" loading={saving} disabled={!notificationTitle.trim()}><Bell size={15} />보내기</Button></form></Card>
  </div>{selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-6"><Card className="w-full max-w-md rounded-b-none p-6 sm:rounded-xl"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">코인 관리</p><h2 className="mt-1 font-bold">{selected.display_name}님</h2></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-close-coin-dialog"><X size={18} /></button></div><form onSubmit={handleCoin} className="grid gap-4"><Field label="변경량" hint="지급은 양수, 차감은 음수로 입력"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="예: 100 또는 -50" /></Field><Field label="사유"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="변경 사유를 남겨 주세요" className="min-h-24" /></Field><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setSelected(null)}>취소</Button><Button type="submit" loading={saving} disabled={!amount || !reason.trim()}>변경 저장</Button></div></form></Card></div>}</AppShell>;
}

function Stat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) { return <Card className="flex items-center gap-4 p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span><div><p className="text-xs text-muted-foreground">{label}</p><div className="mt-1 flex items-baseline gap-2"><strong className="mono text-xl">{value}</strong><span className="text-[10px] font-semibold text-muted-foreground">{hint}</span></div></div></Card>; }
function ActivityRow({ icon, title, time }: { icon: ReactNode; title: string; time: string }) { return <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">{icon}</span><span className="min-w-0 flex-1 text-sm font-semibold leading-5">{title}</span><span className="shrink-0 text-[11px] text-muted-foreground">{time}</span></div>; }