# CS 통합 대시보드

4개 브랜드(아자차, 반드럽, 윈토르, 웰바이오젠) × 13개 채널 고객 문의 통합 관리 시스템

## 🎯 지원 채널

| 브랜드 | 카카오채널 | 스마트스토어 문의 | 스마트스토어 톡톡 | 쿠팡 | 네이버페이센터 |
|--------|:---:|:---:|:---:|:---:|:---:|
| 🚗 아자차 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🧴 반드럽 | ✅ | - | - | ✅ | ✅ |
| ❄️ 윈토르 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🧬 웰바이오젠 | ✅ | - | - | ✅ | ✅ |

## 🚀 빠른 시작 (5분 배포)

### 1단계: Supabase 설정 (무료)

1. [Supabase](https://supabase.com) 가입 및 새 프로젝트 생성
2. 프로젝트 생성 후 **SQL Editor** 열기
3. `supabase-schema.sql` 파일 내용을 복사해서 실행
4. **Project Settings > API**에서 다음 정보 복사:
   - Project URL
   - anon/public key

### 2단계: Vercel 배포 (무료)

#### 방법 A: GitHub 연동 (추천)

1. 이 폴더를 GitHub 저장소에 업로드
2. [Vercel](https://vercel.com) 가입
3. "New Project" > GitHub 저장소 선택
4. Environment Variables 설정:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Deploy!

#### 방법 B: Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel

# 환경변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 재배포
vercel --prod
```

### 3단계: 채널 API 연동

배포된 사이트에서 ⚙️ 설정 페이지로 이동해서 각 플랫폼 API 키를 등록합니다.

## 🔑 API 키 발급 방법

### 카카오 비즈니스 채널

1. [카카오 비즈니스](https://business.kakao.com) 로그인
2. 채널 관리 > 비즈니스 도구 > API 설정
3. Admin Key 발급

### 네이버 커머스 API

1. [네이버 개발자센터](https://developers.naver.com) 로그인
2. 애플리케이션 등록
3. 커머스 API 사용 신청
4. Client ID / Secret 발급

### 쿠팡 Wing API

1. [쿠팡 Wing](https://wing.coupang.com) 로그인
2. 기타 서비스 > API 관리
3. API Key 발급 신청

## 📁 프로젝트 구조

```
cs-dashboard/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── tickets/       # 티켓 CRUD
│   │   ├── channels/      # 채널 설정
│   │   └── sync/          # 동기화
│   ├── settings/          # 설정 페이지
│   ├── page.js            # 메인 대시보드
│   ├── layout.js          # 레이아웃
│   └── globals.css        # 글로벌 스타일
├── lib/
│   ├── supabase.js        # Supabase 클라이언트
│   └── platforms/         # 플랫폼 API 연동
│       ├── kakao.js       # 카카오 채널
│       ├── naver.js       # 네이버 커머스
│       ├── coupang.js     # 쿠팡
│       └── index.js       # 통합 동기화
├── supabase-schema.sql    # DB 스키마
├── .env.example           # 환경변수 예시
└── package.json
```

## 🔧 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일 편집

# 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인

## ✨ 주요 기능

### 대시보드
- 📊 브랜드별/채널별 문의 필터링
- 🔍 고객명, 제목 검색
- 📈 실시간 통계 (대기/처리중/완료)
- 🔔 미읽음 문의 표시

### 문의 처리
- 💬 채팅 형식 대화
- ⚡ 빠른 답변 템플릿
- 🏷️ 상태 변경 (대기중→처리중→완료)
- 📱 각 플랫폼으로 답변 자동 전송

### 설정
- 🔑 플랫폼별 API 키 관리
- 🔄 수동/자동 동기화
- 📊 동기화 로그 확인

## ⚠️ 주의사항

1. **API 연동 없이도 사용 가능**: API 키를 등록하지 않으면 데모 모드로 실행됩니다.

2. **쿠팡 통합 계정**: 쿠팡은 1개 계정으로 4개 브랜드를 관리하므로, 한 브랜드에만 API 키를 등록하면 됩니다.

3. **무료 한도**:
   - Supabase: 500MB 저장공간, 2GB 전송량/월
   - Vercel: 100GB 대역폭/월
   - 소규모 쇼핑몰에는 충분합니다.

## 🆘 문제 해결

### "Supabase가 설정되지 않았습니다"
→ `.env.local` 파일에 Supabase URL과 Key가 올바르게 입력되었는지 확인

### 동기화가 안 됨
→ 설정 페이지에서 API 키가 올바르게 입력되었는지 확인
→ 각 플랫폼의 API 권한이 활성화되어 있는지 확인

### 메시지가 플랫폼으로 안 보내짐
→ API 권한 중 '쓰기' 권한이 있는지 확인
→ 일부 플랫폼은 사업자 인증 후에만 메시지 전송 가능

## 📞 지원

문제가 있으면 이슈를 남겨주세요!

---

Made with ❤️ for small business owners
