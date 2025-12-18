/**
 * 쿠팡 Wing API 연동
 * 
 * 쿠팡 마켓플레이스 문의를 가져오고 응답합니다.
 * API 문서: https://developers.coupang.com/
 */

import axios from 'axios';
import crypto from 'crypto';

const COUPANG_API_BASE = 'https://api-gateway.coupang.com';

export class CoupangAPI {
  constructor(config) {
    this.accessKey = config.api_key;
    this.secretKey = config.api_secret;
    this.vendorId = config.store_id; // Vendor ID
  }

  // HMAC 서명 생성 (쿠팡 API 인증용)
  generateSignature(method, uri, datetime) {
    const message = datetime + method + uri;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('hex');
  }

  // 헤더 생성
  getHeaders(method, uri) {
    const datetime = new Date().toISOString().split('.')[0] + 'Z';
    const signature = this.generateSignature(method, uri, datetime);
    const authorization = `CEA algorithm=HmacSHA256, access-key=${this.accessKey}, signed-date=${datetime}, signature=${signature}`;

    return {
      'Authorization': authorization,
      'Content-Type': 'application/json;charset=UTF-8',
      'X-EXTENDED-TIMEOUT': '90000',
    };
  }

  // ============================================
  // 고객 문의 API
  // ============================================

  // 고객 문의 목록 조회
  async getInquiries(page = 1, pageSize = 50, answered = false) {
    const uri = `/v2/providers/seller_api/apis/api/v1/vendors/${this.vendorId}/inquiries`;
    try {
      const response = await axios.get(
        `${COUPANG_API_BASE}${uri}`,
        {
          headers: this.getHeaders('GET', uri),
          params: {
            page,
            pageSize,
            answered: answered ? 'Y' : 'N',
          },
        }
      );

      const data = response.data?.data || [];
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
        totalCount: response.data?.pagination?.totalElements || 0,
        hasMore: response.data?.pagination?.totalPages > page,
      };
    } catch (error) {
      console.error('쿠팡 문의 조회 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: [],
      };
    }
  }

  // 문의 상세 조회
  async getInquiryDetail(inquiryId) {
    const uri = `/v2/providers/seller_api/apis/api/v1/vendors/${this.vendorId}/inquiries/${inquiryId}`;
    try {
      const response = await axios.get(
        `${COUPANG_API_BASE}${uri}`,
        { headers: this.getHeaders('GET', uri) }
      );

      return {
        success: true,
        data: response.data?.data || null,
      };
    } catch (error) {
      console.error('쿠팡 문의 상세 조회 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // 문의 답변 등록
  async answerInquiry(inquiryId, answer) {
    const uri = `/v2/providers/seller_api/apis/api/v1/vendors/${this.vendorId}/inquiries/${inquiryId}/answers`;
    try {
      const response = await axios.post(
        `${COUPANG_API_BASE}${uri}`,
        { content: answer },
        { headers: this.getHeaders('POST', uri) }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('쿠팡 문의 답변 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // ============================================
  // 클레임 (반품/환불/교환) API
  // ============================================

  // 반품 요청 목록
  async getReturnRequests(page = 1, pageSize = 50) {
    const uri = `/v2/providers/seller_api/apis/api/v1/vendors/${this.vendorId}/return-requests`;
    try {
      const response = await axios.get(
        `${COUPANG_API_BASE}${uri}`,
        {
          headers: this.getHeaders('GET', uri),
          params: {
            page,
            pageSize,
            status: 'REQUESTED', // 요청된 건만
          },
        }
      );

      return {
        success: true,
        data: response.data?.data || [],
        totalCount: response.data?.pagination?.totalElements || 0,
      };
    } catch (error) {
      console.error('쿠팡 반품 요청 조회 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: [],
      };
    }
  }

  // 취소 요청 목록
  async getCancelRequests(page = 1, pageSize = 50) {
    const uri = `/v2/providers/seller_api/apis/api/v1/vendors/${this.vendorId}/cancel-requests`;
    try {
      const response = await axios.get(
        `${COUPANG_API_BASE}${uri}`,
        {
          headers: this.getHeaders('GET', uri),
          params: { page, pageSize },
        }
      );

      return {
        success: true,
        data: response.data?.data || [],
        totalCount: response.data?.pagination?.totalElements || 0,
      };
    } catch (error) {
      console.error('쿠팡 취소 요청 조회 실패:', error.response?.data || error.message);
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

  // 쿠팡 문의 -> 내부 형식
  transformToTicket(inquiry, brandId) {
    // 브랜드 추측 (상품명이나 카테고리로)
    const actualBrandId = brandId; // 실제로는 상품 정보로 브랜드 매칭 필요

    return {
      brand_id: actualBrandId,
      channel_type: 'coupang',
      external_id: inquiry.inquiryId?.toString(),
      customer_name: inquiry.customerName || '쿠팡 고객',
      customer_id: inquiry.customerId,
      subject: inquiry.title || inquiry.content?.substring(0, 100) || '쿠팡 문의',
      status: inquiry.answered ? 'resolved' : 'pending',
      priority: inquiry.inquiryType === 'CLAIM' ? 'high' : 'medium',
      order_number: inquiry.orderId,
      product_name: inquiry.productName,
      metadata: {
        platform: 'coupang',
        vendor_id: this.vendorId,
        inquiry_type: inquiry.inquiryType,
        product_id: inquiry.productId,
        original_data: inquiry,
      },
    };
  }

  // 반품/취소 요청 -> 내부 형식
  transformClaimToTicket(claim, brandId, claimType = 'return') {
    return {
      brand_id: brandId,
      channel_type: 'coupang',
      external_id: claim.receiptId?.toString() || claim.cancelId?.toString(),
      customer_name: claim.customerName || '쿠팡 고객',
      customer_id: claim.customerId,
      subject: `[${claimType === 'return' ? '반품' : '취소'}] ${claim.reason || '요청'}`,
      status: 'pending',
      priority: 'high',
      order_number: claim.orderId,
      product_name: claim.productName,
      metadata: {
        platform: 'coupang',
        vendor_id: this.vendorId,
        claim_type: claimType,
        original_data: claim,
      },
    };
  }

  transformToMessage(inquiry, ticketId) {
    return {
      ticket_id: ticketId,
      external_id: inquiry.inquiryId?.toString(),
      sender_type: 'customer',
      sender_name: inquiry.customerName || '고객',
      content: inquiry.content || '',
      created_at: inquiry.createdAt,
    };
  }
}

export default CoupangAPI;
