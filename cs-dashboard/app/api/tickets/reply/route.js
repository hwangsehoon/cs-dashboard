import { NextResponse } from 'next/server';
import { db, supabase } from '@/lib/supabase';
import { sendMessageToPlatform } from '@/lib/platforms';

// POST /api/tickets/reply - 메시지 답변
export async function POST(request) {
  try {
    const { ticketId, message } = await request.json();

    if (!ticketId || !message) {
      return NextResponse.json(
        { error: 'ticketId와 message가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase가 설정되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 티켓 정보 조회
    const ticket = await db.getTicket(ticketId);
    if (!ticket) {
      return NextResponse.json(
        { error: '티켓을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // DB에 메시지 저장
    const savedMessage = await db.createMessage({
      ticket_id: ticketId,
      sender_type: 'agent',
      sender_name: '상담사',
      content: message,
    });

    // 티켓 상태 업데이트
    if (ticket.status === 'pending') {
      await db.updateTicket(ticketId, { status: 'in_progress' });
    }

    // 실제 플랫폼으로 메시지 전송 시도
    try {
      const result = await sendMessageToPlatform(ticket, message);
      if (!result.success) {
        console.warn('플랫폼 전송 실패:', result.error);
        // 플랫폼 전송 실패해도 DB 저장은 성공으로 처리
      }
    } catch (platformError) {
      console.warn('플랫폼 전송 중 오류:', platformError.message);
      // 플랫폼 연동이 안 되어 있어도 DB 저장은 성공으로 처리
    }

    return NextResponse.json({ 
      success: true, 
      message: savedMessage,
    });
  } catch (error) {
    console.error('답변 전송 실패:', error);
    return NextResponse.json(
      { error: '답변 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
