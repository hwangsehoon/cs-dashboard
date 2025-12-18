import { NextResponse } from 'next/server';
import { db, supabase } from '@/lib/supabase';

// PUT /api/tickets/status - 티켓 상태 변경
export async function PUT(request) {
  try {
    const { ticketId, status } = await request.json();

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: 'ticketId와 status가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase가 설정되지 않았습니다.' },
        { status: 400 }
      );
    }

    const updates = { status };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const ticket = await db.updateTicket(ticketId, updates);
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('상태 변경 실패:', error);
    return NextResponse.json(
      { error: '상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
