import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경변수가 설정되지 않았습니다. 데모 모드로 실행됩니다.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 데이터베이스 헬퍼 함수들
export const db = {
  // 브랜드
  async getBrands() {
    if (!supabase) return [];
    const { data, error } = await supabase.from('brands').select('*').order('created_at');
    if (error) throw error;
    return data;
  },

  // 채널 설정
  async getChannelConfigs(brandId = null) {
    if (!supabase) return [];
    let query = supabase.from('channel_configs').select('*, brands(name, icon, color)');
    if (brandId) query = query.eq('brand_id', brandId);
    const { data, error } = await query.order('created_at');
    if (error) throw error;
    return data;
  },

  async upsertChannelConfig(config) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('channel_configs')
      .upsert(config)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteChannelConfig(id) {
    if (!supabase) return;
    const { error } = await supabase.from('channel_configs').delete().eq('id', id);
    if (error) throw error;
  },

  // 티켓
  async getTickets(filters = {}) {
    if (!supabase) return [];
    let query = supabase
      .from('tickets')
      .select('*, brands(name, icon, color), messages(*)');
    
    if (filters.brandId && filters.brandId !== 'all') {
      query = query.eq('brand_id', filters.brandId);
    }
    if (filters.channelType && filters.channelType !== 'all') {
      query = query.eq('channel_type', filters.channelType);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getTicket(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('tickets')
      .select('*, brands(name, icon, color), messages(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createTicket(ticket) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTicket(id, updates) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markTicketAsRead(id) {
    return this.updateTicket(id, { is_read: true });
  },

  // 메시지
  async getMessages(ticketId) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at');
    if (error) throw error;
    return data;
  },

  async createMessage(message) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 빠른 답변
  async getQuickReplies(brandId = null) {
    if (!supabase) return [];
    let query = supabase.from('quick_replies').select('*');
    if (brandId) {
      query = query.or(`brand_id.eq.${brandId},brand_id.is.null`);
    }
    const { data, error } = await query.order('usage_count', { ascending: false });
    if (error) throw error;
    return data;
  },

  async incrementQuickReplyUsage(id) {
    if (!supabase) return;
    const { error } = await supabase.rpc('increment_quick_reply_usage', { reply_id: id });
    if (error) console.error('Failed to increment usage:', error);
  },

  // 동기화 로그
  async createSyncLog(log) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sync_logs')
      .insert(log)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSyncLog(id, updates) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sync_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 통계
  async getStats(brandId = null, channelType = null) {
    if (!supabase) return { total: 0, pending: 0, inProgress: 0, resolved: 0 };
    
    let query = supabase.from('tickets').select('status', { count: 'exact' });
    if (brandId && brandId !== 'all') query = query.eq('brand_id', brandId);
    if (channelType && channelType !== 'all') query = query.eq('channel_type', channelType);

    const { data, error } = await query;
    if (error) throw error;

    const stats = { total: 0, pending: 0, inProgress: 0, resolved: 0 };
    data?.forEach(ticket => {
      stats.total++;
      if (ticket.status === 'pending') stats.pending++;
      else if (ticket.status === 'in_progress') stats.inProgress++;
      else if (ticket.status === 'resolved') stats.resolved++;
    });
    return stats;
  }
};

export default supabase;
