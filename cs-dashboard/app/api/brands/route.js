import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    if (!supabase) {
      return NextResponse.json({ brands: [] });
    }

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('created_at');

    if (error) throw error;

    return NextResponse.json({ brands: data || [] });
  } catch (error) {
    console.error('브랜드 조회 실패:', error);
    return NextResponse.json({ error: '실패' }, { status: 500 });
  }
}
