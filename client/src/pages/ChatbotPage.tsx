import { useEffect } from "react";
import { AIChatbot } from "@/components/AIChatbot";

export default function ChatbotPage() {
  useEffect(() => {
    document.title = "المساعد الذكي - سبق الذكية";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 h-screen flex flex-col">
        <div className="flex-1 max-w-6xl mx-auto w-full">
          <AIChatbot />
        </div>
      </div>
    </div>
  );
}
