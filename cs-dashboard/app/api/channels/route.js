import { NextResponse } from 'next/server';
import { db, supabase } from '@/lib/supabase';

// GET /api/channels - 채널 설정 목록
export async function GET(request) {
  try {
    if (!supabase) {
      return NextResponse.json({ channels: [] });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    const channels = await db.getChannelConfigs(brandId);
    return NextResponse.json({ channels });
  } catch (error) {
    console.error('채널 설정 조회 실패:', error);
    return NextResponse.json(
      { error: '채널 설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/channels - 채널 설정 추가/수정
export async function POST(request) {
  try {
    const config = await request.json();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase가 설정되지 않았습니다.' },
        { status: 400 }
      );
    }

    if (!config.brand_id || !config.channel_type) {
      return NextResponse.json(
        { error: 'brand_id와 channel_type이 필요합니다.' },
        { status: 400 }
      );
    }

    const channel = await db.upsertChannelConfig(config);
    return NextResponse.json({ channel });
  } catch (error) {
    console.error('채널 설정 저장 실패:', error);
    return NextResponse.json(
      { error: '채널 설정 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/channels - 채널 설정 삭제
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase가 설정되지 않았습니다.' },
        { status: 400 }
      );
    }

    await db.deleteChannelConfig(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('채널 설정 삭제 실패:', error);
    return NextResponse.json(
      { error: '채널 설정 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
