import { 
  User, 
  DailyReport, 
  Notice, 
  CalendarEvent, 
  Album, 
  Comment, 
  MedicationRequest 
} from '../types';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// 초기 더미 사용자 목록
const INITIAL_USERS: User[] = [
  {
    id: '관리자',
    name: '관리자',
    role: 'admin',
    initialPassword: '0926',
    currentPassword: '0926',
    isPasswordChanged: false,
    createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: '박지현',
    name: '박지현',
    role: 'staff',
    initialPassword: '1234',
    currentPassword: '1234',
    isPasswordChanged: false,
    createdAt: '2026-06-02T00:00:00Z',
  },
  {
    id: '최준우',
    name: '최준우',
    role: 'staff',
    initialPassword: '1234',
    currentPassword: '1234',
    isPasswordChanged: false,
    createdAt: '2026-06-02T00:00:00Z',
  },
  {
    id: '김하은',
    name: '김하은',
    role: 'parent',
    initialPassword: '1234',
    currentPassword: '1234',
    isPasswordChanged: false,
    createdAt: '2026-06-03T00:00:00Z',
    patientName: '이지우',
  },
  {
    id: '박성철',
    name: '박성철',
    role: 'parent',
    initialPassword: '1234',
    currentPassword: '1234',
    isPasswordChanged: false,
    createdAt: '2026-06-03T00:00:00Z',
    patientName: '박민우',
  },
];

// 초기 알림장 목록
const INITIAL_DAILY_REPORTS: DailyReport[] = [
  {
    id: 'report-1',
    title: '🌸 오늘 오감 발달 놀이 수업 즐겁게 참여했습니다.',
    content: '오늘 지우가 오감 발달 허브 가든 프로그램에서 로즈마리 향을 맡으며 아주 밝게 웃었습니다. 색모래 촉감 놀이 중에도 모래를 만지작거리며 정서적으로 매우 안정된 모습을 보였어요. 점심 식사로 나온 잡채밥도 평소보다 훨씬 맛있게 한 그릇 뚝딱 비웠답니다. 오후 산책 시에는 가볍게 복도를 거닐며 가벼운 체조를 하였습니다.',
    writerId: '박지현',
    writerName: '박지현',
    writerRole: 'staff',
    receiverId: '김하은',
    receiverName: '김하은 (이지우 보호자)',
    mood: '😆 매우 밝음',
    images: [],
    likes: ['김하은'],
    createdAt: '2026-06-25T17:00:00-07:00',
  },
  {
    id: 'report-2',
    title: '🌿 오늘 복지관 체육 활동 진행 상황입니다.',
    content: '민우가 오늘 오후 체육 시간에 공 던지기 놀이에 집중해서 참여하였습니다. 최근에 조금 피로해하는 경향이 있었는데, 다행히 오늘은 차분하면서도 즐겁게 수업에 임했어요. 다만 오전 간식 시간 직후 약간 꾸벅꾸벅 조는 모습이 있어 충분히 쉴 수 있도록 편안하게 소파에서 휴식 시간을 가졌습니다.',
    writerId: '최준우',
    writerName: '최준우',
    writerRole: 'staff',
    receiverId: '박성철',
    receiverName: '박성철 (박민우 보호자)',
    mood: '🙂 평온함',
    images: [],
    likes: [],
    createdAt: '2026-06-26T17:30:00-07:00',
  },
  {
    id: 'report-parent-1',
    title: '🙋 지우 주말 지낸 이야기 전달드립니다.',
    content: '선생님 안녕하세요! 지우가 주말 동안 감기 기운이 조금 생겨서 약을 처방받아 먹였습니다. 다행히 열은 내렸지만 기침을 간간이 하네요. 오늘 복지관에서 혹시 기침이 심해지면 가지고 보낸 시럽 약을 따뜻한 물과 함께 복용할 수 있도록 부탁드립니다. 항상 신경 써주셔서 감사합니다. 💕',
    writerId: '김하은',
    writerName: '김하은 (이지우 보호자)',
    writerRole: 'parent',
    receiverId: '박지현',
    receiverName: '박지현',
    images: [],
    likes: ['박지현'],
    createdAt: '2026-06-27T08:30:00-07:00',
  },
];

// 초기 공지사항 목록
const INITIAL_NOTICES: Notice[] = [
  {
    id: 'notice-1',
    title: '📢 7월 꿈이음 가족 간담회 개최 및 참석 안내',
    content: '안녕하세요, 수원시장애인종합복지관 주간이용시설 꿈이음입니다. 보호자님들의 소중한 의견을 수렴하고 하반기 시설 운영 계획을 논의하고자 7월 가족 간담회를 아래와 같이 개최하오니 많은 참석 부탁드립니다.\n\n일시: 2026년 7월 10일 (금) 오후 2시\n장소: 복지관 3층 다목적실\n대상: 꿈이음 이용자 가족 전체\n내용: 상반기 활동 보고 및 하반기 주요 일정 안내, 자유 건의 시간\n\n파스텔 톤의 다과와 차를 준비할 예정이오니, 편안한 마음으로 발걸음 해주세요. ☕',
    extra: '※ 주차가 협소하오니 대중교통 이용을 권장해 드립니다.',
    writerId: '박지현',
    writerName: '박지현',
    readBy: ['박지현', '김하은'],
    createdAt: '2026-06-24T10:00:00-07:00',
  },
  {
    id: 'notice-2',
    title: '📢 하계 무더위 대비 냉방 및 건강 관리 안내',
    content: '연일 기온이 높아지고 있습니다. 복지관에서는 이용자분들의 쾌적한 하루를 위해 실내 온도를 항시 24~26도로 세심히 조절하고 있습니다. 또한 수분 섭취를 돕기 위해 보리차를 주기적으로 제공하고 있으니 가정에서도 얇고 바람이 잘 통하는 여벌옷을 가방에 챙겨 보내주시면 환복 등에 큰 도움이 되겠습니다. 늘 건강하고 시원한 하루가 되도록 노력하겠습니다. 🌻',
    writerId: '관리자',
    writerName: '관리자',
    readBy: ['박지현', '최준우', '김하은', '박성철'],
    createdAt: '2026-06-26T11:00:00-07:00',
  },
];

// 초기 일정 목록
const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'event-1',
    title: '🎨 아로마 석고 방향제 만들기',
    content: '전문 강사님을 초빙하여 은은한 허브 아로마 오일을 사용해 나만의 예쁜 석고 방향제를 만들어 보는 시간을 가집니다.',
    date: '2026-06-15',
    materials: '활동하기 편한 앞치마',
    extra: '복지관에서 재료비 전액을 지원합니다.',
    writerId: '박지현',
    writerName: '박지현',
    createdAt: '2026-06-10T14:00:00-07:00',
  },
  {
    id: 'event-2',
    title: '🎬 영화 관람 및 휴식 활동',
    content: '복지관 시청각실에서 편안하고 조용한 분위기 속에 힐링 배리어프리 영화를 상영합니다.',
    date: '2026-06-20',
    materials: '개인 물컵',
    writerId: '최준우',
    writerName: '최준우',
    createdAt: '2026-06-18T09:00:00-07:00',
  },
  {
    id: 'event-3',
    title: '🌳 광교 역사공원 인근 숲속 산책 활동',
    content: '초록빛 싱그러운 대자연 속에서 가볍게 숲길을 걸으며 오감 피톤치드를 온몸으로 만끽하는 야외 신체 힐링 활동입니다.',
    date: '2026-06-29',
    materials: '편안한 운동화, 모자, 개인 물병',
    extra: '비가 올 시 복지관 실내 체육 프로그램으로 대체됩니다.',
    writerId: '박지현',
    writerName: '박지현',
    createdAt: '2026-06-25T11:00:00-07:00',
  },
  {
    id: 'event-4',
    title: '🎂 6월 꿈이음 생일 잔치 🎉',
    content: '꿈이음의 6월 생일자분들을 위해 다 함께 맛있는 케이크를 나누고 축하 노래를 부르는 소중한 시간입니다.',
    date: '2026-06-30',
    materials: '행복하고 따뜻한 미소 😊',
    writerId: '박지현',
    writerName: '박지현',
    createdAt: '2026-06-25T12:00:00-07:00',
  }
];

// 초기 사진첩 목록
const INITIAL_ALBUMS: Album[] = [
  {
    id: 'album-1',
    title: '📸 봄날 텃밭 상추 모종 심기 체험',
    date: '2026-06-12',
    images: [],
    writerId: '박지현',
    writerName: '박지현',
    createdAt: '2026-06-12T16:00:00-07:00',
  },
  {
    id: 'album-2',
    title: '📸 재미있는 요리 교실 (파스텔 샌드위치 만들기)',
    date: '2026-06-19',
    images: [],
    writerId: '최준우',
    writerName: '최준우',
    createdAt: '2026-06-19T15:30:00-07:00',
  }
];

// 초기 댓글 목록
const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    refId: 'report-1',
    writerId: '김하은',
    writerName: '김하은 (이지우 보호자)',
    writerRole: 'parent',
    content: '우리 지우가 모래 촉감놀이를 엄청나게 좋아하는데, 선생님 덕분에 재미있게 보낸 것 같아 안심이에요. 잡채밥도 평소 집에서는 야채를 안 먹어서 걱정했는데 복지관에서는 뚝딱 비웠다니 너무 감사하네요! 🥰',
    createdAt: '2026-06-25T18:30:00-07:00',
  },
  {
    id: 'comm-2',
    refId: 'report-1',
    writerId: '박지현',
    writerName: '박지현',
    writerRole: 'staff',
    content: '맞아요, 어머니! 친구들과 양보하며 노는 모습이 정말 천사 같았답니다. 지우의 주중 건강 상태도 주시하고 있으니 안심하셔요!',
    createdAt: '2026-06-25T19:00:00-07:00',
  },
];

// 초기 투약 의뢰서 목록
const INITIAL_MEDICATIONS: MedicationRequest[] = [
  {
    id: 'med-1',
    parentId: '김하은',
    parentName: '김하은 (이지우 보호자)',
    patientName: '이지우',
    symptom: '감기 기운으로 기침과 약간의 콧물이 동반됨',
    pillType: '가루약 1포, 시럽 5ml',
    pillTime: '점심 식사 직후 (오후 1시경)',
    dosage: '1회분 제공',
    storageMethod: '시럽은 실온 보관, 가루약은 서늘한 곳',
    extra: '약간 졸릴 수 있으니 식후 복용 뒤 낮잠을 자도 괜찮습니다.',
    isConfirmed: true,
    confirmedBy: '박지현',
    createdAt: '2026-06-27T08:35:00-07:00',
  }
];

// LocalStorage 키 정의
const KEYS = {
  USERS: 'ggum_users',
  DAILY_REPORTS: 'ggum_daily_reports',
  NOTICES: 'ggum_notices',
  EVENTS: 'ggum_events',
  ALBUMS: 'ggum_albums',
  COMMENTS: 'ggum_comments',
  MEDICATIONS: 'ggum_medications',
};

// 헬퍼: LocalStorage 불러오기
function getStored<T>(key: string, initialData: T[]): T[] {
  const data = localStorage.getItem(key);
  if (!data) {
    // 최초 구동 시 실시간 데이터가 도착하기 전 가상 더미 데이터가 로컬 스토리지에 미리 설정되어
    // 역으로 Firestore에 동기화되는 레이스 컨디션(동기화 꼬임) 방지를 위해 빈 배열을 반환합니다.
    return [];
  }
  return JSON.parse(data);
}

// 실시간 구독 목록 저장소
const subscribers: { [key: string]: ((data: any) => void)[] } = {};

// Firestore 일괄 비교 업데이트/삭제 동기화 엔진 (writeBatch 원자적 트랜잭션 적용)
async function syncToFirestore<T extends { id: string }>(collName: string, newList: T[]) {
  const localKey = `ggum_${collName}`;
  const oldListStr = localStorage.getItem(localKey);
  const oldList: T[] = oldListStr ? JSON.parse(oldListStr) : [];

  // 즉각적인 피드백을 위해 로컬스토리지 우선 업데이트
  localStorage.setItem(localKey, JSON.stringify(newList));
  notifySubscribers(collName, newList);

  try {
    const batch = writeBatch(db);
    let hasChanges = false;

    // 추가/수정된 항목 감지 및 배치 등록
    for (const item of newList) {
      const oldItem = oldList.find(o => o.id === item.id);
      if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
        const docRef = doc(db, collName, item.id);
        batch.set(docRef, item);
        hasChanges = true;
      }
    }

    // 삭제된 항목 감지 및 배치 삭제 등록
    const newIds = new Set(newList.map(item => item.id));
    for (const oldItem of oldList) {
      if (!newIds.has(oldItem.id)) {
        const docRef = doc(db, collName, oldItem.id);
        batch.delete(docRef);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await batch.commit();
    }
  } catch (err) {
    console.error(`Error in atomic sync to Firestore for ${collName}:`, err);
  }
}

// 구독자에게 데이터 알림 발송
function notifySubscribers(key: string, data: any) {
  if (subscribers[key]) {
    subscribers[key].forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error('Error notifying subscriber:', e);
      }
    });
  }
}

// 실시간 동기화 리스너 작동 (앱 초기 구동 시점부터 즉각 Firestore와 동기화)
function initRealtimeSync() {
  const collectionsToSync = [
    { key: 'users', collName: 'users', initial: INITIAL_USERS },
    { key: 'daily_reports', collName: 'daily_reports', initial: INITIAL_DAILY_REPORTS },
    { key: 'notices', collName: 'notices', initial: INITIAL_NOTICES },
    { key: 'events', collName: 'events', initial: INITIAL_EVENTS },
    { key: 'albums', collName: 'albums', initial: INITIAL_ALBUMS },
    { key: 'comments', collName: 'comments', initial: INITIAL_COMMENTS },
    { key: 'medications', collName: 'medications', initial: INITIAL_MEDICATIONS }
  ];

  collectionsToSync.forEach(({ key, collName, initial }) => {
    onSnapshot(collection(db, collName), (snapshot) => {
      if (snapshot.empty) {
        // 데이터가 비었을 때 더미 데이터를 강제로 재생성하는 Seeding 기능을 완전히 제거합니다.
        // 이용자가 직접 만든 계정이나 작성 글을 전부 삭제하더라도 가상의 옛 데이터가 다시 생기지 않도록 차단합니다.
        // 단, users 컬렉션이 완전히 빈 상태라면 관리자 한 명만은 진입을 위해 최소한 자동 생성해 줍니다.
        if (key === 'users') {
          const adminUser: User = {
            id: '관리자',
            name: '관리자',
            role: 'admin',
            initialPassword: '0926',
            currentPassword: '0926',
            isPasswordChanged: false,
            createdAt: '2026-06-01T00:00:00Z',
          };
          setDoc(doc(db, 'users', '관리자'), adminUser).catch(e => console.error(e));
        }
      } else {
        let data: any[] = [];
        snapshot.forEach((doc) => {
          data.push(doc.data());
        });

        // "이예진" 유저 정보가 존재할 시, 실시간으로 "관리자"로 마이그레이션 처리하여 호환 유지
        if (key === 'users') {
          const hasYejin = data.some(u => u.id === '이예진');
          const hasAdmin = data.some(u => u.id === '관리자');
          if (hasYejin) {
            deleteDoc(doc(db, 'users', '이예진')).catch(e => console.error(e));
            if (!hasAdmin) {
              const yejinUser = data.find(u => u.id === '이예진');
              const adminUser = {
                id: '관리자',
                name: '관리자',
                role: 'admin',
                initialPassword: yejinUser?.initialPassword || '0926',
                currentPassword: yejinUser?.currentPassword || '0926',
                isPasswordChanged: yejinUser?.isPasswordChanged || false,
                createdAt: yejinUser?.createdAt || '2026-06-01T00:00:00Z',
              };
              setDoc(doc(db, 'users', '관리자'), adminUser).catch(e => console.error(e));
            }
            data = data.filter(u => u.id !== '이예진');
            if (!hasAdmin) {
              data.push({
                id: '관리자',
                name: '관리자',
                role: 'admin',
                initialPassword: '0926',
                currentPassword: '0926',
                isPasswordChanged: false,
                createdAt: '2026-06-01T00:00:00Z',
              });
            }
          }
        }

        // 각 컬렉션 내의 작성자/ID 매핑 일관성 필터링
        data = data.map(item => {
          if (item.writerId === '이예진') {
            item.writerId = '관리자';
            item.writerName = '관리자';
          }
          if (item.id === '이예진') {
            item.id = '관리자';
            item.name = '관리자';
          }
          return item;
        });
        
        // 데이터 정렬 규칙 적용
        if (key === 'daily_reports' || key === 'notices' || key === 'comments' || key === 'medications') {
          data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        } else if (key === 'events') {
          data.sort((a, b) => a.date.localeCompare(b.date));
        } else if (key === 'albums') {
          data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
        
        // 최신본 로컬 캐싱 및 컴포넌트 알림
        localStorage.setItem(`ggum_${key}`, JSON.stringify(data));
        notifySubscribers(key, data);
      }
    }, (error) => {
      console.error(`Error in realtime sync for ${collName}:`, error);
    });
  });
}

// 리스너 가동
initRealtimeSync();

// 데이터 입출력 인터페이스 객체
export const storage = {
  getUsers: (): User[] => getStored<User>(KEYS.USERS, INITIAL_USERS),
  saveUsers: (users: User[]): void => {
    syncToFirestore<User>('users', users);
  },

  getDailyReports: (): DailyReport[] => getStored<DailyReport>(KEYS.DAILY_REPORTS, INITIAL_DAILY_REPORTS),
  saveDailyReports: (reports: DailyReport[]): void => {
    syncToFirestore<DailyReport>('daily_reports', reports);
  },

  getNotices: (): Notice[] => getStored<Notice>(KEYS.NOTICES, INITIAL_NOTICES),
  saveNotices: (notices: Notice[]): void => {
    syncToFirestore<Notice>('notices', notices);
  },

  getEvents: (): CalendarEvent[] => getStored<CalendarEvent>(KEYS.EVENTS, INITIAL_EVENTS),
  saveEvents: (events: CalendarEvent[]): void => {
    syncToFirestore<CalendarEvent>('events', events);
  },

  getAlbums: (): Album[] => getStored<Album>(KEYS.ALBUMS, INITIAL_ALBUMS),
  saveAlbums: (albums: Album[]): void => {
    syncToFirestore<Album>('albums', albums);
  },

  getComments: (): Comment[] => getStored<Comment>(KEYS.COMMENTS, INITIAL_COMMENTS),
  saveComments: (comments: Comment[]): void => {
    syncToFirestore<Comment>('comments', comments);
  },

  getMedications: (): MedicationRequest[] => getStored<MedicationRequest>(KEYS.MEDICATIONS, INITIAL_MEDICATIONS),
  saveMedications: (medications: MedicationRequest[]): void => {
    syncToFirestore<MedicationRequest>('medications', medications);
  },

  // 컴포넌트 단위에서 데이터 변경을 실시간 리스닝하기 위한 구독 API 추가
  subscribe: <T>(key: string, callback: (data: T[]) => void) => {
    if (!subscribers[key]) {
      subscribers[key] = [];
    }
    subscribers[key].push(callback);
    return () => {
      subscribers[key] = subscribers[key].filter(cb => cb !== callback);
    };
  },

  // 초기화 함수 (테스트용)
  resetAll: async (): Promise<void> => {
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.DAILY_REPORTS);
    localStorage.removeItem(KEYS.NOTICES);
    localStorage.removeItem(KEYS.EVENTS);
    localStorage.removeItem(KEYS.ALBUMS);
    localStorage.removeItem(KEYS.COMMENTS);
    localStorage.removeItem(KEYS.MEDICATIONS);
    
    // Firestore 컬렉션 일괄 비우기 등은 필요에 따라 처리 가능하나, 
    // 여기서는 기본 클라이언트 캐시 삭제 및 새로고침만 실행
    window.location.reload();
  }
};
