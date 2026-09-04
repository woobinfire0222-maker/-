import { supabase, getSupabaseError } from '@/lib/supabase';

export type Role = 'member' | 'admin';
export type MemberStatus = 'active' | 'suspended';
export type Department = 'dohongjonwi' | 'hongjukwi';
export const DEPARTMENT_LABELS: Record<Department, string> = {
  dohongjonwi: '돼홍존위',
  hongjukwi: '홍죽위',
};
export type Profile = {
  id: string;
  email: string;
  display_name: string;
  department: Department;
  role: Role;
  coin_balance: number;
  created_at: string;
  updated_at: string;
  status: MemberStatus | 'pending';
};
export type Announcement = { id: string; title: string; content: string; author_id: string; created_at: string; updated_at: string };
export type ChatRoom = { id: string; name: string; description: string; department: Department | null; created_at: string };
export type ChatMessage = { id: string; room_id: string; sender_id: string; sender_name?: string; content: string; created_at: string };
export type DirectoryMember = { id: string; display_name: string; department: Department };
export type DirectMessage = { id: string; sender_id: string; recipient_id: string; content: string; created_at: string };
export type EmergencyMeeting = { id: string; title: string; description: string; created_by: string; status: 'scheduled' | 'live' | 'ended'; created_at: string; started_at: string | null; ended_at: string | null };
export type AppNotification = { id: string; user_id: string; title: string; content: string; type: 'notice' | 'meeting' | 'system' | 'admin'; read_at: string | null; created_at: string };
export type CoinTransaction = { id: string; target_user_id: string; previous_balance: number; amount_changed: number; new_balance: number; transaction_type: 'grant' | 'deduct'; reason: string; admin_id: string; created_at: string };
export type AdminLog = { id: string; admin_id: string; target_user_id: string | null; action_type: string; description: string; created_at: string };

type DbProfile = Omit<Profile, 'status'> & { status: 'active' | 'suspended' };
type DbNotification = Omit<AppNotification, 'type'> & { type: 'announcement' | 'meeting' | 'system' | 'admin' };
type DbTransaction = Omit<CoinTransaction, 'transaction_type'> & { transaction_type: 'add' | 'remove' };
type DbMeeting = Omit<EmergencyMeeting, 'status'> & { status: 'scheduled' | 'active' | 'ended' };

function unwrap<T>(data: T | null, error: unknown, fallback: string): T {
  if (error) throw new Error(getSupabaseError(error, fallback));
  if (data === null) throw new Error(fallback);
  return data;
}

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(getSupabaseError(error, '로그인 상태를 확인하지 못했습니다.'));
  if (!data.user) throw new Error('로그인이 필요합니다.');
  return data.user;
}

function mapProfile(profile: DbProfile): Profile {
  return profile;
}

function mapNotification(notification: DbNotification): AppNotification {
  return { ...notification, type: notification.type === 'announcement' ? 'notice' : notification.type };
}

function mapTransaction(transaction: DbTransaction): CoinTransaction {
  return { ...transaction, transaction_type: transaction.transaction_type === 'add' ? 'grant' : 'deduct' };
}

function mapMeeting(meeting: DbMeeting): EmergencyMeeting {
  return { ...meeting, status: meeting.status === 'active' ? 'live' : meeting.status };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(getSupabaseError(error, '이메일 또는 비밀번호를 확인해 주세요.'));
}

export async function signUp(displayName: string, email: string, password: string, department: Department) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: displayName.trim(), department } },
  });
  if (error) throw new Error(getSupabaseError(error, '회원가입을 완료하지 못했습니다.'));
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(getSupabaseError(error, '로그아웃하지 못했습니다.'));
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}login`,
  });
  if (error) throw new Error(getSupabaseError(error, '비밀번호 재설정 메일을 보내지 못했습니다.'));
}

export async function getCurrentProfile() {
  const user = await requireUser();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw new Error(getSupabaseError(error, '회원 정보를 불러오지 못했습니다. SQL 스키마가 적용되었는지 확인해 주세요.'));
  if (!data) throw new Error('회원 프로필이 아직 준비되지 않았습니다. 관리자에게 문의해 주세요.');
  return mapProfile(data as DbProfile);
}

export async function getProfiles() {
  await requireUser();
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  return (unwrap(data as DbProfile[] | null, error, '회원 목록을 불러오지 못했습니다.') ?? []).map(mapProfile);
}

export async function getAnnouncements() {
  await requireUser();
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  return unwrap(data as Announcement[] | null, error, '공지사항을 불러오지 못했습니다.') ?? [];
}

export async function getAnnouncement(id: string) {
  await requireUser();
  const { data, error } = await supabase.from('announcements').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(getSupabaseError(error, '공지사항을 불러오지 못했습니다.'));
  return data as Announcement | null;
}

export async function searchAnnouncements(query: string) {
  await requireUser();
  const escaped = query.trim().replace(/[%_,]/g, (character) => `\\${character}`);
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`)
    .order('created_at', { ascending: false });
  return unwrap(data as Announcement[] | null, error, '공지사항 검색에 실패했습니다.') ?? [];
}

export async function createAnnouncement(input: Pick<Announcement, 'title' | 'content'>) {
  const user = await requireUser();
  const { data, error } = await supabase.from('announcements').insert({ ...input, author_id: user.id }).select().single();
  return unwrap(data as Announcement | null, error, '공지사항을 등록하지 못했습니다.');
}

export async function updateAnnouncement(id: string, input: Pick<Announcement, 'title' | 'content'>) {
  await requireUser();
  const { data, error } = await supabase.from('announcements').update(input).eq('id', id).select().single();
  return unwrap(data as Announcement | null, error, '공지사항을 수정하지 못했습니다.');
}

export async function deleteAnnouncement(id: string) {
  await requireUser();
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw new Error(getSupabaseError(error, '공지사항을 삭제하지 못했습니다.'));
}

export async function getRooms() {
  await requireUser();
  const { data, error } = await supabase.from('chat_rooms').select('*').order('created_at', { ascending: true });
  return unwrap(data as ChatRoom[] | null, error, '채팅방을 불러오지 못했습니다.') ?? [];
}

export async function getMemberDirectory() {
  await requireUser();
  const { data, error } = await supabase.rpc('get_member_directory');
  return unwrap(data as DirectoryMember[] | null, error, '회원 목록을 불러오지 못했습니다.') ?? [];
}

export async function getMessages(roomId: string) {
  await requireUser();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, room_id, sender_id, content, created_at, profiles:sender_id(display_name)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(getSupabaseError(error, '채팅 기록을 불러오지 못했습니다.'));
  return ((data ?? []) as Array<ChatMessage & { profiles?: { display_name?: string } | null }>).map(({ profiles, ...message }) => ({
    ...message,
    sender_name: profiles?.display_name,
  }));
}

export async function sendMessage(roomId: string, senderId: string, content: string) {
  const user = await requireUser();
  if (user.id !== senderId) throw new Error('본인 계정으로만 메시지를 보낼 수 있습니다.');
  const { data, error } = await supabase.from('chat_messages').insert({ room_id: roomId, sender_id: senderId, content }).select().single();
  return unwrap(data as ChatMessage | null, error, '메시지를 보내지 못했습니다.');
}

export async function getDirectMessages(recipientId: string) {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, recipient_id, content, created_at')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true });
  return unwrap(data as DirectMessage[] | null, error, 'DM 기록을 불러오지 못했습니다.') ?? [];
}

export async function sendDirectMessage(recipientId: string, content: string) {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: user.id, recipient_id: recipientId, content })
    .select()
    .single();
  return unwrap(data as DirectMessage | null, error, 'DM을 보내지 못했습니다.');
}

export async function getMeetings() {
  await requireUser();
  const { data, error } = await supabase.from('emergency_meetings').select('*').order('created_at', { ascending: false });
  return (unwrap(data as DbMeeting[] | null, error, '긴급회의를 불러오지 못했습니다.') ?? []).map(mapMeeting);
}

export async function createMeeting(title: string, description: string) {
  const user = await requireUser();
  const { data, error } = await supabase.from('emergency_meetings').insert({ title, description, created_by: user.id }).select().single();
  return mapMeeting(unwrap(data as DbMeeting | null, error, '긴급회의를 개설하지 못했습니다.'));
}

export async function updateMeetingStatus(id: string, status: 'scheduled' | 'active' | 'ended') {
  await requireUser();
  const timestamps = status === 'active'
    ? { status, started_at: new Date().toISOString(), ended_at: null }
    : status === 'ended'
      ? { status, ended_at: new Date().toISOString() }
      : { status, started_at: null, ended_at: null };
  const { data, error } = await supabase.from('emergency_meetings').update(timestamps).eq('id', id).select().single();
  return mapMeeting(unwrap(data as DbMeeting | null, error, '긴급회의 상태를 변경하지 못했습니다.'));
}

export async function getNotifications() {
  const user = await requireUser();
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return (unwrap(data as DbNotification[] | null, error, '알림을 불러오지 못했습니다.') ?? []).map(mapNotification);
}

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  const { data, error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
  return mapNotification(unwrap(data as DbNotification | null, error, '알림을 읽음 처리하지 못했습니다.'));
}

export async function updateProfile(input: Pick<Profile, 'display_name' | 'email'>) {
  const user = await requireUser();
  const { data, error } = await supabase.from('profiles').update({ display_name: input.display_name.trim() }).eq('id', user.id).select().single();
  return mapProfile(unwrap(data as DbProfile | null, error, '회원 정보를 저장하지 못했습니다.'));
}

export async function adjustCoins(targetUserId: string, amount: number, reason: string) {
  const { data, error } = await supabase.rpc('adjust_user_coins', {
    target_id: targetUserId,
    change_amount: amount,
    change_reason: reason.trim(),
  });
  return mapTransaction(unwrap(data as DbTransaction | null, error, '코인을 변경하지 못했습니다.'));
}

export async function updateMemberRole(id: string, role: Role) {
  await requireUser();
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
  return mapProfile(unwrap(data as DbProfile | null, error, '회원 권한을 변경하지 못했습니다.'));
}

export async function updateMemberStatus(id: string, status: 'active' | 'suspended') {
  await requireUser();
  const { data, error } = await supabase.from('profiles').update({ status }).eq('id', id).select().single();
  return mapProfile(unwrap(data as DbProfile | null, error, '회원 상태를 변경하지 못했습니다.'));
}

export async function sendGlobalNotification(title: string, content: string) {
  const { data, error } = await supabase.rpc('send_global_notification', {
    notification_title: title.trim(),
    notification_content: content.trim(),
  });
  return unwrap(data as number | null, error, '전체 알림을 보내지 못했습니다.');
}

export async function getAdminLogs() {
  await requireUser();
  const { data, error } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(50);
  return unwrap(data as AdminLog[] | null, error, '관리자 기록을 불러오지 못했습니다.') ?? [];
}

export async function getCoinTransactions(targetUserId?: string) {
  await requireUser();
  let query = supabase.from('coin_transactions').select('*').order('created_at', { ascending: false }).limit(50);
  if (targetUserId) query = query.eq('target_user_id', targetUserId);
  const { data, error } = await query;
  return (unwrap(data as DbTransaction[] | null, error, '코인 거래 내역을 불러오지 못했습니다.') ?? []).map(mapTransaction);
}

export function subscribeToTable(
  name: 'chat_messages' | 'direct_messages' | 'emergency_meetings' | 'notifications',
  callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void,
  filter?: string,
) {
  const channel = supabase
    .channel(`dohongjonwi-${name}-${filter ?? 'all'}-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: name, ...(filter ? { filter } : {}) }, callback)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}