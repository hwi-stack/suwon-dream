import { User, Notice, CalendarEvent } from '../types';
import { storage } from '../utils/storage';
import { useState, useEffect } from 'react';
import AdminUserCms from './AdminUserCms';

interface HomeViewProps {
  currentUser: User;
  setCurrentTab: (tab: string) => void;
  fontSizeClass: string;
  onLogout: () => void;
  setIsChangingPassword: (val: boolean) => void;
}

export default function HomeView({ 
  currentUser, 
  setCurrentTab,
  fontSizeClass,
  onLogout,
  setIsChangingPassword
}: HomeViewProps) {
  const [recentNotice, setRecentNotice] = useState<Notice | null>(null);
  const [weeklyEvents, setWeeklyEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    // 가장 최근 공지사항 가져오기
    const updateNotices = (notices: Notice[]) => {
      if (notices.length > 0) {
        setRecentNotice(notices[0]);
      } else {
        setRecentNotice(null);
      }
    };
    updateNotices(storage.getNotices());

    // 다가오는 일정 가져오기
    const updateEvents = (events: CalendarEvent[]) => {
      const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setWeeklyEvents(sorted.slice(0, 2));
    };
    updateEvents(storage.getEvents());

    // 실시간 구독 활성화
    const unsubNotices = storage.subscribe<Notice>('notices', updateNotices);
    const unsubEvents = storage.subscribe<CalendarEvent>('events', updateEvents);

    return () => {
      unsubNotices();
      unsubEvents();
    };
  }, []);

  // 환영 멘트 생성기
  const getGreeting = () => {
    if (currentUser.role === 'admin') {
      return '👑 오늘 하루도 복지관을 따뜻하게 가꾸어주셔서 감사합니다, 원장님!';
    } else if (currentUser.role === 'staff') {
      return `👩‍🏫 ${currentUser.name} 선생님, 오늘도 힘내세요! 회원들의 소중한 꿈을 잇는 하루가 되기를 기원합니다.`;
    } else {
      const patient = currentUser.patientName ? `${currentUser.patientName} 회원님` : '회원님';
      return `👪 안녕하세요, ${currentUser.name} 보호자님! 오늘 하루도 꿈이음 안에서 편안하고 정성껏 모시겠습니다.`;
    }
  };

  return (
    <div className={`space-y-4 font-sans select-none ${fontSizeClass}`} id="home-tab-view">
      
      {/* 환영 카드 */}
      <div className="bg-gradient-to-br from-[#FEF9F2] to-white p-5 rounded-3xl border border-[#E9E4DB] shadow-sm relative overflow-hidden">
        {/* 장식용 */}
        <div className="absolute -right-6 -bottom-6 text-7xl opacity-10">🌸</div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🌱</span>
          <span className="text-xs font-bold text-[#928B81] tracking-tight">수원시장애인종합복지관 주간이용시설</span>
        </div>
        <h1 className="text-xl font-serif font-bold text-[#D97706] mt-1 flex items-center gap-1 tracking-tight">
          꿈이음 소통방 🌟
        </h1>
        <p className="text-xs text-[#5D554D] mt-3 leading-relaxed font-medium">
          {getGreeting()}
        </p>
      </div>

      {/* 4분할 퀵 바로가기 메뉴: 알림장, 일정, 공지사항, 앨범 */}
      <div className="grid grid-cols-4 gap-2" id="home-quick-menus">
        <button 
          onClick={() => setCurrentTab('reports')}
          className="bg-white p-3 rounded-2xl border border-[#E9E4DB] flex flex-col items-center text-center shadow-sm hover:bg-[#FEF9F2] active:scale-95 transition-all"
        >
          <span className="text-2xl">📝</span>
          <span className="text-[10px] font-bold text-[#5D554D] mt-1.5">알림장</span>
        </button>
        <button 
          onClick={() => setCurrentTab('calendar')}
          className="bg-white p-3 rounded-2xl border border-[#E9E4DB] flex flex-col items-center text-center shadow-sm hover:bg-[#FEF9F2] active:scale-95 transition-all"
        >
          <span className="text-2xl">📅</span>
          <span className="text-[10px] font-bold text-[#5D554D] mt-1.5">일정</span>
        </button>
        <button 
          onClick={() => setCurrentTab('notice')}
          className="bg-white p-3 rounded-2xl border border-[#E9E4DB] flex flex-col items-center text-center shadow-sm hover:bg-[#FEF9F2] active:scale-95 transition-all"
        >
          <span className="text-2xl">📢</span>
          <span className="text-[10px] font-bold text-[#5D554D] mt-1.5">공지사항</span>
        </button>
        <button 
          onClick={() => setCurrentTab('album')}
          className="bg-white p-3 rounded-2xl border border-[#E9E4DB] flex flex-col items-center text-center shadow-sm hover:bg-[#FEF9F2] active:scale-95 transition-all"
        >
          <span className="text-2xl">📸</span>
          <span className="text-[10px] font-bold text-[#5D554D] mt-1.5">앨범</span>
        </button>
      </div>

      {/* 최신 공지사항 요약 카드 */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9E4DB] shadow-sm space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
          <span className="font-bold text-xs text-[#5D554D] flex items-center gap-1">
            <span>📢</span> 주요 공지사항 요약
          </span>
          <button 
            onClick={() => setCurrentTab('notice')}
            className="text-[10px] text-[#928B81] font-bold hover:text-[#D97706]"
          >
            자세히 ➡️
          </button>
        </div>

        {recentNotice ? (
          <div className="space-y-1.5">
            <h4 className="font-bold text-xs text-[#4A443F] truncate">{recentNotice.title}</h4>
            <p className="text-[11px] text-[#928B81] leading-normal line-clamp-3">
              {recentNotice.content}
            </p>
            <span className="text-[9px] text-[#B2A899] block pt-1 text-right">
              등록: {new Date(recentNotice.createdAt).toLocaleDateString()}
            </span>
          </div>
        ) : (
          <p className="text-xs text-[#928B81] text-center py-2">등록된 공지사항이 아직 없습니다.</p>
        )}
      </div>

      {/* 이번 주 일정 요약 카드 */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9E4DB] shadow-sm space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
          <span className="font-bold text-xs text-[#5D554D] flex items-center gap-1">
            <span>📅</span> 다가오는 꿈이음 일정
          </span>
          <button 
            onClick={() => setCurrentTab('calendar')} 
            className="text-[10px] text-[#928B81] font-bold hover:text-[#D97706]"
          >
            달력 보기 ➡️
          </button>
        </div>

        <div className="space-y-2">
          {weeklyEvents.length > 0 ? (
            weeklyEvents.map((ev) => (
              <div 
                key={ev.id}
                onClick={() => setCurrentTab('calendar')}
                className="p-2.5 bg-[#FEF9F2] hover:bg-[#FFEDD5]/40 rounded-xl border border-[#E9E4DB]/50 flex items-center justify-between cursor-pointer transition-all"
              >
                <div>
                  <span className="text-[10px] font-bold text-[#92400E] bg-[#FEF3C7] px-1.5 py-0.5 rounded-lg border border-[#FDE68A]">
                    {ev.date}
                  </span>
                  <h4 className="font-bold text-xs text-[#4A443F] mt-1">{ev.title}</h4>
                </div>
                <span className="text-xs text-[#D97706] font-bold">🔍</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#928B81] text-center py-2">예정된 일정이 없습니다. 🍀</p>
          )}
        </div>
      </div>

      {/* 하단 유틸리티 기능: 비밀번호 변경 & 로그아웃 */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9E4DB] shadow-sm space-y-3">
        <div className="flex items-center justify-between px-1 pb-2 border-b border-[#FAF9F6]">
          <span className="text-xs text-[#928B81] font-medium">로그인 계정</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${
              currentUser.role === 'admin' 
                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                : currentUser.role === 'staff' 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                : 'bg-pink-100 text-pink-800 border-pink-200'
            }`}>
              {currentUser.role === 'admin' ? '관리자' : currentUser.role === 'staff' ? '직원' : '보호자'}
            </span>
            <span className="text-xs font-bold text-[#4A443F]">{currentUser.name}님</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsChangingPassword(true)}
            className="flex-1 py-2.5 bg-[#FEF9F2] hover:bg-[#FFEDD5]/40 border border-[#E9E4DB] text-[#4A443F] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1"
          >
            🔐 비밀번호 변경
          </button>
          <button
            onClick={onLogout}
            className="flex-1 py-2.5 bg-[#FAF9F6] hover:bg-rose-50 text-[#5D554D] hover:text-rose-600 border border-[#E9E4DB] hover:border-rose-100 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1"
          >
            👋 로그아웃
          </button>
        </div>
      </div>

      {/* 이용 안내 발자국 가이드 */}
      <div className="p-3.5 bg-[#FEF9F2] rounded-2xl border border-[#E9E4DB] text-center">
        <span className="text-[10px] font-bold text-[#92400E] leading-normal">
          🌸 수원시장애인종합복지관 주간이용시설 '꿈이음' <br />
          <span className="font-medium text-[#928B81] opacity-90">이용 문의: 031-207-1526</span>
        </span>
      </div>

      {/* 관리자 계정으로 로그인한 경우 관리자 전용 '사용자 계정 제어(AdminUserCms)' 통합 렌더링 */}
      {currentUser.role === 'admin' && (
        <div className="pt-4 border-t border-dashed border-[#E9E4DB] animate-fadeIn">
          <AdminUserCms />
        </div>
      )}

    </div>
  );
}
