import React, { useState, useEffect } from 'react';
import { User, Album } from '../types';
import { storage } from '../utils/storage';
import { compressImage } from '../utils/imageCompress';
import EmojiReactions from './EmojiReactions';

interface AlbumGridProps {
  currentUser: User;
  fontSizeClass: string;
}

export default function AlbumGrid({ currentUser, fontSizeClass }: AlbumGridProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  
  // 폼 상태
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [writeError, setWriteError] = useState('');

  // 수정 폼 상태
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isEditCompressing, setIsEditCompressing] = useState(false);

  // 라이트박스 뷰어용 상태
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    setAlbums(storage.getAlbums());

    // 실시간 구독 활성화
    const unsub = storage.subscribe<Album>('albums', (newAlbums) => {
      setAlbums(newAlbums);
    });

    return unsub;
  }, []);

  const handleCreateAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    setWriteError('');

    if (!title.trim() || !date) {
      setWriteError('제목과 날짜를 입력해 주세요. 📝');
      return;
    }

    if (selectedImages.length === 0) {
      setWriteError('최소 한 장 이상의 사진을 선택해 주세요. 📸');
      return;
    }

    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      title: title.trim(),
      date,
      images: selectedImages,
      writerId: currentUser.id,
      writerName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const updated = [newAlbum, ...albums];
    storage.saveAlbums(updated);
    setAlbums(updated);

    // 초기화
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedImages([]);
    setIsWriting(false);
    alert('활동 앨범이 정상적으로 등록되었습니다! 📸✨');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsCompressing(true);
    const files = Array.from(e.target.files) as File[];

    try {
      const compressedB64s: string[] = [];
      for (const file of files) {
        const compressed = await compressImage(file, 900, 0.7); // 앨범용은 화질을 위해 약간 더 큼
        compressedB64s.push(compressed);
      }
      setSelectedImages((prev) => [...prev, ...compressedB64s]);
    } catch (err) {
      console.error(err);
      alert('이미지를 업로드하는 도중 에러가 발생했습니다.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsEditCompressing(true);
    const files = Array.from(e.target.files) as File[];

    try {
      const compressedB64s: string[] = [];
      for (const file of files) {
        const compressed = await compressImage(file, 900, 0.7);
        compressedB64s.push(compressed);
      }
      setEditImages((prev) => [...prev, ...compressedB64s]);
    } catch (err) {
      console.error(err);
      alert('이미지를 업로드하는 도중 에러가 발생했습니다.');
    } finally {
      setIsEditCompressing(false);
    }
  };

  const handleRemoveEditImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveEditAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum) return;

    if (!editTitle.trim() || !editDate) {
      alert('제목과 날짜를 입력해 주세요. 📝');
      return;
    }

    if (editImages.length === 0) {
      alert('최소 한 장 이상의 사진을 지정해 주세요. 📸');
      return;
    }

    const updated = albums.map((a) => {
      if (a.id === editingAlbum.id) {
        return {
          ...a,
          title: editTitle.trim(),
          date: editDate,
          images: editImages,
        };
      }
      return a;
    });

    storage.saveAlbums(updated);
    setAlbums(updated);
    setEditingAlbum(null);
    alert('활동 앨범이 성공적으로 수정되었습니다! 📸✨');
  };

  const handleDeleteAlbum = (albumId: string, writerId: string) => {
    const isOwner = currentUser.id === writerId;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    const confirmMsg = isAdmin && !isOwner 
      ? '👑 관리자 권한으로 이 앨범을 강제 삭제하시겠습니까? (서버 용량 조절용)' 
      : '이 앨범을 정말로 삭제하시겠습니까?';

    if (window.confirm(confirmMsg)) {
      const updated = albums.filter((a) => a.id !== albumId);
      storage.saveAlbums(updated);
      setAlbums(updated);
      alert('앨범이 삭제되었습니다. 🗑️');
    }
  };

  // 이모지 공감 피드백 토글 기능
  const handleReactEmoji = (albumId: string, emoji: string) => {
    const updated = albums.map((a) => {
      if (a.id === albumId) {
        const currentReactions = a.reactions || {};
        const users = currentReactions[emoji] || [];
        const hasReacted = users.includes(currentUser.id);

        const nextUsers = hasReacted
          ? users.filter((uid) => uid !== currentUser.id)
          : [...users, currentUser.id];

        return {
          ...a,
          reactions: {
            ...currentReactions,
            [emoji]: nextUsers
          }
        };
      }
      return a;
    });
    storage.saveAlbums(updated);
    setAlbums(updated);
  };

  // Base64 다운로드 트리거 헬퍼
  const downloadImage = (base64Data: string, filename: string) => {
    // 플레이스홀더 이미지 처리
    if (!base64Data) {
      alert('다운로드할 수 없는 이미지입니다.');
      return;
    }
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 더미 이미지 렌더링용 파스텔 컬러맵
  const getPastelColor = (idx: number) => {
    const colors = [
      'from-emerald-100 to-teal-100 text-emerald-800',
      'from-amber-100 to-orange-100 text-amber-800',
      'from-pink-100 to-rose-100 text-pink-800',
      'from-sky-100 to-blue-100 text-sky-800',
      'from-purple-100 to-fuchsia-100 text-purple-800',
    ];
    return colors[idx % colors.length];
  };

  return (
    <div className={`space-y-4 ${fontSizeClass}`} id="album-grid-tab">
      
      {/* 타이틀 및 작성 유도 */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9E4DB] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <div>
            <h1 className="text-base font-serif font-bold text-[#D97706]">꿈이음 활동 앨범</h1>
            <p className="text-[11px] text-[#928B81]">회원님들의 소중하고 행복한 순간들을 공유합니다.</p>
          </div>
        </div>
        {!isWriting && (currentUser.role === 'staff' || currentUser.role === 'admin') && (
          <button
            onClick={() => setIsWriting(true)}
            className="bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs px-3.5 py-2 rounded-2xl shadow-sm transition-all"
            id="btn-trigger-write-album"
          >
            ➕ 사진 올리기
          </button>
        )}
      </div>

      {/* 앨범 작성 양식 (모달로 시각적 완벽 격리) */}
      {isWriting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateAlbum} className="bg-white w-full max-w-lg p-5 rounded-3xl border-2 border-[#E9E4DB] space-y-4 shadow-xl animate-scaleUp max-h-[90vh] overflow-y-auto text-left" id="write-album-form">
          <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
            <span className="font-bold text-[#4A443F] text-sm flex items-center gap-1.5">
              📸 새 활동 앨범 등록하기
            </span>
            <button
              type="button"
              onClick={() => {
                setIsWriting(false);
                setSelectedImages([]);
              }}
              className="text-[#928B81] hover:text-[#4A443F] text-xs font-bold"
            >
              닫기 ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">행사 날짜</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D97706] font-bold text-[#4A443F]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">앨범 제목</label>
              <input
                type="text"
                placeholder="예: 텃밭 상추 심기 🌱"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D97706] font-bold text-[#4A443F]"
                required
              />
            </div>
          </div>

          {/* 사진 다중 선택 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#5D554D]">
              🖼️ 활동 사진 등록 (복수 선택, 자동 압축)
            </label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer bg-[#FFEDD5] hover:bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm">
                {isCompressing ? '⏳ 이미지 압축 중...' : '📂 이미지 선택...'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isCompressing}
                />
              </label>
              <span className="text-[10px] text-[#928B81]">자동 고화질 압축으로 보관 용량을 대폭 줄여줍니다.</span>
            </div>

            {/* 선택한 이미지 썸네일 */}
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 p-2 bg-[#FEF9F2]/50 rounded-2xl border border-[#E9E4DB]/50">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#E9E4DB] bg-white">
                    <img src={img} alt="upload" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] hover:bg-black font-bold"
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

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-3 bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs rounded-2xl shadow-sm transition-all"
            >
              앨범 발행하기 ✨
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

      {/* 앨범 수정 양식 (모달로 시각적 완벽 격리) */}
      {editingAlbum && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveEditAlbum} className="bg-white w-full max-w-lg p-5 rounded-3xl border-2 border-emerald-100 space-y-4 shadow-xl animate-scaleUp max-h-[90vh] overflow-y-auto text-left" id="edit-album-form">
          <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
            <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
              📸 활동 앨범 수정하기
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingAlbum(null);
                setEditImages([]);
              }}
              className="text-[#928B81] hover:text-[#4A443F] text-xs font-bold"
            >
              닫기 ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">행사 날짜</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-bold text-[#4A443F]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">앨범 제목</label>
              <input
                type="text"
                placeholder="예: 텃밭 상추 심기 🌱"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-bold text-[#4A443F]"
                required
              />
            </div>
          </div>

          {/* 사진 다중 선택 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#5D554D]">
              🖼️ 활동 사진 수정 (선택 시 추가됨, 압축 지원)
            </label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer bg-[#FFEDD5] hover:bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm">
                {isEditCompressing ? '⏳ 이미지 압축 중...' : '📂 추가 이미지 선택...'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="hidden"
                  disabled={isEditCompressing}
                />
              </label>
              <span className="text-[10px] text-[#928B81]">새 사진을 추가하거나 기존 사진을 삭제/유지할 수 있습니다.</span>
            </div>

            {/* 현재/선택한 이미지 썸네일 */}
            {editImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 p-2 bg-[#FEF9F2]/50 rounded-2xl border border-[#E9E4DB]/50">
                {editImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#E9E4DB] bg-white">
                    <img src={img} alt="upload edit" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveEditImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] hover:bg-black font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-sm transition-all"
            >
              수정 완료 ✨
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingAlbum(null);
                setEditImages([]);
              }}
              className="px-5 py-3 bg-[#FAF9F6] hover:bg-[#E9E4DB] text-[#5D554D] border border-[#E9E4DB] font-bold text-xs rounded-2xl transition-all"
            >
              취소
            </button>
          </div>
        </form>
        </div>
      )}

      {/* 앨범 그리드 피드 */}
      <div className="space-y-6" id="album-list">
        {albums.map((album, aIdx) => {
          const isOwner = album.writerId === currentUser.id;
          const isAdmin = currentUser.role === 'admin';

          return (
            <div 
              key={album.id} 
              className="bg-white rounded-3xl border border-[#E9E4DB] p-5 shadow-sm space-y-3"
              id={`album-card-${album.id}`}
            >
              {/* 앨범 헤더 */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                      📅 {album.date}
                    </span>
                    <span className="text-[10px] text-[#928B81] font-semibold">
                      올린이: {album.writerName}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-[#4A443F] mt-1 leading-tight">
                    {album.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  {isOwner && (
                    <button
                      onClick={() => {
                        setEditingAlbum(album);
                        setEditTitle(album.title);
                        setEditDate(album.date);
                        setEditImages(album.images || []);
                      }}
                      className="text-[10px] font-bold text-[#92400E] bg-[#FEF9F2] px-2.5 py-1 rounded-xl border border-[#E9E4DB] hover:bg-[#FEF3C7] transition-all"
                    >
                      수정
                    </button>
                  )}

                  {(isOwner || isAdmin) && (
                    <button
                      onClick={() => handleDeleteAlbum(album.id, album.writerId)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-xl border ${
                        isAdmin && !isOwner 
                          ? 'text-rose-600 bg-rose-50 border-rose-100 font-bold' 
                          : 'text-[#928B81] bg-[#FAF9F6] border-[#E9E4DB]'
                      }`}
                    >
                      {isAdmin && !isOwner ? '👑 강제 삭제' : '삭제'}
                    </button>
                  )}
                </div>
              </div>

              {/* 사진 그리드 내역 */}
              {album.images && album.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2" id={`album-grid-${album.id}`}>
                  {album.images.map((img, iIdx) => (
                    <div 
                      className="group relative aspect-square bg-[#FAF9F6] rounded-2xl overflow-hidden border border-[#E9E4DB] shadow-sm"
                      key={iIdx}
                    >
                      <img 
                        src={img} 
                        alt="album grid item" 
                        onClick={() => setActivePhoto(img)}
                        className="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-300" 
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* 개별 다운로드 버튼 */}
                      <button
                        onClick={() => downloadImage(img, `꿈이음_앨범_${album.date}_${iIdx + 1}.jpg`)}
                        className="absolute bottom-2 right-2 bg-white/95 hover:bg-white text-[#92400E] p-2 rounded-xl text-xs font-bold shadow-md border border-[#E9E4DB]/60 transition-transform active:scale-95 flex items-center gap-1 z-10"
                        title="기기로 다운로드"
                      >
                        📥 <span className="text-[9px] font-bold">저장</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* 사진이 비어있는 디폴트 더미 앨범 카드는 아름다운 자연/미술 컨셉의 파스텔 카드로 렌더링 */
                <div className={`p-8 rounded-2xl bg-gradient-to-br ${getPastelColor(aIdx)} flex flex-col items-center justify-center border border-dashed border-current/30 text-center space-y-2`}>
                  <span className="text-4xl animate-bounce duration-1000">🎨</span>
                  <div className="text-xs font-bold opacity-90">아름다운 미술/현장 체험 활동 날 🍀</div>
                  <p className="text-[10px] opacity-75 max-w-[200px] leading-normal">
                    본 가상 앨범은 데이터 보호를 위해 파스텔 카드로 안전하게 제공되고 있습니다. 다운로드 기능은 실제 사진을 업로드하여 자유롭게 체험해 보세요!
                  </p>
                  <button
                    disabled
                    className="opacity-50 bg-white/50 border border-current text-[10px] font-bold px-3 py-1 rounded-xl"
                  >
                    📥 보존 완료
                  </button>
                </div>
              )}

              {/* 이모지 공감 피드백 */}
              <EmojiReactions 
                reactions={album.reactions}
                currentUserId={currentUser.id}
                onReact={(emoji) => handleReactEmoji(album.id, emoji)}
              />
            </div>
          );
        })}
      </div>

      {/* 라이트박스 뷰어 (크게 보기 모달) */}
      {activePhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <button 
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 text-white text-2xl font-bold bg-white/10 w-10 h-10 rounded-full flex items-center justify-center"
          >
            ✕
          </button>
          
          <img 
            src={activePhoto} 
            alt="lightbox view" 
            className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-white/10" 
            onClick={(e) => e.stopPropagation()} // 뒷배경 클릭 시에만 꺼지게
            referrerPolicy="no-referrer"
          />

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => downloadImage(activePhoto, `꿈이음_고화질_활동사진_${Date.now()}.jpg`)}
              className="px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs rounded-2xl shadow-lg flex items-center gap-1.5"
            >
              📥 원본 기기에 저장하기
            </button>
            <button
              onClick={() => setActivePhoto(null)}
              className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-2xl"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
