import { NextResponse } from 'next/server';
import { db, supabase } from '@/lib/supabase';

// GET /api/tickets - 티켓 목록 조회
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const channelType = searchParams.get('channelType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!supabase) {
      return NextResponse.json({ 
        tickets: [], 
        message: 'Supabase가 설정되지 않았습니다. 데모 모드로 실행됩니다.' 
      });
    }

    const tickets = await db.getTickets({
      brandId,
      channelType,
      status,
      search,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('티켓 조회 실패:', error);
    return NextResponse.json(
      { error: '티켓을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - 새 티켓 생성 (테스트용)
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase가 설정되지 않았습니다.' },
        { status: 400 }
      );
    }

    const ticket = await db.createTicket(body);
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('티켓 생성 실패:', error);
    return NextResponse.json(
      { error: '티켓 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
