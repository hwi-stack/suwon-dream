export type UserRole = 'admin' | 'staff' | 'parent';

export interface User {
  id: string; // 로그인 아이디 (사용자명)
  name: string; // 실명
  role: UserRole;
  initialPassword: string;
  currentPassword: string;
  isPasswordChanged: boolean;
  createdAt: string;
  patientName?: string; // 보호자 전용: 아동/장애인 성함
}

export type MoodType = '😆 매우 밝음' | '🙂 평온함' | '😴 조금 졸림/지침' | '😟 불편함/예민함' | '🤒 아픔(통증/컨디션 난조)';

export interface DailyReport {
  id: string;
  title: string;
  content: string;
  writerId: string;
  writerName: string;
  writerRole: UserRole;
  receiverId: string; // 수신자 ID ('all' 또는 특정 사용자 ID)
  receiverName: string; // 수신자 이름
  mood?: MoodType; // 직원(staff) 작성 시에만 활성화
  images: string[]; // Base64로 인코딩되어 압축된 다중 이미지 데이터
  likes: string[]; // 좋아요를 누른 사용자 ID 목록
  reactions?: { [emoji: string]: string[] }; // 원클릭 이모지 공감 피드백
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  extra?: string; // 기타사항 (선택)
  writerId: string;
  writerName: string;
  readBy: string[]; // 읽음 확인한 사용자 ID 목록
  reactions?: { [emoji: string]: string[] }; // 원클릭 이모지 공감 피드백
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  content: string;
  date: string; // 시작 날짜 YYYY-MM-DD
  endDate?: string; // 종료 날짜 YYYY-MM-DD (기간 선택 시, 선택적)
  isAllDay?: boolean; // 종일 일정 여부
  time?: string; // 시간 선택 (예: "10:00" 또는 "14:00 ~ 16:00")
  location?: string; // 장소 입력 (선택사항)
  materials?: string; // 준비물 (선택)
  extra?: string; // 기타 (선택)
  writerId: string;
  writerName: string;
  createdAt: string;
}

export interface Album {
  id: string;
  title: string;
  date: string; // 행사 날짜 YYYY-MM-DD
  images: string[]; // Base64 압축 이미지 목록
  writerId: string;
  writerName: string;
  reactions?: { [emoji: string]: string[] }; // 원클릭 이모지 공감 피드백
  createdAt: string;
}

export interface Comment {
  id: string;
  refId: string; // daily_report ID
  writerId: string;
  writerName: string;
  writerRole: UserRole;
  content: string;
  createdAt: string;
}

export interface MedicationRequest {
  id: string;
  parentId: string;
  parentName: string;
  patientName: string;
  symptom: string; // 증상
  pillType: string; // 약의 종류 (가루약, 물약, 알약 등)
  pillTime: string; // 복용 시간 (점심 식사 후 등)
  dosage: string; // 1회 복용량
  storageMethod: string; // 보관 방법 (실온, 냉장 등)
  extra?: string; // 전달 사항
  isConfirmed: boolean; // 직원 확인 여부
  confirmedBy?: string; // 확인한 직원 성함
  createdAt: string;
}
