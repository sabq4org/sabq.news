import { motion } from "framer-motion";

interface TypingIndicatorProps {
  typingUsers: Array<{ id: string; name: string }>;
}

function TypingDots() {
  return (
    <div className="flex gap-1" data-testid="typing-dots">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
          animate={{
            y: [0, -4, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function getTypingText(users: Array<{ id: string; name: string }>): string {
  if (users.length === 0) return '';
  if (users.length === 1) return `${users[0].name} يكتب...`;
  if (users.length === 2) return `${users[0].name} و${users[1].name} يكتبان...`;
  return `${users.length.toLocaleString('en-US')} أشخاص يكتبون...`;
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground"
      data-testid="typing-indicator"
      dir="rtl"
    >
      <TypingDots />
      <span data-testid="typing-text">{getTypingText(typingUsers)}</span>
    </motion.div>
  );
}
