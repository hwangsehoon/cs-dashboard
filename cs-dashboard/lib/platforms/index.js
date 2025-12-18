/**
 * 플랫폼 통합 동기화 서비스
 * 
 * 모든 플랫폼의 문의를 가져와 통합 DB에 저장합니다.
 */

import { KakaoChannelAPI } from './kakao';
import { NaverCommerceAPI } from './naver';
import { CoupangAPI } from './coupang';
import { db } from '../supabase';

// 플랫폼별 API 클래스 매핑
const platformAPIs = {
  kakao: KakaoChannelAPI,
  smartstore_inquiry: NaverCommerceAPI,
  smartstore_talk: NaverCommerceAPI,
  naverpay: NaverCommerceAPI,
  coupang: CoupangAPI,
};

// API 인스턴스 생성
export function createPlatformAPI(channelConfig) {
  const APIClass = platformAPIs[channelConfig.channel_type];
  if (!APIClass) {
    throw new Error(`지원하지 않는 채널 타입: ${channelConfig.channel_type}`);
  }
  return new APIClass(channelConfig);
}

// 단일 채널 동기화
export async function syncChannel(channelConfig) {
  const log = await db.createSyncLog({
    channel_config_id: channelConfig.id,
    status: 'in_progress',
    started_at: new Date().toISOString(),
  });

  try {
    const api = createPlatformAPI(channelConfig);
    let ticketsSynced = 0;

    // 채널 타입별 문의 가져오기
    let result;
    switch (channelConfig.channel_type) {
      case 'kakao':
        result = await api.getInquiries();
        if (result.success) {
          for (const inquiry of result.data) {
            const ticket = api.transformToTicket(inquiry, channelConfig.brand_id);
            await upsertTicket(ticket);
            ticketsSynced++;
          }
        }
        break;

      case 'smartstore_inquiry':
        result = await api.getProductInquiries();
        if (result.success) {
          for (const inquiry of result.data) {
            const ticket = api.transformInquiryToTicket(
              inquiry,
              channelConfig.brand_id,
              'smartstore_inquiry'
            );
            await upsertTicket(ticket);
            ticketsSynced++;
          }
        }
        break;

      case 'smartstore_talk':
        result = await api.getTalkMessages();
        if (result.success) {
          for (const talk of result.data) {
            const ticket = api.transformTalkToTicket(talk, channelConfig.brand_id);
            await upsertTicket(ticket);
            ticketsSynced++;
          }
        }
        break;

      case 'naverpay':
        // 클레임 + 고객문의 모두 가져오기
        const claimsResult = await api.getOrderClaims();
        if (claimsResult.success) {
          for (const claim of claimsResult.data) {
            const ticket = api.transformClaimToTicket(claim, channelConfig.brand_id);
            await upsertTicket(ticket);
            ticketsSynced++;
          }
        }
        const inquiriesResult = await api.getCustomerInquiries();
        if (inquiriesResult.success) {
          for (const inquiry of inquiriesResult.data) {
            const ticket = api.transformInquiryToTicket(
              inquiry,
              channelConfig.brand_id,
              'naverpay'
            );
            await upsertTicket(ticket);
            ticketsSynced++;
          }
        }
        break;

      case 'coupang':
        result = await api.getInquiries();
        if (result.success) {
          for (const inquiry of result.data) {
            const ticket = api.transformToTicket(inquiry, channelConfig.brand_id);
            await upsertTicket(ticket);
            ticketsSynced++;
          }
        }
        // 반품/취소 요청도 가져오기
        const returnsResult = await api.getReturnRequests();
        if (returnsResult.success) {
          for (const ret of returnsResult.data) {
            const ticket = api.transformClaimToTicket(ret, channelConfig.brand_id, 'return');
            await upsertTicket(ticket);
            ticketsSynced++;
          }
        }
        break;
    }

    // 동기화 완료 로그 업데이트
    await db.updateSyncLog(log.id, {
      status: 'success',
      tickets_synced: ticketsSynced,
      completed_at: new Date().toISOString(),
    });

    // 채널 설정의 마지막 동기화 시간 업데이트
    await db.upsertChannelConfig({
      id: channelConfig.id,
      last_synced_at: new Date().toISOString(),
    });

    return { success: true, ticketsSynced };
  } catch (error) {
    console.error('채널 동기화 실패:', error);
    
    await db.updateSyncLog(log.id, {
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString(),
    });

    return { success: false, error: error.message };
  }
}

// 모든 활성 채널 동기화
export async function syncAllChannels() {
  const configs = await db.getChannelConfigs();
  const activeConfigs = configs.filter(c => c.is_active && c.api_key);
  
  const results = [];
  for (const config of activeConfigs) {
    const result = await syncChannel(config);
    results.push({
      channel_id: config.id,
      channel_type: config.channel_type,
      brand_name: config.brands?.name,
      ...result,
    });
  }

  return results;
}

// 티켓 Upsert (external_id로 중복 체크)
async function upsertTicket(ticketData) {
  const existing = await db.getTickets({ 
    external_id: ticketData.external_id,
    channel_type: ticketData.channel_type,
  });

  if (existing.length > 0) {
    // 기존 티켓 업데이트 (메시지는 유지)
    return db.updateTicket(existing[0].id, {
      subject: ticketData.subject,
      status: ticketData.status,
      metadata: ticketData.metadata,
    });
  } else {
    // 새 티켓 생성
    return db.createTicket(ticketData);
  }
}

// 메시지 전송 (플랫폼으로)
export async function sendMessageToPlatform(ticket, message) {
  const channelConfig = await db.getChannelConfigs(ticket.brand_id);
  const config = channelConfig.find(c => c.channel_type === ticket.channel_type);
  
  if (!config || !config.api_key) {
    throw new Error('채널 설정을 찾을 수 없습니다.');
  }

  const api = createPlatformAPI(config);
  let result;

  switch (ticket.channel_type) {
    case 'kakao':
      result = await api.sendMessage(ticket.external_id, message);
      break;
    case 'smartstore_inquiry':
      result = await api.answerInquiry(ticket.external_id, message);
      break;
    case 'smartstore_talk':
      result = await api.sendTalkMessage(ticket.customer_id, message);
      break;
    case 'naverpay':
      // 네이버페이는 별도 답변 API 필요
      result = await api.answerInquiry(ticket.external_id, message);
      break;
    case 'coupang':
      result = await api.answerInquiry(ticket.external_id, message);
      break;
    default:
      throw new Error(`지원하지 않는 채널: ${ticket.channel_type}`);
  }

  if (result.success) {
    // DB에 메시지 저장
    await db.createMessage({
      ticket_id: ticket.id,
      sender_type: 'agent',
      sender_name: '상담사',
      content: message,
    });

    // 티켓 상태 업데이트
    if (ticket.status === 'pending') {
      await db.updateTicket(ticket.id, { status: 'in_progress' });
    }
  }

  return result;
}

export { KakaoChannelAPI, NaverCommerceAPI, CoupangAPI };
