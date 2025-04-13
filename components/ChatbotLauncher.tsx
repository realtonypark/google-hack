"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import ChatbotWindow from "./ChatbotWindow"

export default function ChatbotLauncher() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-500 to-pink-500 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {isOpen && (
        <ChatbotWindow onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}