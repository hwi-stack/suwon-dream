/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import LoginSelection from './components/LoginSelection';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import DailyReportList from './components/DailyReportList';
import CalendarView from './components/CalendarView';
import AlbumGrid from './components/AlbumGrid';
import NoticeList from './components/NoticeList';
import { storage } from './utils/storage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('home');
  
  // 비밀번호 변경 모달 상태
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');

  // 첫 마운트 시 세션 복구 또는 기본 세팅 확인
  useEffect(() => {
    const savedSession = sessionStorage.getItem('ggum_session_user');
    if (savedSession) {
      try {
        setCurrentUser(JSON.parse(savedSession));
      } catch (err) {
        console.error('세션 복구 에러:', err);
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('ggum_session_user', JSON.stringify(user));
    setCurrentTab('home'); // 로그인 후 항상 홈으로 이동
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('ggum_session_user');
    setCurrentTab('home');
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');

    if (!currentUser) return;

    if (currentUser.currentPassword !== oldPassword) {
      setPwdError('기존 비밀번호가 올바르지 않습니다. 😢');
      return;
    }

    if (newPassword.length < 4) {
      setPwdError('새 비밀번호는 4글자 이상이어야 합니다. 🔒');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('새 비밀번호가 서로 일치하지 않습니다. 😢');
      return;
    }

    const users = storage.getUsers();
    const updated = users.map((u) => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          currentPassword: newPassword,
          isPasswordChanged: true,
        };
      }
      return u;
    });

    storage.saveUsers(updated);
    
    // 로컬 세션 정보 업데이트
    const updatedCurrentUser = {
      ...currentUser,
      currentPassword: newPassword,
      isPasswordChanged: true,
    };
    setCurrentUser(updatedCurrentUser);
    sessionStorage.setItem('ggum_session_user', JSON.stringify(updatedCurrentUser));

    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
    alert('비밀번호가 성공적으로 변경되었습니다! 🔐✨');
  };

  // 글자 크기를 안정적이고 가독성 높은 기본값으로 지정
  const fontSizeClass = 'text-sm';

  // 비로그인 상태일 때: 로그인 화면 노출
  if (!currentUser) {
    return (
      <LoginSelection onLoginSuccess={handleLoginSuccess} />
    );
  }

  // 로그인 상태일 때: 모바일 기기 스타일 프레임워크 렌더링
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex justify-center py-0 md:py-6" id="app-frame-layout">
      {/* 480px 고정 모바일 최적화 컨테이너 */}
      <div 
        className="w-full max-w-[480px] min-h-screen md:min-h-[850px] md:max-h-[920px] bg-white md:rounded-[40px] md:shadow-[0_24px_64px_rgba(74,68,63,0.08)] md:border-8 md:border-[#E9E4DB] flex flex-col relative overflow-hidden"
        id="mobile-viewport-container"
      >
        
        {/* 상단 통합 타이틀 헤더 바 */}
        <header className="bg-white px-5 py-3.5 border-b border-[#E9E4DB] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl">🌱</span>
            <div>
              <h2 className="text-xs font-bold text-[#928B81] tracking-tighter">수원시장애인종합복지관</h2>
              <h1 className="text-sm font-serif font-bold text-[#D97706] tracking-tight">꿈이음 소통방 🌟</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-[#92400E] bg-[#FEF3C7] px-2.5 py-1 rounded-xl border border-[#FDE68A]">
              {currentUser.role === 'admin' ? '👑 관리자' : currentUser.role === 'staff' ? '👩‍🏫 직원' : '👪 보호자'}
            </span>
          </div>
        </header>

        {/* 메인 스크롤 가능 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-24 space-y-4 bg-[#FEF9F2]/30" id="main-scrollable-viewport">
          
          {currentTab === 'home' && (
            <HomeView 
              currentUser={currentUser} 
              setCurrentTab={setCurrentTab}
              fontSizeClass={fontSizeClass}
              onLogout={handleLogout}
              setIsChangingPassword={setIsChangingPassword}
            />
          )}

          {currentTab === 'reports' && (
            <DailyReportList 
              currentUser={currentUser} 
              fontSizeClass={fontSizeClass}
            />
          )}

          {currentTab === 'notice' && (
            <NoticeList 
              currentUser={currentUser} 
              fontSizeClass={fontSizeClass}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView 
              currentUser={currentUser} 
              fontSizeClass={fontSizeClass}
            />
          )}

          {currentTab === 'album' && (
            <AlbumGrid 
              currentUser={currentUser} 
              fontSizeClass={fontSizeClass}
            />
          )}

        </main>

        {/* 하단 고정 탭 바 */}
        <Navigation 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          currentUser={currentUser}
        />
        
      </div>

      {/* 비밀번호 변경 레이어 모달 */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 border border-[#E9E4DB] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
              <h3 className="font-bold text-sm text-[#4A443F] flex items-center gap-1">
                <span>🔐</span> 비밀번호 변경하기
              </h3>
              <button
                onClick={() => {
                  setIsChangingPassword(false);
                  setPwdError('');
                }}
                className="text-[#928B81] hover:text-[#4A443F] text-xs font-bold"
              >
                닫기 ✕
              </button>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#5D554D] mb-1">기존 비밀번호</label>
                <input
                  type="password"
                  placeholder="현재 비밀번호를 입력해 주세요"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D97706] text-[#4A443F]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5D554D] mb-1">새 비밀번호 (4자 이상)</label>
                <input
                  type="password"
                  placeholder="새로운 비밀번호를 입력해 주세요"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D97706] text-[#4A443F]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5D554D] mb-1">새 비밀번호 확인</label>
                <input
                  type="password"
                  placeholder="새 비밀번호를 한 번 더 입력해 주세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D97706] text-[#4A443F]"
                  required
                />
              </div>

              {pwdError && (
                <p className="text-rose-500 text-[11px] font-semibold text-center">⚠️ {pwdError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  변경 완료 ✨
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPwdError('');
                  }}
                  className="px-4 py-3 bg-[#FAF9F6] border border-[#E9E4DB] text-[#5D554D] font-bold text-xs rounded-xl transition-all"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
