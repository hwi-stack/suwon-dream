import React, { useState, useEffect } from 'react';
import { User, CalendarEvent } from '../types';
import { storage } from '../utils/storage';

interface CalendarViewProps {
  currentUser: User;
  fontSizeClass: string;
}

export default function CalendarView({ currentUser, fontSizeClass }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isWriting, setIsWriting] = useState(false);

  // 현재 달력 기준 년/월 (2026년 6월 기준 초기화)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 1-indexed

  // 일정 등록 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [useRange, setUseRange] = useState(false);
  const [endDateStr, setEndDateStr] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [timeStr, setTimeStr] = useState('');
  const [location, setLocation] = useState('');
  const [materials, setMaterials] = useState('');
  const [extra, setExtra] = useState('');
  const [writeError, setWriteError] = useState('');

  // 일정 수정 폼 상태
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSelectedDateStr, setEditSelectedDateStr] = useState('');
  const [editUseRange, setEditUseRange] = useState(false);
  const [editEndDateStr, setEditEndDateStr] = useState('');
  const [editIsAllDay, setEditIsAllDay] = useState(true);
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('10:00');
  const [editTimeStr, setEditTimeStr] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editMaterials, setEditMaterials] = useState('');
  const [editExtra, setEditExtra] = useState('');

  // 날짜 선택 상세 보기 팝업 상태
  const [selectedEventDetails, setSelectedEventDetails] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    setEvents(storage.getEvents());

    // 실시간 구독 활성화
    const unsub = storage.subscribe<CalendarEvent>('events', (newEvents) => {
      setEvents(newEvents);
    });

    return unsub;
  }, []);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setWriteError('');

    if (!title.trim() || !content.trim() || !selectedDateStr) {
      setWriteError('제목, 상세 내용 및 날짜를 올바르게 지정해 주세요. 📝');
      return;
    }

    if (useRange && !endDateStr) {
      setWriteError('종료 날짜를 지정해 주세요. 📅');
      return;
    }

    if (useRange && endDateStr < selectedDateStr) {
      setWriteError('종료 날짜는 시작 날짜보다 빠를 수 없습니다. 📅');
      return;
    }

    // 기간 선택이 켜져 있으면 시간 정보를 모두 없앱니다.
    const finalIsAllDay = useRange ? true : isAllDay;

    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      date: selectedDateStr,
      endDate: useRange ? endDateStr : undefined,
      isAllDay: finalIsAllDay,
      time: !finalIsAllDay ? `${startTime} ~ ${endTime}` : undefined,
      startTime: !finalIsAllDay ? startTime : undefined,
      endTime: !finalIsAllDay ? endTime : undefined,
      location: location.trim() || undefined,
      materials: materials.trim() || undefined,
      extra: extra.trim() || undefined,
      writerId: currentUser.id,
      writerName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const updated = [...events, newEvent];
    storage.saveEvents(updated);
    setEvents(updated);

    // 초기화
    setTitle('');
    setContent('');
    setSelectedDateStr('');
    setEndDateStr('');
    setUseRange(false);
    setIsAllDay(true);
    setStartTime('09:00');
    setEndTime('10:00');
    setTimeStr('');
    setLocation('');
    setMaterials('');
    setExtra('');
    setIsWriting(false);
    alert('달력 일정이 성실하게 등록되었습니다! 📅✨');
  };

  const handleDeleteEvent = (eventId: string, writerId: string) => {
    const isOwner = currentUser.id === writerId;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    const confirmMsg = isAdmin && !isOwner 
      ? '👑 관리자 권한으로 이 일정을 강제 삭제하시겠습니까?' 
      : '일정을 정말로 삭제하시겠습니까?';

    if (window.confirm(confirmMsg)) {
      const updated = events.filter((e) => e.id !== eventId);
      storage.saveEvents(updated);
      setEvents(updated);
      setSelectedEventDetails(null);
      alert('일정이 삭제되었습니다. 🗑️');
    }
  };

  const handleSaveEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 모두 입력해 주세요. 📝');
      return;
    }

    if (editUseRange && !editEndDateStr) {
      alert('종료 날짜를 지정해 주세요. 📅');
      return;
    }

    if (editUseRange && editEndDateStr < editSelectedDateStr) {
      alert('종료 날짜는 시작 날짜보다 빠를 수 없습니다. 📅');
      return;
    }

    // 기간 선택이 켜져 있으면 시간 정보를 모두 없앱니다.
    const finalEditIsAllDay = editUseRange ? true : editIsAllDay;

    const updated = events.map((ev) => {
      if (ev.id === editingEvent.id) {
        return {
          ...ev,
          title: editTitle.trim(),
          content: editContent.trim(),
          date: editSelectedDateStr,
          endDate: editUseRange ? editEndDateStr : undefined,
          isAllDay: finalEditIsAllDay,
          time: !finalEditIsAllDay ? `${editStartTime} ~ ${editEndTime}` : undefined,
          startTime: !finalEditIsAllDay ? editStartTime : undefined,
          endTime: !finalEditIsAllDay ? editEndTime : undefined,
          location: editLocation.trim() || undefined,
          materials: editMaterials.trim() || undefined,
          extra: editExtra.trim() || undefined,
        };
      }
      return ev;
    });

    storage.saveEvents(updated);
    setEvents(updated);
    setEditingEvent(null);
    setSelectedEventDetails(null);
    alert('일정이 성공적으로 수정되었습니다! ✨');
  };

  // 월별 이동
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // 달력 생성 헬퍼
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayIndex = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday, ...
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayIndex(currentYear, currentMonth);

  // 날짜 그리드 만들기
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null); // 공백 채우기
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  // 특정 날짜의 일정 목록 가져오기
  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => {
      const start = e.date;
      const end = e.endDate || e.date;
      return dateStr >= start && dateStr <= end;
    });
  };

  return (
    <div className={`space-y-4 ${fontSizeClass}`} id="calendar-view-tab">
      
      {/* 상단 타이틀 */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9E4DB] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📅</span>
          <div>
            <h1 className="text-base font-serif font-bold text-[#D97706]">꿈이음 캘린더</h1>
            <p className="text-[11px] text-[#928B81]">주간이용시설 꿈이음의 주요 일과 및 일정 안내입니다.</p>
          </div>
        </div>
        {!isWriting && (currentUser.role === 'staff' || currentUser.role === 'admin') && (
          <button
            onClick={() => {
              setIsWriting(true);
              const defaultDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
              setSelectedDateStr(defaultDate);
              setEndDateStr(defaultDate);
              setUseRange(false);
              setIsAllDay(true);
              setTimeStr('');
              setLocation('');
            }}
            className="bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs px-3.5 py-2 rounded-2xl shadow-sm transition-all"
            id="btn-trigger-write-event"
          >
            ➕ 일정 추가
          </button>
        )}
      </div>

      {/* 새 일정 등록 양식 */}
      {isWriting && (
        <form onSubmit={handleCreateEvent} className="bg-white p-5 rounded-3xl border-2 border-[#E9E4DB] space-y-3.5 shadow-md animate-fadeIn" id="write-event-form">
          <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
            <span className="font-bold text-[#4A443F] text-sm flex items-center gap-1.5">
              📅 새 일정 등록하기
            </span>
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="text-[#928B81] hover:text-[#4A443F] text-xs font-bold"
            >
              닫기 ✕
            </button>
          </div>

          {/* 새 일정 옵션 (종일 & 기간 지정) */}
          <div className="bg-[#FEF9F2]/60 p-3 rounded-2xl border border-[#E9E4DB]/40 space-y-2">
            <span className="block text-xs font-bold text-[#5D554D]">⏰ 일정 유형 선택</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUseRange(false);
                  setIsAllDay(true);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  !useRange && isAllDay
                    ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm'
                    : 'bg-white text-[#5D554D] border-[#E9E4DB] hover:bg-[#FEF9F2]/50'
                }`}
              >
                ☀️ 하루 종일 (1일)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseRange(false);
                  setIsAllDay(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  !useRange && !isAllDay
                    ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm'
                    : 'bg-white text-[#5D554D] border-[#E9E4DB] hover:bg-[#FEF9F2]/50'
                }`}
              >
                🕒 시간 지정 (1일)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseRange(true);
                  setIsAllDay(true);
                  if (!endDateStr) {
                    setEndDateStr(selectedDateStr);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  useRange
                    ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm'
                    : 'bg-white text-[#5D554D] border-[#E9E4DB] hover:bg-[#FEF9F2]/50'
                }`}
              >
                📅 기간 지정 (연일)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 날짜 선택 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#5D554D]">
                {useRange ? '시작 일자' : '일정 일자'}
              </label>
              <input
                type="date"
                value={selectedDateStr}
                onChange={(e) => {
                  setSelectedDateStr(e.target.value);
                  if (!useRange || !endDateStr || endDateStr < e.target.value) {
                    setEndDateStr(e.target.value);
                  }
                }}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D97706] font-bold text-[#4A443F]"
                required
              />
            </div>

            {useRange && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#5D554D]">종료 일자</label>
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D97706] font-bold text-[#4A443F]"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 시간 선택 (종일 일정이 아닐 경우) */}
            {!isAllDay && !useRange && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#5D554D]">🕒 행사 시간 (시작 ~ 종료)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-[#D97706] font-bold text-[#4A443F]"
                    required
                  />
                  <span className="text-xs text-gray-400">~</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-[#D97706] font-bold text-[#4A443F]"
                    required
                  />
                </div>
              </div>
            )}

            {/* 장소 입력 (선택사항) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#5D554D]">활동 장소 (선택)</label>
              <input
                type="text"
                placeholder="예: 꿈이음 2층 강당, 하늘공원"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D97706] text-[#4A443F]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#5D554D]">일정 제목</label>
            <input
              type="text"
              placeholder="예: 야외 꽃 나들이 🌸"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D97706] font-bold text-[#4A443F]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5D554D] mb-1">활동 상세 내용</label>
            <textarea
              placeholder="일정 활동 계획과 진행 내용에 관해 기록해 주세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-3 text-xs focus:outline-none focus:border-[#D97706] leading-normal text-[#4A443F]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">준비물 (선택)</label>
              <input
                type="text"
                placeholder="예: 편한 운동화, 모자"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-[#D97706] text-[#4A443F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">기타 참고사항 (선택)</label>
              <input
                type="text"
                placeholder="예: 우천 시 일정 순연"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-[#D97706] text-[#4A443F]"
              />
            </div>
          </div>

          {writeError && (
            <p className="text-rose-500 text-xs font-bold text-center">⚠️ {writeError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs rounded-xl shadow-sm"
            >
              일정 발행 ✨
            </button>
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="px-4 py-2.5 bg-[#FAF9F6] hover:bg-[#E9E4DB] text-[#5D554D] border border-[#E9E4DB] font-bold text-xs rounded-xl"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 일정 수정 양식 */}
      {editingEvent && (
        <form onSubmit={handleSaveEditEvent} className="bg-white p-5 rounded-3xl border-2 border-emerald-100 space-y-3.5 shadow-md animate-fadeIn" id="edit-event-form">
          <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
            <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
              📅 일정 수정하기
            </span>
            <button
              type="button"
              onClick={() => setEditingEvent(null)}
              className="text-[#928B81] hover:text-[#4A443F] text-xs font-bold"
            >
              닫기 ✕
            </button>
          </div>

          {/* 일정 옵션 (종일 & 기간 지정) */}
          <div className="bg-[#FEF9F2]/60 p-3 rounded-2xl border border-emerald-100 space-y-2">
            <span className="block text-xs font-bold text-emerald-950">⏰ 일정 유형 선택</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditUseRange(false);
                  setEditIsAllDay(true);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  !editUseRange && editIsAllDay
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-white text-[#5D554D] border-gray-200 hover:bg-emerald-50'
                }`}
              >
                ☀️ 하루 종일 (1일)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditUseRange(false);
                  setEditIsAllDay(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  !editUseRange && !editIsAllDay
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-white text-[#5D554D] border-gray-200 hover:bg-emerald-50'
                }`}
              >
                🕒 시간 지정 (1일)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditUseRange(true);
                  setEditIsAllDay(true);
                  if (!editEndDateStr) {
                    setEditEndDateStr(editSelectedDateStr);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  editUseRange
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-white text-[#5D554D] border-gray-200 hover:bg-emerald-50'
                }`}
              >
                📅 기간 지정 (연일)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 날짜 선택 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#5D554D]">
                {editUseRange ? '시작 일자' : '일정 일자'}
              </label>
              <input
                type="date"
                value={editSelectedDateStr}
                onChange={(e) => {
                  setEditSelectedDateStr(e.target.value);
                  if (!editUseRange || !editEndDateStr || editEndDateStr < e.target.value) {
                    setEditEndDateStr(e.target.value);
                  }
                }}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-bold text-[#4A443F]"
                required
              />
            </div>

            {editUseRange && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#5D554D]">종료 일자</label>
                <input
                  type="date"
                  value={editEndDateStr}
                  onChange={(e) => setEditEndDateStr(e.target.value)}
                  className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-bold text-[#4A443F]"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 시간 선택 (종일 일정이 아닐 경우) */}
            {!editIsAllDay && !editUseRange && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#5D554D]">🕒 행사 시간 (시작 ~ 종료)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-emerald-500 font-bold text-[#4A443F]"
                    required
                  />
                  <span className="text-xs text-gray-400">~</span>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-emerald-500 font-bold text-[#4A443F]"
                    required
                  />
                </div>
              </div>
            )}

            {/* 장소 입력 (선택사항) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#5D554D]">활동 장소 (선택)</label>
              <input
                type="text"
                placeholder="예: 꿈이음 2층 강당, 하늘공원"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 text-[#4A443F]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#5D554D]">일정 제목</label>
            <input
              type="text"
              placeholder="예: 야외 꽃 나들이 🌸"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-bold text-[#4A443F]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5D554D] mb-1">활동 상세 내용</label>
            <textarea
              placeholder="일정 활동 계획과 진행 내용에 관해 기록해 주세요..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 leading-normal text-[#4A443F]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">준비물 (선택)</label>
              <input
                type="text"
                placeholder="예: 편한 운동화, 모자"
                value={editMaterials}
                onChange={(e) => setEditMaterials(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-emerald-500 text-[#4A443F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5D554D] mb-1">기타 참고사항 (선택)</label>
              <input
                type="text"
                placeholder="예: 우천 시 일정 순연"
                value={editExtra}
                onChange={(e) => setEditExtra(e.target.value)}
                className="w-full bg-[#FEF9F2]/20 border border-[#E9E4DB] rounded-xl p-2 text-xs focus:outline-none focus:border-emerald-500 text-[#4A443F]"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              수정 완료 ✨
            </button>
            <button
              type="button"
              onClick={() => setEditingEvent(null)}
              className="px-4 py-2.5 bg-[#FAF9F6] hover:bg-[#E9E4DB] text-[#5D554D] border border-[#E9E4DB] font-bold text-xs rounded-xl"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 달력 본체 뷰 */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9E4DB] shadow-sm" id="calendar-grid-card">
        {/* 달력 헤더 (연/월 컨트롤) */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E9E4DB]/40">
          <button 
            onClick={handlePrevMonth}
            className="text-[#4A443F] p-2 font-bold hover:bg-[#FEF9F2] rounded-xl text-xs transition-colors"
          >
            ◀ 이전 달
          </button>
          <span className="text-sm font-extrabold text-[#D97706] font-serif">
            {currentYear}년 {currentMonth}월 📅
          </span>
          <button 
            onClick={handleNextMonth}
            className="text-[#4A443F] p-2 font-bold hover:bg-[#FEF9F2] rounded-xl text-xs transition-colors"
          >
            다음 달 ▶
          </button>
        </div>

        {/* 요일 그리드 */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#928B81] mb-2">
          <span className="text-rose-500">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span className="text-blue-500">토</span>
        </div>

        {/* 일자 그리드 */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="aspect-square bg-gray-50/20 rounded-xl" />;
            }

            const dateEvents = getEventsForDate(day);
            const isToday = 
              new Date().getFullYear() === currentYear && 
              new Date().getMonth() + 1 === currentMonth && 
              new Date().getDate() === day;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (dateEvents.length > 0) {
                    setSelectedEventDetails(dateEvents[0]); // 첫 일정 띄워주기
                  } else if (currentUser.role === 'staff' || currentUser.role === 'admin') {
                    // 일정이 없는 빈 칸은 직원일 경우 새 일정 작성창 유도
                    setIsWriting(true);
                    const clickedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    setSelectedDateStr(clickedDate);
                    setEndDateStr(clickedDate);
                    setUseRange(false);
                    setIsAllDay(true);
                    setTimeStr('');
                    setLocation('');
                  }
                }}
                className={`relative aspect-square border border-[#E9E4DB]/40 rounded-xl flex flex-col justify-between p-1 cursor-pointer transition-all ${
                  isToday 
                    ? 'bg-[#FEF3C7] ring-2 ring-[#FDE68A] font-extrabold scale-95' 
                    : dateEvents.length > 0
                    ? 'bg-[#FFEDD5]/40 border-[#FDE68A] hover:bg-[#FFEDD5]/60'
                    : 'bg-white hover:bg-[#FEF9F2]/50'
                }`}
              >
                {/* 날짜 숫자 */}
                <span className={`text-[11px] font-bold ${
                  idx % 7 === 0 ? 'text-rose-500' : idx % 7 === 6 ? 'text-blue-500' : 'text-[#4A443F]'
                }`}>
                  {day}
                </span>

                {/* 일정 뱃지 이모지 */}
                {dateEvents.length > 0 && (
                  <div className="flex flex-col items-center mt-1">
                    <span className="text-[10px] animate-pulse">🌟</span>
                    <span className="text-[8px] font-bold text-[#92400E] tracking-tighter truncate w-full block leading-none">
                      {dateEvents[0].title.slice(0, 4)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 일정 상세 정보 팝업 모달 */}
      {selectedEventDetails && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-5 border border-[#E9E4DB] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#E9E4DB]/40 pb-2">
              <span className="text-[10px] font-bold text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-full">
                📅 꿈이음 일정 상세
              </span>
              <button
                onClick={() => setSelectedEventDetails(null)}
                className="text-[#928B81] hover:text-[#4A443F] text-xs font-bold"
              >
                닫기 ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#4A443F]">
              <div>
                <span className="block text-[10px] text-[#928B81] font-bold">일정 일자 / 기간</span>
                <span className="font-bold text-xs text-[#4A443F] flex items-center gap-1.5 mt-0.5">
                  <span>📅</span> {selectedEventDetails.date}
                  {selectedEventDetails.endDate && selectedEventDetails.endDate !== selectedEventDetails.date && (
                    <> ~ {selectedEventDetails.endDate}</>
                  )}
                </span>
              </div>

              {/* 시간 및 장소 표시 */}
              <div className="grid grid-cols-2 gap-2 bg-[#FEF9F2]/60 p-2.5 rounded-2xl border border-[#E9E4DB]/40">
                <div>
                  <span className="block text-[9px] text-[#928B81] font-bold">🕒 시간</span>
                  <span className="font-bold text-[11px] text-[#4A443F] mt-0.5 block">
                    {selectedEventDetails.isAllDay ? (
                      <span className="text-emerald-600">하루 종일 ☀️</span>
                    ) : (
                      selectedEventDetails.time || '지정 없음'
                    )}
                  </span>
                </div>

                <div>
                  <span className="block text-[9px] text-[#928B81] font-bold">📍 장소</span>
                  <span className="font-bold text-[11px] text-[#4A443F] mt-0.5 truncate block">
                    {selectedEventDetails.location || '원내 활동 🏠'}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-[#928B81] font-bold">일정 제목</span>
                <span className="font-serif font-bold text-sm text-[#D97706] mt-0.5 block">{selectedEventDetails.title}</span>
              </div>

              <div>
                <span className="block text-[10px] text-[#928B81] font-bold">상세 내용</span>
                <p className="bg-[#FEF9F2]/30 p-3 rounded-2xl border border-[#E9E4DB]/40 whitespace-pre-line leading-relaxed text-[#5D554D] mt-0.5">
                  {selectedEventDetails.content}
                </p>
              </div>

              {selectedEventDetails.materials && (
                <div>
                  <span className="block text-[10px] text-[#D97706] font-bold">🎒 준비물</span>
                  <span className="font-bold text-xs text-[#92400E] block mt-0.5">{selectedEventDetails.materials}</span>
                </div>
              )}

              {selectedEventDetails.extra && (
                <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E9E4DB] text-[10px] text-[#928B81] italic mt-0.5">
                  ※ {selectedEventDetails.extra}
                </div>
              )}
            </div>

             {/* 일정 제어 */}
            <div className="flex gap-2 pt-2 border-t border-[#E9E4DB]/40">
              <button
                onClick={() => setSelectedEventDetails(null)}
                className="flex-1 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white font-bold text-xs rounded-xl shadow-sm"
              >
                확인 완료 👍
              </button>
              {(currentUser.id === selectedEventDetails.writerId || currentUser.role === 'admin') && (
                <>
                  <button
                    onClick={() => {
                      setEditingEvent(selectedEventDetails);
                      setEditTitle(selectedEventDetails.title);
                      setEditContent(selectedEventDetails.content);
                      setEditSelectedDateStr(selectedEventDetails.date);
                      setEditUseRange(!!selectedEventDetails.endDate && selectedEventDetails.endDate !== selectedEventDetails.date);
                      setEditEndDateStr(selectedEventDetails.endDate || selectedEventDetails.date);
                      setEditIsAllDay(selectedEventDetails.isAllDay !== false);
                      
                      let startT = '09:00';
                      let endT = '10:00';
                      if (selectedEventDetails.startTime) {
                        startT = selectedEventDetails.startTime;
                      } else if (selectedEventDetails.time && selectedEventDetails.time.includes('~')) {
                        const parts = selectedEventDetails.time.split('~');
                        startT = parts[0].trim();
                        endT = parts[1].trim();
                      }
                      if (selectedEventDetails.endTime) {
                        endT = selectedEventDetails.endTime;
                      }
                      setEditStartTime(startT);
                      setEditEndTime(endT);

                      setEditTimeStr(selectedEventDetails.time || '');
                      setEditLocation(selectedEventDetails.location || '');
                      setEditMaterials(selectedEventDetails.materials || '');
                      setEditExtra(selectedEventDetails.extra || '');
                      setSelectedEventDetails(null);
                    }}
                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-100"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(selectedEventDetails.id, selectedEventDetails.writerId)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-100"
                  >
                    일정 삭제
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
