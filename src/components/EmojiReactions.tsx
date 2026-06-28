import React from 'react';

interface EmojiReactionsProps {
  reactions?: { [emoji: string]: string[] };
  currentUserId: string;
  onReact: (emoji: string) => void;
}

export default function EmojiReactions({ reactions = {}, currentUserId, onReact }: EmojiReactionsProps) {
  // 꿈이음에 어울리는 따뜻하고 긍정적인 이모지 목록
  const EMOJI_LIST = [
    { emoji: '❤️', label: '사랑해요' },
    { emoji: '👍', label: '최고예요' },
    { emoji: '👏', label: '응원해요' },
    { emoji: '🌸', label: '화이팅' },
    { emoji: '💡', label: '유익해요' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E9E4DB]/40" id="emoji-reactions-container">
      {EMOJI_LIST.map(({ emoji, label }) => {
        const users = reactions[emoji] || [];
        const hasReacted = users.includes(currentUserId);
        const count = users.length;

        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all transform active:scale-95 border ${
              hasReacted
                ? 'bg-[#FFEDD5] text-[#92400E] border-[#FDE68A] shadow-xs'
                : 'bg-white text-[#5D554D] border-[#E9E4DB] hover:bg-[#FEF9F2]/50'
            }`}
            id={`btn-emoji-reaction-${emoji}-${currentUserId}`}
          >
            <span className={`text-sm transition-transform ${hasReacted ? 'scale-110 animate-bounce' : ''}`}>
              {emoji}
            </span>
            {count > 0 && (
              <span className={`font-mono text-xs ${hasReacted ? 'text-[#92400E]' : 'text-[#928B81]'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
