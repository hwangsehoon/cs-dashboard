/**
 * 네이버 커머스 API 연동
 * 
 * 스마트스토어 문의, 톡톡, 네이버페이센터 문의를 가져오고 응답합니다.
 * API 문서: https://developers.naver.com/docs/commerce/api/main/
 */

import axios from 'axios';
import crypto from 'crypto';

const NAVER_COMMERCE_API_BASE = 'https://api.commerce.naver.com';

export class NaverCommerceAPI {
  constructor(config) {
    this.clientId = config.api_key;
    this.clientSecret = config.api_secret;
    this.accessToken = config.access_token;
    this.refreshToken = config.refresh_token;
    this.storeId = config.store_id; // 스마트스토어 ID
  }

  // HMAC 서명 생성 (네이버 커머스 API 인증용)
  generateSignature(timestamp, method, uri) {
    const message = `${timestamp}.${method}.${uri}`;
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(message)
      .digest('base64');
  }

  // 헤더 생성
  getHeaders(method, uri) {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(timestamp, method, uri);
    
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'x-ncp-apigw-timestamp': timestamp,
      'x-ncp-iam-access-key': this.clientId,
      'x-ncp-apigw-signature-v2': signature,
      'Content-Type': 'application/json',
    };
  }

  // ============================================
  // 스마트스토어 문의 API
  // ============================================
  
  // 상품 Q&A 목록 조회
  async getProductInquiries(page = 1, size = 100) {
    const uri = `/external/v1/seller/inquiries`;
    try {
      const response = await axios.get(
        `${NAVER_COMMERCE_API_BASE}${uri}`,
        {
          headers: this.getHeaders('GET', uri),
          params: {
            page,
            size,
            answered: false, // 미답변만
          },
        }
      );

      return {
        success: true,
        data: response.data.contents || [],
        totalCount: response.data.totalElements,
        hasMore: response.data.last === false,
      };
    } catch (error) {
      console.error('스마트스토어 문의 조회 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: [],
      };
    }
  }

  // 문의 답변 등록
  async answerInquiry(inquiryId, answer) {
    const uri = `/external/v1/seller/inquiries/${inquiryId}/answer`;
    try {
      const response = await axios.post(
        `${NAVER_COMMERCE_API_BASE}${uri}`,
        { answerContent: answer },
        { headers: this.getHeaders('POST', uri) }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('문의 답변 등록 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // ============================================
  // 스마트스토어 톡톡 API
  // ============================================

  // 톡톡 메시지 목록 조회
  async getTalkMessages(page = 1, size = 100) {
    const uri = `/external/v1/seller/talk/messages`;
    try {
      const response = await axios.get(
        `${NAVER_COMMERCE_API_BASE}${uri}`,
        {
          headers: this.getHeaders('GET', uri),
          params: { page, size },
        }
      );

      return {
        success: true,
        data: response.data.contents || [],
        totalCount: response.data.totalElements,
        hasMore: response.data.last === false,
      };
    } catch (error) {
      console.error('톡톡 메시지 조회 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: [],
      };
    }
  }

  // 톡톡 메시지 전송
  async sendTalkMessage(customerId, message) {
    const uri = `/external/v1/seller/talk/messages`;
    try {
      const response = await axios.post(
        `${NAVER_COMMERCE_API_BASE}${uri}`,
        {
          memberId: customerId,
          messageType: 'TEXT',
          textContent: message,
        },
        { headers: this.getHeaders('POST', uri) }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('톡톡 메시지 전송 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // ============================================
  // 네이버페이 주문 문의 API
  // ============================================

  // 주문 클레임 (환불/교환/취소 요청) 목록
  async getOrderClaims(page = 1, size = 100) {
    const uri = `/external/v1/seller/claims`;
    try {
      const response = await axios.get(
        `${NAVER_COMMERCE_API_BASE}${uri}`,
        {
          headers: this.getHeaders('GET', uri),
          params: {
            page,
            size,
            claimStatus: 'CLAIM_REQUESTED', // 요청된 건만
          },
        }
      );

      return {
        success: true,
        data: response.data.contents || [],
        totalCount: response.data.totalElements,
        hasMore: response.data.last === false,
      };
    } catch (error) {
      console.error('주문 클레임 조회 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: [],
      };
    }
  }

  // 고객 문의 목록 (네이버페이센터)
  async getCustomerInquiries(page = 1, size = 100) {
    const uri = `/external/v1/seller/customer-inquiries`;
    try {
      const response = await axios.get(
        `${NAVER_COMMERCE_API_BASE}${uri}`,
        {
          headers: this.getHeaders('GET', uri),
          params: {
            page,
            size,
            answered: false,
          },
        }
      );

      return {
        success: true,
        data: response.data.contents || [],
        totalCount: response.data.totalElements,
        hasMore: response.data.last === false,
      };
    } catch (error) {
      console.error('고객 문의 조회 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: [],
      };
    }
  }

  // ============================================
  // 데이터 변환
  // ============================================

  // 스마트스토어 문의 -> 내부 형식
  transformInquiryToTicket(inquiry, brandId, channelType = 'smartstore_inquiry') {
    return {
      brand_id: brandId,
      channel_type: channelType,
      external_id: inquiry.inquiryNo?.toString(),
      customer_name: inquiry.memberIdMasked || '네이버 고객',
      customer_id: inquiry.memberId,
      subject: inquiry.title || inquiry.content?.substring(0, 100) || '스마트스토어 문의',
      status: inquiry.answered ? 'resolved' : 'pending',
      priority: 'medium',
      order_number: inquiry.orderNo,
      product_name: inquiry.productName,
      metadata: {
        platform: 'naver',
        channel_type: channelType,
        store_id: this.storeId,
        original_data: inquiry,
      },
    };
  }

  // 톡톡 -> 내부 형식
  transformTalkToTicket(talk, brandId) {
    return {
      brand_id: brandId,
      channel_type: 'smartstore_talk',
      external_id: talk.messageNo?.toString(),
      customer_name: talk.memberIdMasked || '네이버 고객',
      customer_id: talk.memberId,
      subject: talk.content?.substring(0, 100) || '톡톡 문의',
      status: 'pending',
      priority: 'medium',
      metadata: {
        platform: 'naver',
        channel_type: 'smartstore_talk',
        store_id: this.storeId,
        original_data: talk,
      },
    };
  }

  // 네이버페이 클레임 -> 내부 형식
  transformClaimToTicket(claim, brandId) {
    const priorityMap = {
      'CANCEL': 'high',
      'RETURN': 'high',
      'EXCHANGE': 'medium',
    };

    return {
      brand_id: brandId,
      channel_type: 'naverpay',
      external_id: claim.claimId?.toString(),
      customer_name: claim.ordererName || '네이버페이 고객',
      customer_id: claim.ordererId,
      subject: `[${claim.claimType}] ${claim.claimReason || '네이버페이 문의'}`,
      status: 'pending',
      priority: priorityMap[claim.claimType] || 'medium',
      order_number: claim.orderNo,
      product_name: claim.productName,
      metadata: {
        platform: 'naver',
        channel_type: 'naverpay',
        claim_type: claim.claimType,
        original_data: claim,
      },
    };
  }

  transformToMessage(data, ticketId, senderType = 'customer') {
    return {
      ticket_id: ticketId,
      external_id: data.messageNo?.toString() || data.inquiryNo?.toString(),
      sender_type: senderType,
      sender_name: senderType === 'customer' ? (data.memberIdMasked || '고객') : '상담사',
      content: data.content || data.answerContent || '',
      created_at: data.createdAt || data.registeredAt,
    };
  }
}

export default NaverCommerceAPI;
