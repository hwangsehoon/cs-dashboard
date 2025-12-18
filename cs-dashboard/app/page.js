'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Plus, RefreshCw, Check, X } from 'lucide-react';
import Link from 'next/link';

// 채널 타입별 정보
const channelTypes = {
  kakao: {
    name: '카카오채널',
    icon: '💬',
    color: '#FEE500',
    fields: [
      { key: 'api_key', label: 'Admin Key', placeholder: 'Admin Key를 입력하세요', type: 'password' },
      { key: 'store_id', label: '채널 ID', placeholder: '카카오 비즈 채널 ID', type: 'text' },
    ],
    help: 'https://business.kakao.com 에서 발급받을 수 있습니다.',
  },
  smartstore_inquiry: {
    name: '스마트스토어 문의',
    icon: '📝',
    color: '#03C75A',
    fields: [
      { key: 'api_key', label: 'Client ID', placeholder: '네이버 커머스 API Client ID', type: 'text' },
      { key: 'api_secret', label: 'Client Secret', placeholder: '네이버 커머스 API Client Secret', type: 'password' },
      { key: 'store_id', label: '스토어 ID', placeholder: '스마트스토어 ID', type: 'text' },
    ],
    help: 'https://developers.naver.com/products/commerce 에서 발급받을 수 있습니다.',
  },
  smartstore_talk: {
    name: '스마트스토어 톡톡',
    icon: '💚',
    color: '#03C75A',
    fields: [
      { key: 'api_key', label: 'Client ID', placeholder: '네이버 커머스 API Client ID', type: 'text' },
      { key: 'api_secret', label: 'Client Secret', placeholder: '네이버 커머스 API Client Secret', type: 'password' },
      { key: 'store_id', label: '스토어 ID', placeholder: '스마트스토어 ID', type: 'text' },
    ],
    help: '스마트스토어 문의와 동일한 API 키를 사용합니다.',
  },
  naverpay: {
    name: '네이버페이센터',
    icon: '💳',
    color: '#1EC800',
    fields: [
      { key: 'api_key', label: 'Client ID', placeholder: '네이버 커머스 API Client ID', type: 'text' },
      { key: 'api_secret', label: 'Client Secret', placeholder: '네이버 커머스 API Client Secret', type: 'password' },
      { key: 'store_id', label: '판매자 ID', placeholder: '네이버페이 판매자 ID', type: 'text' },
    ],
    help: 'https://developers.naver.com/products/commerce 에서 발급받을 수 있습니다.',
  },
  coupang: {
    name: '쿠팡',
    icon: '🚀',
    color: '#E31837',
    fields: [
      { key: 'api_key', label: 'Access Key', placeholder: '쿠팡 Wing API Access Key', type: 'text' },
      { key: 'api_secret', label: 'Secret Key', placeholder: '쿠팡 Wing API Secret Key', type: 'password' },
      { key: 'store_id', label: 'Vendor ID', placeholder: '쿠팡 판매자 ID', type: 'text' },
    ],
    help: 'https://wing.coupang.com 에서 발급받을 수 있습니다.',
  },
};

// 브랜드별 사용 가능 채널
const brandChannelMap = {
  '아자차': ['kakao', 'smartstore_inquiry', 'smartstore_talk', 'coupang', 'naverpay'],
  '반드럽': ['kakao', 'coupang', 'naverpay'],
  '윈토르': ['kakao', 'smartstore_inquiry', 'smartstore_talk', 'coupang', 'naverpay'],
  '웰바이오젠': ['kakao', 'coupang', 'naverpay'],
};

export default function SettingsPage() {
  const [brands, setBrands] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // 브랜드 및 설정 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 브랜드 목록 가져오기
      const brandsRes = await fetch('/api/brands');
      const brandsData = await brandsRes.json();
      if (brandsData.brands && brandsData.brands.length > 0) {
        setBrands(brandsData.brands);
        setSelectedBrandId(brandsData.brands[0].id);
      }

      // 채널 설정 가져오기
      const configsRes = await fetch('/api/channels');
      const configsData = await configsRes.json();
      setConfigs(configsData.channels || []);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
    setIsLoading(false);
  };

  // 설정 저장
  const saveConfig = async (config) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      
      if (data.channel) {
        setConfigs(prev => {
          const idx = prev.findIndex(c => c.id === data.channel.id);
          if (idx >= 0) {
            const newConfigs = [...prev];
            newConfigs[idx] = data.channel;
            return newConfigs;
          }
          return [...prev, data.channel];
        });
        setEditingConfig(null);
        alert('저장되었습니다.');
      } else {
        alert('저장 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    }
    setIsSaving(false);
  };

  // 설정 삭제
  const deleteConfig = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await fetch(`/api/channels?id=${id}`, { method: 'DELETE' });
      setConfigs(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 현재 선택된 브랜드
  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  
  // 현재 브랜드의 채널 설정들
  const currentBrandConfigs = configs.filter(c => c.brand_id === selectedBrandId);
  
  // 사용 가능한 채널 목록
  const availableChannels = selectedBrand ? (brandChannelMap[selectedBrand.name] || []) : [];

  // 아직 설정되지 않은 채널 목록
  const unconfiguredChannels = availableChannels.filter(
    ch => !currentBrandConfigs.some(c => c.channel_type === ch)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/"
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">채널 설정</h1>
            <p className="text-sm text-slate-400">각 플랫폼의 API 키를 등록하여 문의를 연동하세요</p>
          </div>
        </div>

        {/* 브랜드 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {brands.map(brand => (
            <button
              key={brand.id}
              onClick={() => setSelectedBrandId(brand.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                selectedBrandId === brand.id
                  ? 'text-white'
                  : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
              }`}
              style={selectedBrandId === brand.id ? { 
                background: `linear-gradient(135deg, ${brand.color}40, ${brand.color}20)`,
              } : {}}
            >
              <span>{brand.icon}</span>
              <span className="font-medium">{brand.name}</span>
            </button>
          ))}
        </div>

        {/* 채널 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            로딩 중...
          </div>
        ) : (
          <div className="space-y-4">
            {/* 설정된 채널들 */}
            {currentBrandConfigs.map(config => {
              const channelInfo = channelTypes[config.channel_type];
              const isEditing = editingConfig?.id === config.id;
              
              return (
                <div 
                  key={config.id}
                  className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ background: `${channelInfo?.color}20` }}
                      >
                        {channelInfo?.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{channelInfo?.name}</h3>
                        <p className="text-xs text-slate-400">
                          {config.is_active ? (
                            <span className="text-green-400">● 활성화</span>
                          ) : (
                            <span className="text-slate-500">○ 비활성화</span>
                          )}
                          {config.last_synced_at && (
                            <span className="ml-2">
                              마지막 동기화: {new Date(config.last_synced_at).toLocaleString('ko-KR')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setEditingConfig(null)}
                            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => saveConfig(editingConfig)}
                            disabled={isSaving}
                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingConfig({ ...config })}
                            className="px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-sm"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => deleteConfig(config.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 수정 폼 */}
                  {isEditing && (
                    <div className="p-4 space-y-4">
                      {channelInfo?.fields.map(field => (
                        <div key={field.key}>
                          <label className="block text-sm text-slate-400 mb-1">{field.label}</label>
                          <input
                            type={field.type}
                            value={editingConfig[field.key] || ''}
                            onChange={(e) => setEditingConfig(prev => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`active-${config.id}`}
                          checked={editingConfig.is_active}
                          onChange={(e) => setEditingConfig(prev => ({
                            ...prev,
                            is_active: e.target.checked,
                          }))}
                          className="rounded"
                        />
                        <label htmlFor={`active-${config.id}`} className="text-sm text-slate-300">
                          활성화
                        </label>
                      </div>
                      {channelInfo?.help && (
                        <p className="text-xs text-slate-500">{channelInfo.help}</p>
                      )}
                    </div>
                  )}

                  {/* 저장된 정보 표시 (수정 중이 아닐 때) */}
                  {!isEditing && config.api_key && (
                    <div className="px-4 py-3 text-sm text-slate-400">
                      API Key: {config.api_key.substring(0, 8)}...
                      {config.store_id && <span className="ml-4">Store ID: {config.store_id}</span>}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 채널 추가 버튼 */}
            {unconfiguredChannels.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAddModal(!showAddModal)}
                  className="w-full p-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  채널 추가
                </button>

                {/* 채널 선택 드롭다운 */}
                {showAddModal && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-xl z-10">
                    {unconfiguredChannels.map(chType => {
                      const info = channelTypes[chType];
                      return (
                        <button
                          key={chType}
                          onClick={() => {
                            setEditingConfig({
                              brand_id: selectedBrandId,  // 실제 UUID 사용
                              channel_type: chType,
                              is_active: true,
                            });
                            setShowAddModal(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors"
                        >
                          <span 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${info.color}20` }}
                          >
                            {info.icon}
                          </span>
                          <span className="text-white">{info.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 새 채널 설정 폼 */}
            {editingConfig && !editingConfig.id && (
              <div className="bg-slate-800/50 border border-indigo-500/50 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-indigo-500/10">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ background: `${channelTypes[editingConfig.channel_type]?.color}20` }}
                    >
                      {channelTypes[editingConfig.channel_type]?.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {channelTypes[editingConfig.channel_type]?.name} 추가
                      </h3>
                      <p className="text-xs text-slate-400">새 채널 설정</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingConfig(null)}
                      className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => saveConfig(editingConfig)}
                      disabled={isSaving}
                      className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {channelTypes[editingConfig.channel_type]?.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm text-slate-400 mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        value={editingConfig[field.key] || ''}
                        onChange={(e) => setEditingConfig(prev => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                  {channelTypes[editingConfig.channel_type]?.help && (
                    <p className="text-xs text-slate-500">
                      {channelTypes[editingConfig.channel_type].help}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 빈 상태 */}
            {currentBrandConfigs.length === 0 && !editingConfig && (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-3">⚙️</div>
                <div>설정된 채널이 없습니다</div>
                <div className="text-sm">위의 "채널 추가" 버튼을 눌러 시작하세요</div>
              </div>
            )}
          </div>
        )}

        {/* 쿠팡 통합 계정 안내 */}
        <div className="mt-8 bg-slate-800/30 border border-white/5 rounded-xl p-4">
          <h3 className="text-slate-300 font-semibold mb-2">💡 쿠팡 통합 계정 안내</h3>
          <p className="text-sm text-slate-400">
            쿠팡은 1개 계정에서 4개 브랜드 상품을 모두 관리하므로, 
            쿠팡 채널은 한 브랜드에만 등록하면 됩니다. 
            문의 내용의 상품명을 기준으로 자동 분류됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
