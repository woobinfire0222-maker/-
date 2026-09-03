# 돼홍존위

검색으로 입장하는 가상의 회원 위원회 서비스입니다. 회원가입과 로그인을 거쳐 공지사항, 실시간 단체 채팅, 긴급회의, 알림, 회원 정보와 코인 내역을 이용할 수 있습니다. `admin` 역할의 회원은 관리자 화면에서 회원·공지·회의·알림·코인을 관리할 수 있습니다.

## Supabase 설정

1. [Supabase](https://supabase.com/)에서 새 프로젝트를 만듭니다.
2. Supabase 대시보드의 **SQL Editor**에서 `supabase/schema.sql` 전체를 한 번 실행합니다.
3. 프로젝트의 **Project Settings → API**에서 Project URL과 공개 `anon` 키를 확인합니다.
4. 프로젝트 환경 변수에 아래 두 값을 등록합니다.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

`service_role` 키는 브라우저 앱이나 저장소에 절대 넣지 않습니다. 브라우저에는 공개 anon 키만 사용합니다.

## 초기 관리자 지정

회원가입이 완료되면 `profiles`에 기본 `member` 역할로 프로필이 만들어집니다. 초기 관리자 계정을 먼저 만든 뒤, Supabase SQL Editor에서 각 계정의 UUID 또는 정확한 이메일로 역할을 지정합니다.

```sql
update public.profiles
set role = 'admin'
where email in ('관리자1@example.com', '관리자2@example.com', '관리자3@example.com');
```

이 프로젝트의 화면은 이름으로 관리자 권한을 판단하지 않습니다. 관리자 권한은 `profiles.role`과 RLS 정책으로만 판정됩니다. 운영 환경에서는 위 계정을 지정한 뒤 SQL Editor 접근 권한을 제한하세요.

## 로컬 실행

```bash
pnpm install
pnpm --filter @workspace/dohongjonwi run dev
```

## GitHub Pages 배포

1. GitHub 저장소의 Actions에서 Node.js와 pnpm을 준비합니다.
2. 저장소 Secrets/Variables에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 등록합니다.
3. `pnpm --filter @workspace/dohongjonwi run build` 결과물인 `artifacts/dohongjonwi/dist/public`을 GitHub Pages에 게시합니다.
4. SPA 라우팅을 위해 Pages 배포 방식에 맞게 `404.html`을 `index.html`과 함께 제공하거나, GitHub Pages SPA 라우팅 설정을 적용합니다.

Supabase Auth에서 이메일 확인을 켜면 가입 뒤 확인 메일을 요구할 수 있습니다. 배포 주소는 Supabase **Authentication → URL Configuration**의 Site URL과 Redirect URLs에 등록해야 합니다.

## 데이터 보안

- 모든 핵심 테이블에 Row Level Security가 활성화되어 있습니다.
- 코인 증감은 `adjust_user_coins` RPC가 행 잠금과 함께 잔액·불변 거래 원장·관리자 로그를 한 번에 기록합니다.
- 전체 알림은 `send_global_notification` RPC를 사용합니다.
- 채팅, 긴급회의, 알림은 Supabase Realtime 구독으로 갱신됩니다.
- 회원가입 프로필은 `auth.users` 트리거로 생성됩니다.