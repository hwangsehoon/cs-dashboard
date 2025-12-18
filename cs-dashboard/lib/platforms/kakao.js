/**
 * 카카오 비즈니스 채널 API 연동
 * 
 * 카카오 비즈 채널 상담 메시지를 가져오고 응답합니다.
 * API 문서: https://developers.kakao.com/docs/latest/ko/kakaotalk-channel/rest-api
 */

import axios from 'axios';

const KAKAO_API_BASE = 'https://kapi.kakao.com';
const KAKAO_BIZ_API_BASE = 'https://bizmessage-api.kakao.com';

export class KakaoChannelAPI {
  constructor(config) {
    this.adminKey = config.api_key; // Admin Key
    this.channelId = config.store_id; // 채널 ID
    this.accessToken = config.access_token;
  }

  // 헤더 생성
  getHeaders() {
    return {
      'Authorization': `KakaoAK ${this.adminKey}`,
      'Content-Type': 'application/json',
    };
  }

  // 상담 목록 조회 (카카오톡 채널 상담 API)
  async getInquiries(cursor = null, limit = 100) {
    try {
      const params = { limit };
      if (cursor) params.cursor = cursor;

      const response = await axios.get(
        `${KAKAO_BIZ_API_BASE}/v1/channels/${this.channelId}/consultations`,
        {
          headers: this.getHeaders(),
          params,
        }
      );

      return {
        success: true,
        data: response.data.consultations || [],
        nextCursor: response.data.cursor,
        hasMore: response.data.has_more,
      };
    } catch (error) {
      console.error('카카오 상담 목록 조회 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: [],
      };
    }
  }

  // 상담 메시지 조회
  async getMessages(consultationId, cursor = null) {
    try {
      const params = { limit: 100 };
      if (cursor) params.cursor = cursor;

      const response = await axios.get(
        `${KAKAO_BIZ_API_BASE}/v1/channels/${this.channelId}/consultations/${consultationId}/messages`,
        {
          headers: this.getHeaders(),
          params,
        }
      );

      return {
        success: true,
        data: response.data.messages || [],
        nextCursor: response.data.cursor,
      };
    } catch (error) {
      console.error('카카오 메시지 조회 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: [],
      };
    }
  }

  // 메시지 전송
  async sendMessage(consultationId, message) {
    try {
      const response = await axios.post(
        `${KAKAO_BIZ_API_BASE}/v1/channels/${this.channelId}/consultations/${consultationId}/messages`,
        {
          message_type: 'text',
          content: { text: message },
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('카카오 메시지 전송 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // 데이터 변환: 카카오 -> 내부 형식
  transformToTicket(consultation, brandId) {
    return {
      brand_id: brandId,
      channel_type: 'kakao',
      external_id: consultation.id,
      customer_name: consultation.user?.nickname || '카카오 고객',
      customer_id: consultation.user?.id,
      subject: consultation.last_message?.content?.text?.substring(0, 100) || '카카오톡 문의',
      status: consultation.status === 'closed' ? 'resolved' : 'pending',
      priority: 'medium',
      metadata: {
        platform: 'kakao',
        channel_id: this.channelId,
        original_data: consultation,
      },
    };
  }

  transformToMessage(msg, ticketId) {
    return {
      ticket_id: ticketId,
      external_id: msg.id,
      sender_type: msg.sender_type === 'user' ? 'customer' : 'agent',
      sender_name: msg.sender?.nickname || (msg.sender_type === 'user' ? '고객' : '상담사'),
      content: msg.content?.text || '',
      created_at: msg.created_at,
    };
  }
}

export default KakaoChannelAPI;
