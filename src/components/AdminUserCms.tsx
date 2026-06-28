import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../utils/storage';

export default function AdminUserCms() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [newPassword, setNewPassword] = useState('1234');
  const [newPatientName, setNewPatientName] = useState('');
  const [error, setError] = useState('');

  // Editing state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editPatientName, setEditPatientName] = useState('');

  useEffect(() => {
    setUsers(storage.getUsers());
    
    // 실시간 구독 활성화
    const unsub = storage.subscribe<User>('users', (newUsers) => {
      setUsers(newUsers);
    });
    
    return unsub;
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newName.trim() || !newPassword.trim()) {
      setError('모든 필수 필드를 채워주세요. 📝');
      return;
    }

    const trimmedName = newName.trim();
    
    // 중복 체크
    if (users.some((u) => u.id.toLowerCase() === trimmedName.toLowerCase())) {
      setError('이미 존재하는 사용자 성함입니다. 동명이인의 경우 구분을 위해 성함 뒤에 직책이나 숫자 등을 붙여주세요 (예: 김하은2).');
      return;
    }

    const newUser: User = {
      id: trimmedName,
      name: trimmedName,
      role: newRole,
      initialPassword: newPassword,
      currentPassword: newPassword,
      isPasswordChanged: false,
      createdAt: new Date().toISOString(),
      patientName: newRole === 'parent' ? newPatientName.trim() : undefined,
    };

    const updated = [...users, newUser];
    setUsers(updated);
    storage.saveUsers(updated);

    // 폼 초기화
    setNewName('');
    setNewRole('staff');
    setNewPassword('1234');
    setNewPatientName('');
    setIsAdding(false);
    alert('새 사용자가 성공적으로 추가되었습니다! 🎉');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === 'admin') {
      alert('관리자 계정은 삭제할 수 없습니다! 👑');
      return;
    }

    if (window.confirm('정말 이 사용자를 삭제하시겠습니까? 데이터 접근 권한이 상실됩니다.')) {
      const updated = users.filter((u) => u.id !== userId);
      setUsers(updated);
      storage.saveUsers(updated);
      alert('사용자가 삭제되었습니다. 🗑️');
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = users.map((u) => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          currentPassword: editPassword || u.currentPassword,
          patientName: u.role === 'parent' ? editPatientName.trim() : undefined,
          isPasswordChanged: editPassword ? true : u.isPasswordChanged, // 비밀번호 직접 강제지정 시 변경처리
        };
      }
      return u;
    });

    setUsers(updated);
    storage.saveUsers(updated);
    setEditingUser(null);
    setEditPassword('');
    setEditPatientName('');
    alert('사용자 정보가 성공적으로 수정되었습니다! ✨');
  };

  return (
    <div className="p-4 bg-[#FEF9F2]/60 rounded-3xl border border-[#E9E4DB]" id="admin-user-cms-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-[#D97706] flex items-center gap-1.5">
            <span>👑</span> 사용자(계정) 관리 시스템
          </h2>
          <p className="text-xs text-[#928B81] mt-0.5">꿈이음 소통방 이용자 계정을 제어합니다.</p>
        </div>
        {!isAdding && !editingUser && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-[#D97706] hover:bg-[#92400E] text-white text-xs font-bold px-3.5 py-2 rounded-2xl shadow-sm transition-all"
            id="btn-add-user-trigger"
          >
            ➕ 계정 추가
          </button>
        )}
      </div>

      {/* 새 사용자 추가 양식 */}
      {isAdding && (
        <form onSubmit={handleAddUser} className="bg-white p-4 rounded-2xl border border-[#E9E4DB] mb-4 space-y-3 shadow-sm animate-fadeIn" id="add-user-form">
          <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
            <span className="font-bold text-[#4A443F] text-sm flex items-center gap-1">
              ✨ 새 계정 등록하기
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[#928B81] hover:text-[#4A443F] text-xs font-bold"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">역할 선택</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-[#D97706] text-[#4A443F]"
              >
                <option value="staff">👩‍🏫 직원 (Staff)</option>
                <option value="parent">👪 보호자 (Parent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">초기 비밀번호</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-[#D97706] font-mono text-[#4A443F]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5D554D] mb-1">사용자 실명 (이 이름이 그대로 로그인 아이디가 됩니다)</label>
            <input
              type="text"
              placeholder="예: 최하늘"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-[#D97706] text-[#4A443F]"
              required
            />
          </div>

          {newRole === 'parent' && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-bold text-[#5D554D] mb-1">피보호자 성함 (꿈이음 이용인명)</label>
              <input
                type="text"
                placeholder="예: 이지우 (보호자 관리를 위함)"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-[#D97706] text-[#4A443F]"
                required={newRole === 'parent'}
              />
            </div>
          )}

          {error && (
            <p className="text-rose-500 text-xs font-semibold text-center">⚠️ {error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              계정 생성하기 🎉
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2.5 bg-[#FAF9F6] hover:bg-[#E9E4DB] text-[#5D554D] border border-[#E9E4DB] font-bold text-xs rounded-xl transition-all"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 사용자 수정 양식 */}
      {editingUser && (
        <form onSubmit={handleUpdateUser} className="bg-white p-4 rounded-2xl border border-[#E9E4DB] mb-4 space-y-3 shadow-sm animate-fadeIn" id="edit-user-form">
          <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
            <span className="font-serif font-bold text-[#D97706] text-sm flex items-center gap-1">
              ✏️ {editingUser.name} ({editingUser.id}) 계정 편집
            </span>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="text-[#928B81] hover:text-[#4A443F] text-xs font-bold"
            >
              닫기
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5D554D] mb-1">비밀번호 강제 변경 (미입력 시 기존 비밀번호 유지)</label>
            <input
              type="password"
              placeholder="새로운 비밀번호"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-[#D97706] font-mono text-[#4A443F]"
            />
          </div>

          {editingUser.role === 'parent' && (
            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">피보호자 성함 (꿈이음 이용인명)</label>
              <input
                type="text"
                value={editPatientName}
                onChange={(e) => setEditPatientName(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-[#D97706] text-[#4A443F]"
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              수정사항 저장 ✨
            </button>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2.5 bg-[#FAF9F6] hover:bg-[#E9E4DB] text-[#5D554D] border border-[#E9E4DB] font-bold text-xs rounded-xl transition-all"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 사용자 목록 */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto" id="user-list-container">
        {users.map((user) => {
          const isRoleAdmin = user.role === 'admin';
          const isRoleStaff = user.role === 'staff';
          return (
            <div 
              key={user.id} 
              className={`p-3 bg-white rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
                isRoleAdmin 
                  ? 'border-[#FDE68A] bg-[#FEF3C7]/20' 
                  : isRoleStaff 
                  ? 'border-[#E9E4DB]' 
                  : 'border-[#E9E4DB]'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#4A443F]">{user.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    isRoleAdmin 
                      ? 'bg-[#FFEDD5] text-[#92400E] border border-[#FDE68A]' 
                      : isRoleStaff 
                      ? 'bg-[#FEF3C7] text-[#92400E]' 
                      : 'bg-[#FFEDD5] text-[#92400E]'
                  }`}>
                    {isRoleAdmin ? '👑 관리자' : isRoleStaff ? '👩‍🏫 직원' : '👪 보호자'}
                  </span>
                </div>
                <div className="text-[10px] text-[#5D554D] mt-1 flex flex-col gap-0.5">
                  <span>🆔 아이디: <code className="font-mono bg-[#FAF9F6] px-1 rounded border border-[#E9E4DB]/40">{user.id}</code></span>
                  {user.patientName && (
                    <span className="text-[#D97706] font-bold">👶 피보호자 성함 (꿈이음 이용인명): {user.patientName}</span>
                  )}
                  <span className="text-[9px] text-[#928B81]">
                    비밀번호 변경여부: {user.isPasswordChanged ? '✅ 완료' : '❌ 미변경(초기비밀번호)'}
                  </span>
                </div>
              </div>

              {!isRoleAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingUser(user);
                      setEditPassword('');
                      setEditPatientName(user.patientName || '');
                    }}
                    className="p-1.5 bg-[#FAF9F6] hover:bg-[#FEF9F2] text-[#92400E] rounded-lg text-[10px] font-bold border border-[#E9E4DB] transition-all shadow-sm"
                  >
                    ✏️ 수정
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-1.5 bg-[#FAF9F6] hover:bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold border border-[#E9E4DB] hover:border-rose-100 transition-all shadow-sm"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
