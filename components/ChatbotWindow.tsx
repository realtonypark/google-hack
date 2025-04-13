"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/authContext"
import { getUserMediaEntries } from "@/lib/firebase/firestore"

export default function ChatbotWindow({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "bot", text: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const [mediaLog, setMediaLog] = useState<any[]>([])
  useEffect(() => {
    const fetchMediaLog = async () => {
      if (!user?.uid) return
      const entries = await getUserMediaEntries(user.uid)
      setMediaLog(entries)
    }
  
    fetchMediaLog()
  }, [user?.uid])

  const sendMessage = async () => {
    if (!input.trim() || !user?.uid) return

    const userMessage = input.trim()
    setMessages((prev) => [...prev, { role: "user", text: userMessage }])
    setInput("")
    setIsLoading(true)

    try {
        const res = await fetch("/api/chatbot", {
        method: "POST",
        body: JSON.stringify({
            message: userMessage,
            userId: user.uid,
            mediaLog, // ✅ cached log
        }),
        headers: {
            "Content-Type": "application/json",
        },
        })

      const data = await res.json()
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }])
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", text: "Something went wrong." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-20 right-6 w-96 max-w-full bg-white border border-border shadow-xl rounded-lg z-50 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted">
        <h4 className="text-sm font-semibold">🎬 Media Chatbot</h4>
        <button onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px]">
        {messages.map((msg, i) => (
          <div key={i} className={`text-sm whitespace-pre-wrap ${msg.role === "user" ? "text-right" : "text-left text-muted-foreground"}`}>
            <span className="block bg-muted p-2 rounded-md inline-block max-w-[85%]">
              {msg.text}
            </span>
          </div>
        ))}
        {isLoading && <div className="text-sm text-muted-foreground italic">Typing...</div>}
      </div>
      <div className="p-3 border-t flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder="Ask for recommendations or chat about media..."
          className="flex-1"
        />
        <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  )
}