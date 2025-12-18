'use client';

import { useState, useEffect } from 'react';
import { Settings, RefreshCw, Search, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';

// 브랜드 설정
const brands = [
  { id: 'all', name: '전체', color: '#6366f1', icon: '📊' },
  { id: 'azacha', name: '아자차', color: '#ef4444', icon: '🚗' },
  { id: 'bandreup', name: '반드럽', color: '#10b981', icon: '🧴' },
  { id: 'wintor', name: '윈토르', color: '#3b82f6', icon: '❄️' },
  { id: 'wellbiogen', name: '웰바이오젠', color: '#f59e0b', icon: '🧬' },
];

// 채널 설정
const channels = [
  { id: 'all', name: '전체 채널', icon: '📱', color: '#6366f1' },
  { id: 'kakao', name: '카카오채널', icon: '💬', color: '#FEE500' },
  { id: 'smartstore_inquiry', name: '스마트스토어 문의', icon: '📝', color: '#03C75A' },
  { id: 'smartstore_talk', name: '스마트스토어 톡톡', icon: '💚', color: '#03C75A' },
  { id: 'coupang', name: '쿠팡', icon: '🚀', color: '#E31837' },
  { id: 'naverpay', name: '네이버페이센터', icon: '💳', color: '#1EC800' },
];

// 브랜드별 채널 매핑
const brandChannels = {
  azacha: ['kakao', 'smartstore_inquiry', 'smartstore_talk', 'coupang', 'naverpay'],
  bandreup: ['kakao', 'coupang', 'naverpay'],
  wintor: ['kakao', 'smartstore_inquiry', 'smartstore_talk', 'coupang', 'naverpay'],
  wellbiogen: ['kakao', 'coupang', 'naverpay'],
};

// 빠른 답변
const defaultQuickReplies = [
  '안녕하세요, 문의 감사합니다.',
  '불편을 드려 죄송합니다.',
  '주문번호를 알려주시겠어요?',
  '확인 후 안내드리겠습니다.',
  '추가 문의사항 있으시면 말씀해주세요!',
  '교환/환불 접수 도와드리겠습니다.',
];

// 상태 설정
const statusConfig = {
  pending: { label: '대기중', color: '#ef4444', bg: '#fef2f2' },
  in_progress: { label: '처리중', color: '#f59e0b', bg: '#fffbeb' },
  resolved: { label: '완료', color: '#10b981', bg: '#ecfdf5' },
};

export default function Dashboard() {
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      
      if (data.tickets && data.tickets.length > 0) {
        setTickets(data.tickets);
        setIsDemo(false);
      } else {
        // 데모 데이터 사용
        setTickets(getDemoTickets());
        setIsDemo(true);
      }
    } catch (error) {
      console.error('티켓 로드 실패:', error);
      setTickets(getDemoTickets());
      setIsDemo(true);
    }
    setIsLoading(false);
  };

  // 동기화 실행
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await loadTickets();
        alert(`동기화 완료! ${data.totalSynced}건의 문의를 가져왔습니다.`);
      } else {
        alert('동기화 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      alert('동기화 중 오류가 발생했습니다.');
    }
    setIsSyncing(false);
  };

  // 필터링된 티켓
  const filteredTickets = tickets.filter(ticket => {
    const brandMatch = selectedBrand === 'all' || ticket.brand_id === selectedBrand || ticket.brand === selectedBrand;
    const channelMatch = selectedChannel === 'all' || ticket.channel_type === selectedChannel || ticket.channel === selectedChannel;
    const statusMatch = statusFilter === 'all' || ticket.status === statusFilter;
    const searchMatch = searchQuery === '' || 
      (ticket.customer_name || ticket.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
    return brandMatch && channelMatch && statusMatch && searchMatch;
  });

  // 통계
  const getStats = () => {
    const filtered = tickets.filter(t => 
      (selectedBrand === 'all' || t.brand_id === selectedBrand || t.brand === selectedBrand) &&
      (selectedChannel === 'all' || t.channel_type === selectedChannel || t.channel === selectedChannel)
    );
    return {
      total: filtered.length,
      pending: filtered.filter(t => t.status === 'pending').length,
      inProgress: filtered.filter(t => t.status === 'in_progress').length,
      resolved: filtered.filter(t => t.status === 'resolved').length,
    };
  };

  const stats = getStats();

  // 브랜드 정보 가져오기
  const getBrandInfo = (brandId) => {
    return brands.find(b => b.id === brandId) || brands.find(b => b.name === brandId) || brands[0];
  };

  // 채널 정보 가져오기
  const getChannelInfo = (channelId) => {
    return channels.find(c => c.id === channelId) || channels[0];
  };

  // 사용 가능한 채널 필터
  const availableChannels = selectedBrand === 'all' 
    ? channels 
    : [channels[0], ...channels.filter(c => c.id !== 'all' && brandChannels[selectedBrand]?.includes(c.id))];

  // 메시지 전송
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    const newMessage = {
      id: Date.now(),
      sender_type: 'agent',
      sender_name: '상담사',
      content: replyText,
      created_at: new Date().toISOString(),
    };

    // UI 업데이트
    setTickets(prev => prev.map(ticket => 
      (ticket.id === selectedTicket.id)
        ? { 
            ...ticket, 
            messages: [...(ticket.messages || []), newMessage],
            status: ticket.status === 'pending' ? 'in_progress' : ticket.status,
          }
        : ticket
    ));

    setSelectedTicket(prev => ({
      ...prev,
      messages: [...(prev.messages || []), newMessage],
      status: prev.status === 'pending' ? 'in_progress' : prev.status,
    }));

    // API 호출 (실제 플랫폼으로 전송)
    if (!isDemo) {
      try {
        await fetch('/api/tickets/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: selectedTicket.id,
            message: replyText,
          }),
        });
      } catch (error) {
        console.error('메시지 전송 실패:', error);
      }
    }

    setReplyText('');
  };

  // 상태 변경
  const updateTicketStatus = async (ticketId, newStatus) => {
    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
    ));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
    }

    if (!isDemo) {
      try {
        await fetch('/api/tickets/status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, status: newStatus }),
        });
      } catch (error) {
        console.error('상태 변경 실패:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
            💬
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">CS 통합 대시보드</h1>
            <p className="text-xs text-slate-400">
              4개 브랜드 · 13개 채널 통합 관리
              {isDemo && <span className="ml-2 text-amber-400">(데모 모드)</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {stats.pending > 0 && (
            <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-dot"></span>
              대기 {stats.pending}건
            </div>
          )}
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="문의 동기화"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <Link 
            href="/settings"
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
            title="설정"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800/50 border-r border-white/5 p-5 flex flex-col gap-6 overflow-y-auto">
          {/* 브랜드 필터 */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">브랜드</h3>
            <div className="flex flex-col gap-1">
              {brands.map(brand => {
                const count = brand.id === 'all' 
                  ? tickets.length 
                  : tickets.filter(t => t.brand_id === brand.id || t.brand === brand.id).length;
                const isActive = selectedBrand === brand.id;
                
                return (
                  <button
                    key={brand.id}
                    onClick={() => {
                      setSelectedBrand(brand.id);
                      setSelectedChannel('all');
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all btn-hover ${
                      isActive 
                        ? 'text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    style={isActive ? { 
                      background: `linear-gradient(135deg, ${brand.color}20, ${brand.color}10)`,
                      borderColor: `${brand.color}40`,
                    } : {}}
                  >
                    <span className="text-lg">{brand.icon}</span>
                    <span className="flex-1 text-left text-sm font-medium">{brand.name}</span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ 
                        background: isActive ? brand.color : '#475569',
                        color: '#fff',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 채널 필터 */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">채널</h3>
            <div className="flex flex-col gap-1">
              {availableChannels.map(channel => {
                const count = channel.id === 'all'
                  ? filteredTickets.length
                  : tickets.filter(t => 
                      (t.channel_type === channel.id || t.channel === channel.id) && 
                      (selectedBrand === 'all' || t.brand_id === selectedBrand || t.brand === selectedBrand)
                    ).length;
                const isActive = selectedChannel === channel.id;
                const displayColor = channel.color === '#FEE500' ? '#B8860B' : channel.color;
                
                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                      isActive 
                        ? 'text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    style={isActive ? { 
                      background: `${channel.color}20`,
                    } : {}}
                  >
                    <span>{channel.icon}</span>
                    <span className="flex-1 text-left">{channel.name}</span>
                    <span className="text-xs text-slate-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 통계 */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">통계</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '전체', value: stats.total, color: '#6366f1' },
                { label: '대기', value: stats.pending, color: '#ef4444' },
                { label: '처리중', value: stats.inProgress, color: '#f59e0b' },
                { label: '완료', value: stats.resolved, color: '#10b981' },
              ].map(stat => (
                <div key={stat.label} className="bg-slate-700/50 rounded-lg p-3 text-center card-hover">
                  <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 상태 필터 */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">상태 필터</h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기중</option>
              <option value="in_progress">처리중</option>
              <option value="resolved">완료</option>
            </select>
          </div>
        </aside>

        {/* Ticket List */}
        <div className="w-96 bg-slate-800/30 border-r border-white/5 flex flex-col">
          {/* 검색 */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="고객명, 제목 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {/* 티켓 목록 */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                로딩 중...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="text-4xl mb-3">📭</div>
                <div>문의가 없습니다</div>
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const brand = getBrandInfo(ticket.brand_id || ticket.brand);
                const channel = getChannelInfo(ticket.channel_type || ticket.channel);
                const status = statusConfig[ticket.status];
                const isActive = selectedTicket?.id === ticket.id;
                const channelColor = channel.color === '#FEE500' ? '#B8860B' : channel.color;
                
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`ticket-item p-4 rounded-xl cursor-pointer mb-2 border-l-4 ${
                      isActive ? 'bg-indigo-500/10' : ''
                    } ${ticket.is_read === false || ticket.unread ? '' : 'border-transparent'}`}
                    style={{ 
                      borderLeftColor: ticket.is_read === false || ticket.unread ? brand.color : 'transparent'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{ background: `linear-gradient(135deg, ${brand.color}30, ${brand.color}10)` }}
                      >
                        {ticket.avatar || '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm text-white">
                            {ticket.customer_name || ticket.customer || '고객'}
                          </span>
                          <span 
                            className="text-xs px-2 py-0.5 rounded font-semibold"
                            style={{ background: status.bg, color: status.color }}
                          >
                            {status.label}
                          </span>
                          {ticket.priority === 'high' && <span>🔥</span>}
                        </div>
                        <div className="text-sm text-slate-300 mb-1 font-medium truncate">
                          {ticket.subject || '문의'}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {ticket.lastMessage || (ticket.messages?.[ticket.messages.length - 1]?.content) || ''}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span 
                            className="channel-tag"
                            style={{ background: `${brand.color}20`, color: brand.color }}
                          >
                            {brand.icon} {brand.name}
                          </span>
                          <span 
                            className="channel-tag"
                            style={{ background: `${channel.color}20`, color: channelColor }}
                          >
                            {channel.icon} {channel.name}
                          </span>
                          <span className="text-xs text-slate-500 ml-auto">
                            {ticket.timestamp || formatTime(ticket.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-900/50">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-white/5 bg-slate-800/50 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${getBrandInfo(selectedTicket.brand_id || selectedTicket.brand).color}30, ${getBrandInfo(selectedTicket.brand_id || selectedTicket.brand).color}10)` 
                    }}
                  >
                    {selectedTicket.avatar || '👤'}
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      {selectedTicket.customer_name || selectedTicket.customer || '고객'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="channel-tag"
                        style={{ 
                          background: `${getBrandInfo(selectedTicket.brand_id || selectedTicket.brand).color}20`, 
                          color: getBrandInfo(selectedTicket.brand_id || selectedTicket.brand).color 
                        }}
                      >
                        {getBrandInfo(selectedTicket.brand_id || selectedTicket.brand).icon} {getBrandInfo(selectedTicket.brand_id || selectedTicket.brand).name}
                      </span>
                      <span 
                        className="channel-tag"
                        style={{ 
                          background: `${getChannelInfo(selectedTicket.channel_type || selectedTicket.channel).color}20`, 
                          color: getChannelInfo(selectedTicket.channel_type || selectedTicket.channel).color === '#FEE500' ? '#B8860B' : getChannelInfo(selectedTicket.channel_type || selectedTicket.channel).color
                        }}
                      >
                        {getChannelInfo(selectedTicket.channel_type || selectedTicket.channel).icon} {getChannelInfo(selectedTicket.channel_type || selectedTicket.channel).name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => updateTicketStatus(selectedTicket.id, key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all btn-hover ${
                        selectedTicket.status === key ? '' : 'bg-slate-700/50 text-slate-400'
                      }`}
                      style={selectedTicket.status === key ? { background: config.bg, color: config.color } : {}}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="px-6 py-3 bg-slate-800/30 border-b border-white/5 text-sm">
                <span className="text-slate-400">제목: </span>
                <span className="text-white font-medium">{selectedTicket.subject || '문의'}</span>
                {selectedTicket.order_number && (
                  <span className="ml-4 text-slate-400">
                    주문번호: <span className="text-slate-300">{selectedTicket.order_number}</span>
                  </span>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {(selectedTicket.messages || []).map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`message-bubble flex mb-4 ${
                      msg.sender_type === 'agent' || msg.sender === 'agent' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-3 shadow-lg ${
                        msg.sender_type === 'agent' || msg.sender === 'agent'
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl rounded-br-sm'
                          : 'bg-slate-700 rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      <div className="text-sm text-white leading-relaxed">
                        {msg.content || msg.text}
                      </div>
                      <div className={`text-xs mt-2 ${
                        msg.sender_type === 'agent' || msg.sender === 'agent' ? 'text-indigo-200 text-right' : 'text-slate-400'
                      }`}>
                        {msg.time || formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Replies */}
              <div className="px-6 py-3 border-t border-white/5 flex gap-2 flex-wrap">
                {defaultQuickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => setReplyText(reply)}
                    className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs hover:bg-indigo-500/20 transition-all btn-hover"
                  >
                    {reply.length > 15 ? reply.substring(0, 15) + '...' : reply}
                  </button>
                ))}
              </div>

              {/* Reply Input */}
              <div className="px-6 py-4 border-t border-white/5 bg-slate-800/50">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 bg-slate-700/50 rounded-xl p-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="답변을 입력하세요..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      className="w-full min-h-[44px] max-h-24 px-4 py-3 bg-transparent text-sm outline-none resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      replyText.trim()
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:scale-105'
                        : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
              <div className="text-lg font-medium mb-2">문의를 선택해주세요</div>
              <div className="text-sm">좌측 목록에서 처리할 문의를 선택하면 대화 내용이 표시됩니다</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 시간 포맷
function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return date.toLocaleDateString('ko-KR');
}

// 데모 데이터
function getDemoTickets() {
  return [
    {
      id: 1, brand: 'azacha', brand_id: 'azacha', channel: 'kakao', channel_type: 'kakao',
      customer: '김서연', customer_name: '김서연', avatar: '👩',
      status: 'pending', priority: 'high', subject: '배송 지연 문의',
      lastMessage: '주문한 지 5일이 지났는데 아직 배송이 안 왔어요.',
      timestamp: '10분 전', unread: true,
      messages: [
        { id: 1, sender: 'customer', sender_type: 'customer', text: '안녕하세요, 주문번호 AZ-20241215-001 건 문의드립니다.', content: '안녕하세요, 주문번호 AZ-20241215-001 건 문의드립니다.', time: '14:20' },
        { id: 2, sender: 'customer', sender_type: 'customer', text: '주문한 지 5일이 지났는데 아직 배송이 안 왔어요.', content: '주문한 지 5일이 지났는데 아직 배송이 안 왔어요.', time: '14:21' },
      ]
    },
    {
      id: 2, brand: 'bandreup', brand_id: 'bandreup', channel: 'naverpay', channel_type: 'naverpay',
      customer: '이준호', customer_name: '이준호', avatar: '👨',
      status: 'in_progress', priority: 'medium', subject: '환불 요청',
      lastMessage: '네, 확인해주시면 감사하겠습니다.',
      timestamp: '32분 전', unread: false,
      messages: [
        { id: 1, sender: 'customer', sender_type: 'customer', content: '제품 사용 후 피부 트러블이 생겼어요. 환불 가능할까요?', time: '13:45' },
        { id: 2, sender: 'agent', sender_type: 'agent', content: '안녕하세요 고객님, 불편을 드려 죄송합니다. 주문번호 알려주시겠어요?', time: '13:50' },
        { id: 3, sender: 'customer', sender_type: 'customer', content: 'BD-20241214-088 입니다.', time: '13:52' },
        { id: 4, sender: 'agent', sender_type: 'agent', content: '확인 중입니다. 잠시만 기다려주세요.', time: '13:55' },
        { id: 5, sender: 'customer', sender_type: 'customer', content: '네, 확인해주시면 감사하겠습니다.', time: '13:56' },
      ]
    },
    {
      id: 3, brand: 'wintor', brand_id: 'wintor', channel: 'smartstore_talk', channel_type: 'smartstore_talk',
      customer: '박민지', customer_name: '박민지', avatar: '👩‍🦰',
      status: 'pending', priority: 'low', subject: '제품 성분 문의',
      lastMessage: '아이가 알러지가 있어서 성분이 궁금해요.',
      timestamp: '1시간 전', unread: true,
      messages: [
        { id: 1, sender: 'customer', sender_type: 'customer', content: '윈터크림 성분표 좀 볼 수 있을까요?', time: '12:30' },
        { id: 2, sender: 'customer', sender_type: 'customer', content: '아이가 알러지가 있어서 성분이 궁금해요.', time: '12:31' },
      ]
    },
    {
      id: 4, brand: 'wellbiogen', brand_id: 'wellbiogen', channel: 'coupang', channel_type: 'coupang',
      customer: '최유진', customer_name: '최유진', avatar: '👱‍♀️',
      status: 'resolved', priority: 'medium', subject: '유통기한 문의',
      lastMessage: '감사합니다! 잘 확인했어요.',
      timestamp: '2시간 전', unread: false,
      messages: [
        { id: 1, sender: 'customer', sender_type: 'customer', content: '제품 유통기한이 얼마나 남았나요?', time: '10:00' },
        { id: 2, sender: 'agent', sender_type: 'agent', content: '안녕하세요, 현재 출고 제품은 2025년 12월까지입니다.', time: '10:15' },
        { id: 3, sender: 'customer', sender_type: 'customer', content: '감사합니다! 잘 확인했어요.', time: '11:30' },
      ]
    },
    {
      id: 5, brand: 'azacha', brand_id: 'azacha', channel: 'smartstore_inquiry', channel_type: 'smartstore_inquiry',
      customer: '정하늘', customer_name: '정하늘', avatar: '🧑',
      status: 'pending', priority: 'high', subject: '파손 상품 수령',
      lastMessage: '박스를 열어보니 제품이 깨져있었어요 ㅠㅠ',
      timestamp: '3시간 전', unread: true,
      messages: [
        { id: 1, sender: 'customer', sender_type: 'customer', content: '박스를 열어보니 제품이 깨져있었어요 ㅠㅠ', time: '09:15' },
      ]
    },
    {
      id: 6, brand: 'wintor', brand_id: 'wintor', channel: 'naverpay', channel_type: 'naverpay',
      customer: '한소희', customer_name: '한소희', avatar: '👩‍🦱',
      status: 'in_progress', priority: 'medium', subject: '교환 요청',
      lastMessage: '다른 색상으로 교환하고 싶어요.',
      timestamp: '4시간 전', unread: false,
      messages: [
        { id: 1, sender: 'customer', sender_type: 'customer', content: '받은 제품 색상이 생각과 달라요.', time: '08:00' },
        { id: 2, sender: 'agent', sender_type: 'agent', content: '안녕하세요, 교환 도와드리겠습니다. 원하시는 색상이 있으신가요?', time: '08:30' },
        { id: 3, sender: 'customer', sender_type: 'customer', content: '다른 색상으로 교환하고 싶어요.', time: '08:35' },
      ]
    },
    {
      id: 7, brand: 'bandreup', brand_id: 'bandreup', channel: 'kakao', channel_type: 'kakao',
      customer: '오지훈', customer_name: '오지훈', avatar: '👨‍🦲',
      status: 'pending', priority: 'high', subject: '긴급 - 오배송',
      lastMessage: '주문한 제품이랑 다른게 왔어요!',
      timestamp: '30분 전', unread: true,
      messages: [
        { id: 1, sender: 'customer', sender_type: 'customer', content: '주문한 제품이랑 다른게 왔어요!', time: '14:00' },
        { id: 2, sender: 'customer', sender_type: 'customer', content: '저 세럼 주문했는데 크림이 왔어요', time: '14:01' },
      ]
    },
    {
      id: 8, brand: 'wellbiogen', brand_id: 'wellbiogen', channel: 'kakao', channel_type: 'kakao',
      customer: '송민서', customer_name: '송민서', avatar: '👧',
      status: 'pending', priority: 'low', subject: '복용법 문의',
      lastMessage: '하루에 몇 알 먹어야 하나요?',
      timestamp: '5시간 전', unread: true,
      messages: [
        { id: 1, sender: 'customer', sender_type: 'customer', content: '프로바이오틱스 하루에 몇 알 먹어야 하나요?', time: '07:30' },
      ]
    },
  ];
}
