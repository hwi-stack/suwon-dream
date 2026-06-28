import React, { useState, useEffect } from 'react';
import { User, Notice } from '../types';
import { storage } from '../utils/storage';
import EmojiReactions from './EmojiReactions';

interface NoticeListProps {
  currentUser: User;
  fontSizeClass: string;
}

export default function NoticeList({ currentUser, fontSizeClass }: NoticeListProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // 작성 폼 상태
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [extra, setExtra] = useState('');
  const [writeError, setWriteError] = useState('');

  // 수정 폼 상태
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editExtra, setEditExtra] = useState('');

  // 읽음 확인 모달 상태
  const [selectedNoticeForReadCheck, setSelectedNoticeForReadCheck] = useState<Notice | null>(null);

  useEffect(() => {
    setNotices(storage.getNotices());
    setUsers(storage.getUsers());

    // 실시간 구독 활성화
    const unsubNotices = storage.subscribe<Notice>('notices', (newNotices) => {
      setNotices(newNotices);
    });
    const unsubUsers = storage.subscribe<User>('users', (newUsers) => {
      setUsers(newUsers);
    });

    return () => {
      unsubNotices();
      unsubUsers();
    };
  }, []);

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    setWriteError('');

    if (!title.trim() || !content.trim()) {
      setWriteError('제목과 내용을 모두 입력해 주세요. 📝');
      return;
    }

    const newNotice: Notice = {
      id: `notice-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      extra: extra.trim() || undefined,
      writerId: currentUser.id,
      writerName: currentUser.name,
      readBy: [currentUser.id], // 작성자는 기본적으로 읽음 처리
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotice, ...notices];
    storage.saveNotices(updated);
    setNotices(updated);

    // 초기화
    setTitle('');
    setContent('');
    setExtra('');
    setIsWriting(false);
    alert('공지사항이 정상적으로 등록되었습니다! 📢');
  };

  const handleDeleteNotice = (noticeId: string, writerId: string) => {
    const isOwner = currentUser.id === writerId;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    const confirmMsg = isAdmin && !isOwner 
      ? '👑 관리자 권한으로 이 공지사항을 강제 삭제하시겠습니까?' 
      : '공지사항을 정말로 삭제하시겠습니까?';

    if (window.confirm(confirmMsg)) {
      const updated = notices.filter((n) => n.id !== noticeId);
      storage.saveNotices(updated);
      setNotices(updated);
      alert('공지사항이 삭제되었습니다. 🗑️');
    }
  };

  const handleSaveEditNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;

    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 입력해 주세요. 📝');
      return;
    }

    const updated = notices.map((n) => {
      if (n.id === editingNotice.id) {
        return {
          ...n,
          title: editTitle.trim(),
          content: editContent.trim(),
          extra: editExtra.trim() || undefined,
        };
      }
      return n;
    });

    storage.saveNotices(updated);
    setNotices(updated);
    setEditingNotice(null);
    alert('공지사항이 성공적으로 수정되었습니다! ✨');
  };

  // 보호자가 공지를 볼 때 자동으로 읽음 처리하는 함수
  const markAsRead = (notice: Notice) => {
    if (notice.readBy.includes(currentUser.id)) return; // 이미 읽었으면 패스

    const updated = notices.map((n) => {
      if (n.id === notice.id) {
        return {
          ...n,
          readBy: [...n.readBy, currentUser.id],
        };
      }
      return n;
    });

    storage.saveNotices(updated);
    setNotices(updated);
  };

  // 이모지 공감 피드백 토글 기능
  const handleReactEmoji = (noticeId: string, emoji: string) => {
    const updated = notices.map((n) => {
      if (n.id === noticeId) {
        const currentReactions = n.reactions || {};
        const users = currentReactions[emoji] || [];
        const hasReacted = users.includes(currentUser.id);

        const nextUsers = hasReacted
          ? users.filter((uid) => uid !== currentUser.id)
          : [...users, currentUser.id];

        return {
          ...n,
          reactions: {
            ...currentReactions,
            [emoji]: nextUsers
          }
        };
      }
      return n;
    });
    storage.saveNotices(updated);
    setNotices(updated);
  };

  // 읽음 여부 및 안 읽은 명단 확인 (직원 전용)
  const getReadStatus = (notice: Notice) => {
    const parentUsers = users.filter((u) => u.role === 'parent');
    const readGuardians = parentUsers.filter((u) => notice.readBy.includes(u.id));
    const unreadGuardians = parentUsers.filter((u) => !notice.readBy.includes(u.id));

    return {
      readCount: readGuardians.length,
      totalCount: parentUsers.length,
      readList: readGuardians,
      unreadList: unreadGuardians,
    };
  };

  return (
    <div className={`space-y-4 ${fontSizeClass}`} id="notice-list-tab">
      
      {/* 상단 타이틀 */}
      <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📢</span>
          <div>
            <h1 className="text-base font-bold text-amber-950">꿈이음 공지사항</h1>
            <p className="text-[11px] text-amber-900/50">중요한 소식 및 복지관 운영 정보를 전해드립니다.</p>
          </div>
        </div>
        {!isWriting && (currentUser.role === 'staff' || currentUser.role === 'admin') && (
          <button
            onClick={() => setIsWriting(true)}
            className="bg-emerald-400 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-2xl shadow-sm transition-all"
            id="btn-trigger-write-notice"
          >
            ➕ 새 공지
          </button>
        )}
      </div>

      {/* 새 공지사항 작성 양식 (직원만) */}
      {isWriting && (
        <form onSubmit={handleCreateNotice} className="bg-white p-5 rounded-3xl border-2 border-emerald-100 space-y-4 shadow-md animate-fadeIn" id="write-notice-form">
          <div className="flex items-center justify-between border-b border-amber-50 pb-2">
            <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
              📢 새 공지사항 작성하기
            </span>
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              닫기 ✕
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 mb-1">공지 제목</label>
            <input
              type="text"
              placeholder="예: 7월 가족 간담회 개최 안내 🌸"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-amber-50/10 border border-amber-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-300 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 mb-1">상세 공지 내용</label>
            <textarea
              placeholder="보호자님들께 알릴 내용을 구체적으로 작성해 주세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full bg-amber-50/10 border border-amber-100 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-300 leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 mb-1">기타 참고사항 (선택)</label>
            <input
              type="text"
              placeholder="예: ※ 우천 시 실내 장소로 변경됩니다."
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className="w-full bg-amber-50/10 border border-amber-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-300"
            />
          </div>

          {writeError && (
            <p className="text-rose-500 text-xs font-bold text-center">⚠️ {writeError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-400 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-sm transition-all"
            >
              공지사항 등록 ✨
            </button>
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition-all"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 공지사항 수정 양식 */}
      {editingNotice && (
        <form onSubmit={handleSaveEditNotice} className="bg-white p-5 rounded-3xl border-2 border-emerald-100 space-y-4 shadow-md animate-fadeIn" id="edit-notice-form">
          <div className="flex items-center justify-between border-b border-amber-50 pb-2">
            <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
              📢 공지사항 수정하기
            </span>
            <button
              type="button"
              onClick={() => setEditingNotice(null)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              닫기 ✕
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 mb-1">공지 제목</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-amber-50/10 border border-amber-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-300 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 mb-1">상세 공지 내용</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={6}
              className="w-full bg-amber-50/10 border border-amber-100 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-300 leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-950 mb-1">기타 참고사항 (선택)</label>
            <input
              type="text"
              value={editExtra}
              onChange={(e) => setEditExtra(e.target.value)}
              className="w-full bg-amber-50/10 border border-amber-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-300"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-400 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-sm transition-all"
            >
              수정 완료 ✨
            </button>
            <button
              type="button"
              onClick={() => setEditingNotice(null)}
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition-all"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 공지사항 피드 */}
      <div className="space-y-4" id="notice-feed-list">
        {notices.map((notice) => {
          const isOwner = notice.writerId === currentUser.id;
          const isAdmin = currentUser.role === 'admin';
          const { readCount, totalCount } = getReadStatus(notice);

          // 보호자 역할을 가진 사용자라면, 해당 아이템을 클릭/관찰 시 자동 읽음 처리
          const handleNoticeClick = () => {
            if (currentUser.role === 'parent') {
              markAsRead(notice);
            }
          };

          return (
            <div 
              key={notice.id}
              onClick={handleNoticeClick}
              className="bg-white rounded-3xl border border-amber-100 p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow relative"
              id={`notice-card-${notice.id}`}
            >
              {/* 상단 띠 및 제어 */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    📢 전체 공지
                  </span>
                  <span className="text-[9px] text-gray-400 block mt-1.5">
                    {new Date(notice.createdAt).toLocaleDateString()} · 작성: {notice.writerName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* 읽음 확인 명단 로직 버튼 (직원/관리자만 클릭 가능) */}
                  {(currentUser.role === 'staff' || currentUser.role === 'admin') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 카드 클릭 막기
                        setSelectedNoticeForReadCheck(notice);
                      }}
                      className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-100 transition-all flex items-center gap-1"
                      id={`btn-read-check-${notice.id}`}
                    >
                      <span>👀</span> 읽음 확인 ({readCount}/{totalCount})
                    </button>
                  )}

                  {/* 보호자인 경우 본인 읽음 여부 뱃지 노출 */}
                  {currentUser.role === 'parent' && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-xl border ${
                      notice.readBy.includes(currentUser.id)
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        : 'bg-rose-50 text-rose-600 border-rose-100 font-extrabold animate-pulse'
                    }`}>
                      {notice.readBy.includes(currentUser.id) ? '✓ 읽음' : '● 안 읽음'}
                    </span>
                  )}

                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNotice(notice);
                        setEditTitle(notice.title);
                        setEditContent(notice.content);
                        setEditExtra(notice.extra || '');
                      }}
                      className="text-[10px] font-bold text-[#92400E] bg-[#FEF9F2] px-2.5 py-1 rounded-xl border border-[#E9E4DB] hover:bg-[#FEF3C7] transition-all"
                    >
                      수정
                    </button>
                  )}

                  {(isOwner || isAdmin) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotice(notice.id, notice.writerId);
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-xl border ${
                        isAdmin && !isOwner ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-gray-400 bg-gray-50 border-gray-100'
                      }`}
                    >
                      {isAdmin && !isOwner ? '👑 삭제' : '삭제'}
                    </button>
                  )}
                </div>
              </div>

              {/* 본문 */}
              <div className="space-y-1.5 pt-1">
                <h3 className="font-bold text-sm text-amber-950 tracking-tight leading-snug">
                  {notice.title}
                </h3>
                <p className="text-xs text-amber-900/80 leading-relaxed whitespace-pre-line">
                  {notice.content}
                </p>
              </div>

              {/* 기타 사항 */}
              {notice.extra && (
                <div className="bg-pink-50/20 rounded-2xl p-3 border border-pink-100/50 text-xs text-pink-900 font-semibold leading-relaxed">
                  💡 {notice.extra}
                </div>
              )}

              {/* 이모지 공감 피드백 */}
              <EmojiReactions 
                reactions={notice.reactions}
                currentUserId={currentUser.id}
                onReact={(emoji) => handleReactEmoji(notice.id, emoji)}
              />
            </div>
          );
        })}
      </div>

      {/* 읽음 확인 상세 명단 레이어 모달 */}
      {selectedNoticeForReadCheck && (() => {
        const { readList, unreadList } = getReadStatus(selectedNoticeForReadCheck);
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-5 border border-amber-100 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-sm text-amber-950 flex items-center gap-1">
                  <span>👀</span> 실시간 보호자 읽음 현황
                </h3>
                <button
                  onClick={() => setSelectedNoticeForReadCheck(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  닫기 ✕
                </button>
              </div>

              {/* 명단 리스트 */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {/* 읽은 사람 */}
                <div>
                  <span className="block text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 mb-1.5">
                    ✓ 읽은 보호자 ({readList.length}명)
                  </span>
                  {readList.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic pl-1">아직 확인한 보호자가 없습니다.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 pl-1">
                      {readList.map((u) => (
                        <div key={u.id} className="text-[11px] text-gray-700 font-medium">
                          • {u.name} {u.patientName ? `(${u.patientName})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 안 읽은 사람 */}
                <div className="pt-2 border-t border-gray-100">
                  <span className="block text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 mb-1.5">
                    ● 미확인 보호자 ({unreadList.length}명)
                  </span>
                  {unreadList.length === 0 ? (
                    <p className="text-[11px] text-emerald-700 font-bold pl-1">모든 보호자가 확인 완료했습니다! 🎉</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 pl-1">
                      {unreadList.map((u) => (
                        <div key={u.id} className="text-[11px] text-gray-500">
                          • {u.name} {u.patientName ? `(${u.patientName})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedNoticeForReadCheck(null)}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-white font-bold text-xs rounded-xl"
              >
                닫기
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
