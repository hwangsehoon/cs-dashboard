-- =====================================================
-- CS 통합 대시보드 - Supabase 스키마
-- =====================================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 브랜드 테이블
CREATE TABLE brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  color VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 브랜드 데이터 삽입
INSERT INTO brands (name, icon, color) VALUES 
  ('아자차', '🚗', '#ef4444'),
  ('반드럽', '🧴', '#10b981'),
  ('윈토르', '❄️', '#3b82f6'),
  ('웰바이오젠', '🧬', '#f59e0b');

-- 2. 채널 설정 테이블 (API 키 저장)
CREATE TABLE channel_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL, -- kakao, smartstore_inquiry, smartstore_talk, coupang, naverpay
  channel_name VARCHAR(100),
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  store_id VARCHAR(100), -- 스마트스토어 ID 등
  extra_config JSONB, -- 추가 설정
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 고객 문의 티켓 테이블
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  channel_config_id UUID REFERENCES channel_configs(id) ON DELETE SET NULL,
  channel_type VARCHAR(50) NOT NULL,
  external_id VARCHAR(255), -- 외부 플랫폼의 문의 ID
  customer_name VARCHAR(100),
  customer_id VARCHAR(255), -- 외부 플랫폼의 고객 ID
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  subject VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, resolved
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  order_number VARCHAR(100), -- 주문번호
  product_name VARCHAR(255), -- 상품명
  is_read BOOLEAN DEFAULT false,
  assigned_to VARCHAR(100), -- 담당자
  tags TEXT[], -- 태그 배열
  metadata JSONB, -- 추가 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 4. 메시지 테이블
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  external_id VARCHAR(255), -- 외부 플랫폼의 메시지 ID
  sender_type VARCHAR(20) NOT NULL, -- customer, agent, system
  sender_name VARCHAR(100),
  content TEXT NOT NULL,
  attachments JSONB, -- 첨부파일 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 빠른 답변 템플릿 테이블
CREATE TABLE quick_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE, -- NULL이면 전체 브랜드 공통
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50), -- 카테고리 (배송, 환불, 교환 등)
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 빠른 답변 삽입
INSERT INTO quick_replies (title, content, category) VALUES 
  ('인사', '안녕하세요, 문의 감사합니다. 확인 후 답변드리겠습니다.', '기본'),
  ('사과', '불편을 드려 죄송합니다. 바로 처리 도와드리겠습니다.', '기본'),
  ('주문번호 요청', '주문번호를 알려주시겠어요?', '확인'),
  ('처리 완료 안내', '확인되었습니다. 처리 완료되면 안내드리겠습니다.', '처리'),
  ('추가 문의', '추가 문의사항 있으시면 말씀해주세요!', '마무리'),
  ('교환/환불', '교환/환불 접수 도와드리겠습니다.', '교환/환불');

-- 6. 동기화 로그 테이블
CREATE TABLE sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_config_id UUID REFERENCES channel_configs(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- success, failed, partial
  tickets_synced INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 생성
CREATE INDEX idx_tickets_brand_id ON tickets(brand_id);
CREATE INDEX idx_tickets_channel_type ON tickets(channel_type);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_external_id ON tickets(external_id);
CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_channel_configs_brand_id ON channel_configs(brand_id);

-- Row Level Security (RLS) 활성화
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기/쓰기 권한 (실제 서비스에서는 인증 기반으로 수정 필요)
CREATE POLICY "Allow all for brands" ON brands FOR ALL USING (true);
CREATE POLICY "Allow all for channel_configs" ON channel_configs FOR ALL USING (true);
CREATE POLICY "Allow all for tickets" ON tickets FOR ALL USING (true);
CREATE POLICY "Allow all for messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for quick_replies" ON quick_replies FOR ALL USING (true);
CREATE POLICY "Allow all for sync_logs" ON sync_logs FOR ALL USING (true);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channel_configs_updated_at BEFORE UPDATE ON channel_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quick_replies_updated_at BEFORE UPDATE ON quick_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
