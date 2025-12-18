import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { syncAllChannels, syncChannel } from '@/lib/platforms';

// POST /api/sync - 전체 채널 동기화
export async function POST(request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase가 설정되지 않았습니다. 먼저 설정 페이지에서 Supabase를 연결해주세요.' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    let results;
    if (channelId) {
      // 특정 채널만 동기화
      const { data: config } = await supabase
        .from('channel_configs')
        .select('*')
        .eq('id', channelId)
        .single();
      
      if (!config) {
        return NextResponse.json(
          { error: '채널 설정을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const result = await syncChannel(config);
      results = [{ channel_id: channelId, ...result }];
    } else {
      // 모든 활성 채널 동기화
      results = await syncAllChannels();
    }

    const totalSynced = results.reduce((sum, r) => sum + (r.ticketsSynced || 0), 0);
    const failedChannels = results.filter(r => !r.success);

    return NextResponse.json({
      success: failedChannels.length === 0,
      totalSynced,
      results,
      message: failedChannels.length > 0 
        ? `일부 채널 동기화 실패: ${failedChannels.map(f => f.channel_type).join(', ')}`
        : `${totalSynced}건의 문의를 동기화했습니다.`,
    });
  } catch (error) {
    console.error('동기화 실패:', error);
    return NextResponse.json(
      { error: '동기화에 실패했습니다: ' + error.message },
      { status: 500 }
    );
  }
}

// GET /api/sync - 동기화 상태 조회
export async function GET(request) {
  try {
    if (!supabase) {
      return NextResponse.json({ logs: [] });
    }

    const { data: logs } = await supabase
      .from('sync_logs')
      .select('*, channel_configs(channel_type, brands(name))')
      .order('started_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('동기화 로그 조회 실패:', error);
    return NextResponse.json(
      { error: '동기화 로그를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
