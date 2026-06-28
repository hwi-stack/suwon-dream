import { User } from '../types';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
}

export default function Navigation({ currentTab, setCurrentTab, currentUser }: NavigationProps) {
  // 하단 탭 목록: 홈, 알림장, 공지사항, 일정, 앨범
  const tabs = [
    { id: 'home', label: '홈', icon: '🏠' },
    { id: 'reports', label: '알림장', icon: '📝' },
    { id: 'notice', label: '공지사항', icon: '📢' },
    { id: 'calendar', label: '일정', icon: '📅' },
    { id: 'album', label: '앨범', icon: '📸' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-[#E9E4DB] shadow-[0_-4px_24px_rgba(74,68,63,0.06)] px-4 py-2 flex justify-around items-center z-50 rounded-t-3xl"
      id="bottom-navigation-bar"
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all relative group"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            id={`nav-tab-${tab.id}`}
          >
            {/* 활성화 배경 */}
            {isActive && (
              <span className="absolute inset-0 bg-[#FFEDD5] rounded-2xl scale-100 transition-all duration-300 -z-10" />
            )}

            <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-125 -translate-y-0.5' : 'group-hover:scale-110'}`}>
              {tab.icon}
            </span>
            <span className={`text-[10px] mt-1 font-bold tracking-tight ${isActive ? 'text-[#92400E] font-extrabold' : 'text-[#928B81]'}`}>
              {tab.label}
            </span>

            {/* 관리자 알림 닷 */}
            {tab.id === 'notice' && currentUser.role === 'admin' && (
              <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
