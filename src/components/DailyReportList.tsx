import React, { useState, useEffect } from 'react';
import { User, DailyReport, Comment, MoodType } from '../types';
import { storage } from '../utils/storage';
import { compressImage } from '../utils/imageCompress';
import EmojiReactions from './EmojiReactions';

interface DailyReportListProps {
  currentUser: User;
  fontSizeClass: string;
}

export default function DailyReportList({ currentUser, fontSizeClass }: DailyReportListProps) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // 필터 상태 (월별 필터: YYYY-MM 형태, 기본값 'all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'sent' | 'received'>('all');

  // 작성 폼 상태
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>(undefined);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [writeError, setWriteError] = useState('');

  // 수정 상태
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<MoodType | undefined>(undefined);
  
  // 새 댓글 입력용 임시 맵 (reportId -> commentContent)
  const [newCommentText, setNewCommentText] = useState<{ [reportId: string]: string }>({});

  useEffect(() => {
    setReports(storage.getDailyReports());
    setComments(storage.getComments());
    setUsers(storage.getUsers());

    // 실시간 구독 활성화 (Firebase 실시간 연동)
    const unsubReports = storage.subscribe<DailyReport>('daily_reports', (newReports) => {
      setReports(newReports);
    });
    const unsubComments = storage.subscribe<Comment>('comments', (newComments) => {
      setComments(newComments);
    });
    const unsubUsers = storage.subscribe<User>('users', (newUsers) => {
      setUsers(newUsers);
    });

    return () => {
      unsubReports();
      unsubComments();
      unsubUsers();
    };
  }, []);

  const refreshData = () => {
    setReports(storage.getDailyReports());
    setComments(storage.getComments());
  };

  // 월 목록 구하기 (전체 알림장 날짜 기준)
  const getAvailableMonths = () => {
    const monthsSet = new Set<string>();
    reports.forEach((rep) => {
      const date = new Date(rep.createdAt);
      if (!isNaN(date.getTime())) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        monthsSet.add(`${yyyy}-${mm}`);
      }
    });
    return Array.from(monthsSet).sort().reverse();
  };

  // 수신자 목록 구하기 (내가 직원인 경우 보호자 목록, 내가 보호자인 경우 직원 목록 - 관리자 제외)
  // 보호자가 알림장 작성할 때 관리자는 제외하고 실제 담당 선생님(staff)만 조회 및 발송하도록 수정합니다.
  const getReceivers = () => {
    if (currentUser.role === 'staff' || currentUser.role === 'admin') {
      return users.filter((u) => u.role === 'parent');
    } else {
      return users.filter((u) => u.role === 'staff');
    }
  };

  // 알림장 작성 제출 처리
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setWriteError('');

    if (!title.trim() || !content.trim()) {
      setWriteError('제목과 내용을 모두 작성해 주세요. 📝');
      return;
    }

    if (!receiverId) {
      setWriteError('수신인을 선택해 주세요. 🤝');
      return;
    }

    const receiver = users.find((u) => u.id === receiverId);
    if (!receiver) {
      setWriteError('유효하지 않은 수신인입니다.');
      return;
    }

    const newReport: DailyReport = {
      id: `report-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      writerId: currentUser.id,
      writerName: currentUser.role === 'parent' && currentUser.patientName 
        ? `${currentUser.name} (${currentUser.patientName} 보호자)` 
        : currentUser.name,
      writerRole: currentUser.role,
      receiverId: receiver.id,
      receiverName: receiver.role === 'parent' && receiver.patientName 
        ? `${receiver.name} (${receiver.patientName} 보호자)` 
        : receiver.name,
      mood: (currentUser.role === 'staff' || currentUser.role === 'parent') ? selectedMood : undefined, // 직원 및 보호자 기분카드 저장
      images: selectedImages,
      likes: [],
      createdAt: new Date().toISOString(),
    };

    const updatedList = [newReport, ...reports];
    storage.saveDailyReports(updatedList);
    setReports(updatedList);

    // 폼 초기화
    setTitle('');
    setContent('');
    setReceiverId('');
    setSelectedMood(undefined);
    setSelectedImages([]);
    setIsWriting(false);
    alert('알림장이 성공적으로 등록되었습니다! 📝💌');
  };

  // 이미지 다중 업로드 및 압축 로직
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsCompressing(true);
    const files = Array.from(e.target.files) as File[];
    
    try {
      const compressedB64s: string[] = [];
      for (const file of files) {
        // 최대 너비 800px, 70% 품질로 클라이언트 사이드 압축 수행
        const compressed = await compressImage(file, 800, 0.7);
        compressedB64s.push(compressed);
      }
      setSelectedImages((prev) => [...prev, ...compressedB64s]);
    } catch (err) {
      console.error(err);
      alert('이미지를 업로드하는 도중 오류가 발생했습니다.');
    } finally {
      setIsCompressing(false);
    }
  };

  // 이미지 개별 제거
  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 알림장 수정 저장
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }

    const updatedList = reports.map((rep) => {
      if (rep.id === editingReport.id) {
        return {
          ...rep,
          title: editTitle.trim(),
          content: editContent.trim(),
          mood: (rep.writerRole === 'staff' || rep.writerRole === 'parent') ? editMood : undefined,
        };
      }
      return rep;
    });

    storage.saveDailyReports(updatedList);
    setReports(updatedList);
    setEditingReport(null);
    alert('알림장이 성공적으로 수정되었습니다! ✨');
  };

  // 알림장 삭제 (작성자 직접 삭제 or 관리자 마스터 강제삭제)
  const handleDeleteReport = (reportId: string, writerId: string) => {
    const isOwner = currentUser.id === writerId;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    const confirmMsg = isAdmin && !isOwner 
      ? '👑 관리자 권한으로 이 알림장을 강제 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다.)' 
      : '알림장을 정말로 삭제하시겠습니까?';

    if (window.confirm(confirmMsg)) {
      const updatedList = reports.filter((rep) => rep.id !== reportId);
      storage.saveDailyReports(updatedList);
      setReports(updatedList);
      
      // 관련 댓글도 삭제
      const filteredComments = comments.filter((c) => c.refId !== reportId);
      storage.saveComments(filteredComments);
      setComments(filteredComments);

      alert('알림장이 삭제되었습니다. 🗑️');
    }
  };

  // 좋아요 (❤️) 토글 기능
  const handleToggleLike = (reportId: string) => {
    const updatedList = reports.map((rep) => {
      if (rep.id === reportId) {
        const hasLiked = rep.likes.includes(currentUser.id);
        const nextLikes = hasLiked 
          ? rep.likes.filter((uid) => uid !== currentUser.id)
          : [...rep.likes, currentUser.id];
        return { ...rep, likes: nextLikes };
      }
      return rep;
    });
    storage.saveDailyReports(updatedList);
    setReports(updatedList);
  };

  // 이모지 공감 피드백 토글 기능
  const handleReactEmoji = (reportId: string, emoji: string) => {
    const updatedList = reports.map((rep) => {
      if (rep.id === reportId) {
        const currentReactions = rep.reactions || {};
        const users = currentReactions[emoji] || [];
        const hasReacted = users.includes(currentUser.id);
        
        const nextUsers = hasReacted
          ? users.filter((uid) => uid !== currentUser.id)
          : [...users, currentUser.id];
          
        return {
          ...rep,
          reactions: {
            ...currentReactions,
            [emoji]: nextUsers
          }
        };
      }
      return rep;
    });
    storage.saveDailyReports(updatedList);
    setReports(updatedList);
  };

  // 댓글 등록
  const handleAddComment = (reportId: string) => {
    const text = newCommentText[reportId];
    if (!text || !text.trim()) return;

    const newComm: Comment = {
      id: `comment-${Date.now()}`,
      refId: reportId,
      writerId: currentUser.id,
      writerName: currentUser.role === 'parent' && currentUser.patientName 
        ? `${currentUser.name} (${currentUser.patientName} 보호자)` 
        : currentUser.name,
      writerRole: currentUser.role,
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...comments, newComm];
    storage.saveComments(updatedComments);
    setComments(updatedComments);

    setNewCommentText((prev) => ({ ...prev, [reportId]: '' }));
  };

  // 댓글 삭제 (작성자 직접 삭제 or 관리자 마스터 강제삭제)
  const handleDeleteComment = (commentId: string, writerId: string) => {
    const isOwner = currentUser.id === writerId;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    if (window.confirm('댓글을 삭제하시겠습니까?')) {
      const updatedComments = comments.filter((c) => c.id !== commentId);
      storage.saveComments(updatedComments);
      setComments(updatedComments);
    }
  };

  // 프라이버시 필터: 지정된 두 사람(작성자와 수신자)만 조회할 수 있음. 
  // 단, 관리자(admin)는 마스터 권한으로 조회 가능.
  const isAccessible = (rep: DailyReport) => {
    if (currentUser.role === 'admin') return true;
    return rep.writerId === currentUser.id || rep.receiverId === currentUser.id;
  };

  // 접근 허용되고 월 및 기타 필터링이 적용된 최종 리스트
  const filteredReports = reports
    .filter(isAccessible)
    .filter((rep) => {
      if (selectedMonth === 'all') return true;
      const date = new Date(rep.createdAt);
      if (isNaN(date.getTime())) return false;
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      return `${yyyy}-${mm}` === selectedMonth;
    })
    .filter((rep) => {
      if (reportFilter === 'all') return true;
      if (reportFilter === 'sent') return rep.writerId === currentUser.id;
      if (reportFilter === 'received') return rep.receiverId === currentUser.id;
      return true;
    });

  const moods: { type: MoodType; icon: string; text: string; bg: string; border: string }[] = [
    { type: '😆 매우 밝음', icon: '😆', text: '매우 밝음', bg: 'bg-emerald-50', border: 'border-emerald-200 text-emerald-800' },
    { type: '🙂 평온함', icon: '🙂', text: '평온함', bg: 'bg-blue-50', border: 'border-blue-200 text-blue-800' },
    { type: '😴 조금 졸림/지침', icon: '😴', text: '조금 졸림', bg: 'bg-amber-50', border: 'border-amber-200 text-amber-800' },
    { type: '😟 불편함/예민함', icon: '😟', text: '예민함', bg: 'bg-purple-50', border: 'border-purple-200 text-purple-800' },
    { type: '🤒 아픔(통증/컨디션 난조)', icon: '🤒', text: '컨디션 아픔', bg: 'bg-rose-50', border: 'border-rose-200 text-rose-800' },
  ];

  return (
    <div className={`space-y-4 ${fontSizeClass}`} id="daily-report-list-tab">
      
      {/* 타이틀 및 월별 필터 바 */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9E4DB] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <div>
              <h1 className="text-base font-serif font-bold text-[#D97706]">꿈이음 비밀 알림장</h1>
              <p className="text-[11px] text-[#928B81]">직원과 수신 보호자 간의 1:1 비밀 소통 공간입니다.</p>
            </div>
          </div>
          {/* 글쓰기 버튼 (직원 또는 보호자) */}
          {!isWriting && !editingReport && currentUser.role !== 'admin' && (
            <button
              onClick={() => {
                setIsWriting(true);
                // 첫 수신자 세팅
                const recs = getReceivers();
                if (recs.length > 0) setReceiverId(recs[0].id);
              }}
              className="bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs px-3.5 py-2 rounded-2xl shadow-sm transition-all flex items-center gap-1"
              id="btn-trigger-write-report"
            >
              <span>✏️</span> 작성
            </button>
          )}
        </div>

        {/* 월별 필터 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E9E4DB]/40" id="monthly-filter-container">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5D554D]">📅 월별 필터:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#FEF9F2]/60 border border-[#E9E4DB] rounded-xl px-2 py-1.5 text-xs font-bold text-[#4A443F] focus:outline-none focus:border-[#D97706]"
            >
              <option value="all">전체 월 보기 📂</option>
              {getAvailableMonths().map((m) => {
                const [y, mm] = m.split('-');
                return (
                  <option key={m} value={m}>
                    {y}년 {mm}월 알림장 📝
                  </option>
                );
              })}
            </select>
          </div>

          {/* 알림장 구분 필터 (내가 쓴 / 받은 것) */}
          <div className="flex items-center gap-1.5" id="report-type-filter-container">
            <button
              type="button"
              onClick={() => setReportFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                reportFilter === 'all'
                  ? 'bg-[#D97706] text-white border-[#D97706]'
                  : 'bg-[#FAF9F6] text-[#5D554D] border-[#E9E4DB] hover:bg-[#FEF9F2]/40'
              }`}
            >
              전체 📂
            </button>
            <button
              type="button"
              onClick={() => setReportFilter('sent')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                reportFilter === 'sent'
                  ? 'bg-[#D97706] text-white border-[#D97706]'
                  : 'bg-[#FAF9F6] text-[#5D554D] border-[#E9E4DB] hover:bg-[#FEF9F2]/40'
              }`}
            >
              내가 작성한 것 ✏️
            </button>
            <button
              type="button"
              onClick={() => setReportFilter('received')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                reportFilter === 'received'
                  ? 'bg-[#D97706] text-white border-[#D97706]'
                  : 'bg-[#FAF9F6] text-[#5D554D] border-[#E9E4DB] hover:bg-[#FEF9F2]/40'
              }`}
            >
              받은 알림장 📩
            </button>
          </div>
        </div>
      </div>

      {/* 새 알림장 쓰기 양식 (모달로 시각적 완벽 격리) */}
      {isWriting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateReport} className="bg-white w-full max-w-lg p-5 rounded-3xl border-2 border-[#E9E4DB] space-y-4 shadow-xl animate-scaleUp max-h-[90vh] overflow-y-auto text-left" id="write-report-form">
          <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
            <span className="font-bold text-[#4A443F] text-sm flex items-center gap-1.5">
              💌 사랑이 담긴 알림장 쓰기
            </span>
            <button
              type="button"
              onClick={() => {
                setIsWriting(false);
                setSelectedImages([]);
              }}
              className="text-[#928B81] hover:text-[#4A443F] text-xs font-bold"
            >
              닫기 ✖️
            </button>
          </div>

          {/* 수신인 선택 */}
          <div>
            <label className="block text-xs font-bold text-[#5D554D] mb-1.5">👥 누구에게 보낼까요? (수신인 지정)</label>
            <select
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full bg-[#FEF9F2]/40 border border-[#E9E4DB] rounded-2xl p-3 text-xs focus:outline-none focus:border-[#D97706] font-bold text-[#4A443F]"
              required
            >
              <option value="" disabled>수신인을 선택해 주세요</option>
              {getReceivers().map((u) => (
                <option key={u.id} value={u.id}>
                  {u.role === 'parent' && u.patientName 
                    ? `👪 ${u.name} (회원: ${u.patientName})` 
                    : `${u.role === 'admin' ? '👑' : '👩‍🏫'} ${u.name}`}
                </option>
              ))}
            </select>
          </div>

          {/* 기분 카드 선택 (직원 및 보호자 공동) */}
          {(currentUser.role === 'staff' || currentUser.role === 'parent') && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#5D554D]">
                ⭐ 오늘의 기분 및 상태 리포트 (보호자 전달용)
              </label>
              <div className="grid grid-cols-5 gap-1" id="mood-selector">
                {moods.map((m) => {
                  const isSelected = selectedMood === m.type;
                  return (
                    <button
                      type="button"
                      key={m.type}
                      onClick={() => setSelectedMood(m.type)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        isSelected 
                          ? `${m.bg} border-[#D97706] ring-2 ring-[#FEF3C7] font-bold scale-105`
                          : 'bg-[#FAF9F6] border-[#E9E4DB] hover:bg-[#FEF9F2]/50'
                      }`}
                      title={m.type}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-[8px] text-[#4A443F] mt-1.5 font-bold tracking-tighter leading-tight">{m.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 제목 및 내용 */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">제목</label>
              <input
                type="text"
                placeholder="제목을 지어주세요 🌸"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-[#E9E4DB] focus:border-[#D97706] bg-[#FEF9F2]/10 rounded-2xl px-4 py-3 text-xs focus:outline-none font-bold text-[#4A443F]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">내용</label>
              <textarea
                placeholder="복지관에서 있었던 따뜻한 하루 일과나 공유하고 싶은 소식을 기재해 주세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full border border-[#E9E4DB] focus:border-[#D97706] bg-[#FEF9F2]/10 rounded-2xl px-4 py-3 text-xs focus:outline-none leading-relaxed text-[#4A443F]"
                required
              />
            </div>
          </div>

          {/* 다중 사진 다중 업로드 (무료 용량 관리: 70% 압축) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#5D554D]">
              📸 사진 첨부 (다중 선택 가능, 압축 자동 적용)
            </label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer bg-[#FFEDD5] hover:bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm">
                {isCompressing ? '⏳ 압축 중...' : '📂 파일 찾기...'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isCompressing}
                />
              </label>
              <span className="text-[10px] text-[#928B81]">기기 용량 및 네트워크 속도 최적화를 위해 이미지 압축이 자동 제공됩니다.</span>
            </div>

            {/* 업로드 대기 이미지 썸네일 */}
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 p-2 bg-[#FEF9F2]/50 rounded-2xl border border-[#E9E4DB]/50">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#E9E4DB]">
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] hover:bg-black font-extrabold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {writeError && (
            <p className="text-rose-500 text-xs font-bold text-center">⚠️ {writeError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs rounded-2xl shadow-sm transition-all"
            >
              작성 완료 💌
            </button>
            <button
              type="button"
              onClick={() => {
                setIsWriting(false);
                setSelectedImages([]);
              }}
              className="px-5 py-3 bg-[#FAF9F6] hover:bg-[#E9E4DB] text-[#5D554D] border border-[#E9E4DB] font-bold text-xs rounded-2xl transition-all"
            >
              취소
            </button>
          </div>
        </form>
        </div>
      )}

      {/* 알림장 수정 양식 (모달로 시각적 완벽 격리) */}
      {editingReport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveEdit} className="bg-white w-full max-w-lg p-5 rounded-3xl border-2 border-[#E9E4DB] space-y-4 shadow-xl animate-scaleUp max-h-[90vh] overflow-y-auto text-left" id="edit-report-form">
            <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
              <span className="font-serif font-bold text-[#D97706] text-sm">
                ✏️ 알림장 수정하기
              </span>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                className="text-[#928B81] hover:text-[#4A443F] text-xs font-bold"
              >
                닫기 ✖️
              </button>
            </div>

          <div>
            <label className="block text-xs font-bold text-[#5D554D] mb-1">제목</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border border-[#E9E4DB] focus:border-[#D97706] bg-[#FEF9F2]/10 rounded-2xl px-4 py-3 text-xs focus:outline-none font-bold text-[#4A443F]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5D554D] mb-1">내용</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={6}
              className="w-full border border-[#E9E4DB] focus:border-[#D97706] bg-[#FEF9F2]/10 rounded-2xl px-4 py-3 text-xs focus:outline-none leading-relaxed text-[#4A443F]"
              required
            />
          </div>

          {/* 기분 카드 선택 (직원 및 보호자 공동) */}
          {(editingReport.writerRole === 'staff' || editingReport.writerRole === 'parent') && (currentUser.role === 'staff' || currentUser.role === 'parent') && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#5D554D]">
                ⭐ 오늘의 기분 및 상태 리포트 수정
              </label>
              <div className="grid grid-cols-5 gap-1">
                {moods.map((m) => {
                  const isSelected = editMood === m.type;
                  return (
                    <button
                      type="button"
                      key={m.type}
                      onClick={() => setEditMood(m.type)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        isSelected 
                          ? `${m.bg} border-[#D97706] ring-2 ring-[#FEF3C7] font-bold scale-105`
                          : 'bg-[#FAF9F6] border-[#E9E4DB] hover:bg-[#FEF9F2]/50'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-[8px] text-[#4A443F] mt-1 font-bold">{m.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs rounded-2xl shadow-sm transition-all"
            >
              수정 완료 ✨
            </button>
            <button
              type="button"
              onClick={() => setEditingReport(null)}
              className="px-5 py-3 bg-[#FAF9F6] hover:bg-[#E9E4DB] text-[#5D554D] border border-[#E9E4DB] font-bold text-xs rounded-2xl transition-all"
            >
              취소
            </button>
          </div>
        </form>
        </div>
      )}

      {/* 알림장 목록 */}
      <div className="space-y-4" id="reports-feed">
        {filteredReports.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-[#E9E4DB] text-center text-[#928B81]">
            <span className="text-4xl block mb-2">🌸</span>
            작성된 비밀 알림장이 없습니다. <br />
            이달의 소중한 소통을 시작해보세요!
          </div>
        ) : (
          filteredReports.map((rep) => {
            const isOwner = rep.writerId === currentUser.id;
            const isAdmin = currentUser.role === 'admin';
            const repComments = comments.filter((c) => c.refId === rep.id);
            const hasLiked = rep.likes.includes(currentUser.id);

            // 기분 카드 정보 찾기
            const moodInfo = moods.find((m) => m.type === rep.mood);

            return (
              <div 
                key={rep.id} 
                className="bg-white rounded-3xl border border-[#E9E4DB] p-5 shadow-sm space-y-4 relative hover:shadow-md transition-shadow"
                id={`report-card-${rep.id}`}
              >
                {/* 헤더 및 권한 */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {rep.writerRole === 'staff' ? '👩‍🏫' : '👪'}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 max-w-[240px] xs:max-w-xs sm:max-w-md">
                        <span className="font-bold text-xs text-[#4A443F] whitespace-normal leading-tight">{rep.writerName}</span>
                        <span className="text-[10px] text-[#928B81] font-semibold flex-shrink-0">➡️</span>
                        <span className="font-bold text-xs text-[#4A443F] whitespace-normal leading-tight">{rep.receiverName}</span>
                      </div>
                      <span className="text-[9px] text-[#928B81] block mt-0.5">
                        {new Date(rep.createdAt).toLocaleString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* 수정/삭제 드롭다운 또는 버튼 */}
                  <div className="flex items-center gap-1.5">
                    {isOwner && (
                      <button
                        onClick={() => {
                          setEditingReport(rep);
                          setEditTitle(rep.title);
                          setEditContent(rep.content);
                          setEditMood(rep.mood);
                        }}
                        className="text-[10px] font-bold text-[#92400E] bg-[#FEF9F2] px-2 py-1 rounded-xl border border-[#E9E4DB]"
                      >
                        수정
                      </button>
                    )}
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => handleDeleteReport(rep.id, rep.writerId)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-xl border ${
                          isAdmin && !isOwner 
                            ? 'text-rose-600 bg-rose-50 border-rose-100 font-bold' 
                            : 'text-[#928B81] bg-[#FAF9F6] border-[#E9E4DB]'
                        }`}
                        title={isAdmin && !isOwner ? '관리자 강제삭제' : '삭제'}
                      >
                        {isAdmin && !isOwner ? '👑 삭제' : '삭제'}
                      </button>
                    )}
                  </div>
                </div>

                {/* 기분 및 상태 카드 (직원 작성글이며 mood가 존재할 때 상단 카드 노출) */}
                {rep.writerRole === 'staff' && moodInfo && (
                  <div className={`p-3 rounded-2xl border ${moodInfo.bg} ${moodInfo.border} flex items-center gap-2.5 animate-fadeIn`}>
                    <span className="text-3xl animate-bounce duration-1000">{moodInfo.icon}</span>
                    <div>
                      <span className="text-[10px] font-bold block opacity-60">오늘의 기분 및 건강 상태 리포트</span>
                      <span className="text-xs font-bold tracking-tight">{moodInfo.type}</span>
                    </div>
                  </div>
                )}

                {/* 알림장 본문 */}
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-sm text-[#4A443F] leading-tight">
                    {rep.title}
                  </h3>
                  <p className="text-xs text-[#5D554D] leading-relaxed whitespace-pre-line">
                    {rep.content}
                  </p>
                </div>

                {/* 이미지 갤러리 */}
                {rep.images && rep.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {rep.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#E9E4DB] bg-[#FAF9F6]">
                        <img 
                          src={img} 
                          alt="activity" 
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                          referrerPolicy="no-referrer"
                          onClick={() => {
                            // 간단 새 창 띄우기 (또는 이모지 클릭 등)
                            const w = window.open();
                            w?.document.write(`<img src="${img}" style="width:100%; max-width:800px; display:block; margin:0 auto;" />`);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 인터랙션 영역 (이모지 공감 피드백 & 댓글 개수) */}
                <div className="pt-2 border-t border-[#E9E4DB]/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <EmojiReactions 
                      reactions={rep.reactions}
                      currentUserId={currentUser.id}
                      onReact={(emoji) => handleReactEmoji(rep.id, emoji)}
                    />
                    
                    <div className="flex items-center gap-1.5 text-xs text-[#928B81] font-bold shrink-0 self-end pb-1">
                      <span className="text-base">💬</span>
                      <span>댓글 {repComments.length}개</span>
                    </div>
                  </div>
                </div>

                {/* 댓글 영역 */}
                <div className="bg-[#FEF9F2]/60 rounded-2xl p-3 space-y-2.5 border border-[#E9E4DB]/40">
                  {/* 댓글 목록 */}
                  {repComments.length > 0 && (
                    <div className="space-y-2 divide-y divide-[#E9E4DB]/40">
                      {repComments.map((comm) => {
                        const isCommOwner = comm.writerId === currentUser.id;
                        const isCommAdmin = currentUser.role === 'admin';
                        return (
                          <div key={comm.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[11px] text-[#4A443F]">{comm.writerName}</span>
                                <span className={`text-[8px] px-1 rounded-full font-bold ${
                                  comm.writerRole === 'staff' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#FFEDD5] text-[#92400E]'
                                }`}>
                                  {comm.writerRole === 'staff' ? '직원' : '보호자'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#5D554D] mt-0.5 leading-relaxed">
                                {comm.content}
                              </p>
                            </div>
                            {(isCommOwner || isCommAdmin) && (
                              <button
                                onClick={() => handleDeleteComment(comm.id, comm.writerId)}
                                className="text-[9px] text-[#928B81] hover:text-rose-500 font-bold shrink-0"
                              >
                                {isCommAdmin && !isCommOwner ? '👑 삭제' : '삭제'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 댓글 입력 폼 (로그인 사용자 대상) */}
                  <div className="flex items-center gap-1.5 pt-1.5">
                    <input
                      type="text"
                      placeholder="따뜻한 댓글을 남겨주세요... 💬"
                      value={newCommentText[rep.id] || ''}
                      onChange={(e) => setNewCommentText((prev) => ({ ...prev, [rep.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(rep.id);
                      }}
                      className="flex-1 bg-white border border-[#E9E4DB] rounded-xl px-3 py-1.5 text-[11px] focus:outline-none focus:border-[#D97706] text-[#4A443F]"
                    />
                    <button
                      onClick={() => handleAddComment(rep.id)}
                      className="bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-sm transition-all shrink-0"
                      id={`btn-add-comment-${rep.id}`}
                    >
                      등록
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
