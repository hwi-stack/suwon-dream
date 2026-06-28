import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../utils/storage';

interface LoginSelectionProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginSelection({ onLoginSuccess }: LoginSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 비밀번호 변경 모드용
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');

  const users = storage.getUsers();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('역할을 먼저 선택해주세요. 🌟');
      return;
    }

    if (!userId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 모두 입력해주세요. 📝');
      return;
    }

    // 아이디 및 역할 일치하는 유저 찾기
    const user = users.find(
      (u) => 
        (u.id.toLowerCase() === userId.trim().toLowerCase() || 
         (u.role === 'admin' && userId.trim().toLowerCase() === 'admin')) && 
        u.role === selectedRole
    );

    if (!user) {
      setError('등록되지 않은 사용자이거나 역할이 일치하지 않습니다. 😢');
      return;
    }

    if (user.currentPassword !== password) {
      setError('비밀번호가 올바르지 않습니다. 다시 확인해주세요! 🔒');
      return;
    }

    // 로그인 성공
    onLoginSuccess(user);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');

    if (!changingPasswordUser) return;
    if (newPassword.length < 4) {
      setPwdError('새 비밀번호는 4글자 이상이어야 합니다. 🔒');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('비밀번호가 서로 일치하지 않습니다. 😢');
      return;
    }

    // 비밀번호 업데이트
    const updatedUsers = users.map((u) => {
      if (u.id === changingPasswordUser.id) {
        return {
          ...u,
          currentPassword: newPassword,
          isPasswordChanged: true,
        };
      }
      return u;
    });

    storage.saveUsers(updatedUsers);
    
    // 변경된 유저 정보 가져오기
    const updatedUser = updatedUsers.find((u) => u.id === changingPasswordUser.id)!;
    
    alert('비밀번호가 성공적으로 변경되었습니다! 꿈이음 소통방에 오신 것을 환영합니다! 🎉');
    setChangingPasswordUser(null);
    onLoginSuccess(updatedUser);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50 p-4 font-sans select-none" id="login-screen-container">
      {/* 귀여운 장식용 파스텔 구름 모양 배경 디자인 요소 */}
      <div className="absolute top-10 left-10 text-4xl opacity-20">☁️</div>
      <div className="absolute top-40 right-10 text-5xl opacity-20">🎈</div>
      <div className="absolute bottom-20 left-6 text-5xl opacity-20">🌸</div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-amber-100 p-6 z-10" id="login-card">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <span className="text-4xl">🌱</span>
          <h1 className="text-2xl font-bold text-amber-950 mt-2 tracking-tight">수원시장애인종합복지관</h1>
          <div className="inline-block bg-emerald-50 text-emerald-800 text-sm font-semibold px-3 py-1 rounded-full mt-1 border border-emerald-100">
            주간이용시설 '꿈이음' 소통방 🌟
          </div>
        </div>

        {/* 첫 로그인 비밀번호 변경 폼 */}
        {changingPasswordUser ? (
          <form onSubmit={handlePasswordChange} className="space-y-4" id="password-change-form">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-900 text-sm">
              <span className="font-bold text-base block mb-1">🔐 첫 로그인 비밀번호 변경</span>
              안전한 사용을 위해 초기 비밀번호를 변경해 주세요. 본인이 사용할 새 비밀번호를 입력해 주세요.
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-950 mb-1">아이디</label>
              <input 
                type="text" 
                value={changingPasswordUser.id} 
                disabled 
                className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-2xl px-4 py-3 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-950 mb-1">새 비밀번호 (4자 이상)</label>
              <input 
                type="password" 
                placeholder="새로운 비밀번호를 입력해 주세요" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-amber-100 focus:border-amber-300 bg-amber-50/20 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-950 mb-1">새 비밀번호 확인</label>
              <input 
                type="password" 
                placeholder="한 번 더 입력해 주세요" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-amber-100 focus:border-amber-300 bg-amber-50/20 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all"
                required
              />
            </div>

            {pwdError && (
              <p className="text-rose-500 text-xs font-semibold text-center mt-1">⚠️ {pwdError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm"
              id="btn-submit-new-password"
            >
              비밀번호 변경 후 로그인하기 🎉
            </button>
          </form>
        ) : (
          /* 일반 로그인 폼 */
          <form onSubmit={handleLogin} className="space-y-4" id="login-form">
            {/* 역할 선택 버튼 */}
            <div>
              <span className="block text-sm font-bold text-amber-950 mb-2 text-center">
                어떤 역할로 로그인하시겠어요? 👇
              </span>
              <div className="grid grid-cols-3 gap-2" id="role-selector">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('admin');
                    setUserId('');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-200'
                      : 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/60'
                  }`}
                  id="role-btn-admin"
                >
                  <span className="text-2xl">👑</span>
                  <span className="text-xs font-bold text-amber-950 mt-1">관리자</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('staff');
                    setUserId('');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                    selectedRole === 'staff'
                      ? 'bg-emerald-100 border-emerald-300 ring-2 ring-emerald-200'
                      : 'bg-emerald-50/20 border-emerald-100 hover:bg-emerald-50/50'
                  }`}
                  id="role-btn-staff"
                >
                  <span className="text-2xl">👩‍🏫</span>
                  <span className="text-xs font-bold text-emerald-950 mt-1">직원</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('parent');
                    setUserId('');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                    selectedRole === 'parent'
                      ? 'bg-pink-100 border-pink-300 ring-2 ring-pink-200'
                      : 'bg-pink-50/20 border-pink-100 hover:bg-pink-50/50'
                  }`}
                  id="role-btn-parent"
                >
                  <span className="text-2xl">👪</span>
                  <span className="text-xs font-bold text-pink-950 mt-1">보호자</span>
                </button>
              </div>
            </div>

            {/* 입력 영역 */}
            {selectedRole && (
              <div className="space-y-3 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    {selectedRole === 'admin' ? '관리자 이름 (또는 admin)' : '사용자 성함 (실명)'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      selectedRole === 'admin' 
                        ? '예: 관리자 또는 admin' 
                        : selectedRole === 'staff'
                        ? '예: 박지현 (성함 입력)'
                        : '예: 김하은 (성함 입력)'
                    }
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full border border-amber-100 focus:border-amber-300 bg-amber-50/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">비밀번호</label>
                  <input
                    type="password"
                    placeholder="비밀번호를 입력해 주세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-amber-100 focus:border-amber-300 bg-amber-50/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none transition-all"
                    required
                  />
                </div>

                {error && (
                  <p className="text-rose-500 text-xs font-bold text-center">⚠️ {error}</p>
                )}

                <button
                  type="submit"
                  className={`w-full py-3.5 text-white font-bold rounded-2xl shadow-md transition-all transform hover:-translate-y-0.5 text-sm ${
                    selectedRole === 'admin'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : selectedRole === 'staff'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-pink-400 hover:bg-pink-500'
                  }`}
                  id="btn-login"
                >
                  꿈이음 소통방 입장하기 ✨
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
