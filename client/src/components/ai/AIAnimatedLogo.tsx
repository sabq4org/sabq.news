import { motion } from "framer-motion";
import { Brain } from "lucide-react";

export default function AIAnimatedLogo() {
  return (
    <motion.div
      className="relative w-24 h-24"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
    >
      {/* Outer Ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-blue-500/20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Middle Ring */}
      <motion.div
        className="absolute inset-2 rounded-full border-2 border-purple-500/30"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 3,
          delay: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner Circle with Brain Icon */}
      <motion.div
        className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.div
          animate={{
            rotate: [0, -360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Brain className="w-8 h-8 text-white" />
        </motion.div>
      </motion.div>

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400 rounded-full"
          style={{
            left: "50%",
            top: "50%",
          }}
          animate={{
            x: [0, Math.cos((i * 60) * Math.PI / 180) * 40, 0],
            y: [0, Math.sin((i * 60) * Math.PI / 180) * 40, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Pulse Effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20"
        animate={{
          scale: [1, 1.5, 1.5],
          opacity: [0.5, 0, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
    </motion.div>
  );
}