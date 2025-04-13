"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function Rating({ value, onChange, className }: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState<number | null>(null)

  const handleMouseEnter = (index: number, position: number) => {
    setHoverValue(index)
    setHoverPosition(position)
  }

  const handleMouseLeave = () => {
    setHoverValue(null)
    setHoverPosition(null)
  }

  const handleClick = (index: number, position: number) => {
    const rating = position < 0.5 ? index + 0.5 : index + 1
    onChange(rating)
  }

  const displayValue = hoverValue ?? value

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {[0, 1, 2, 3, 4].map((index) => (
        <button
          key={index}
          type="button"
          className="relative"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const position = (e.clientX - rect.left) / rect.width
            handleMouseEnter(index, position)
          }}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const position = (e.clientX - rect.left) / rect.width
            handleClick(index, position)
          }}
        >
          {/* Background star (always gray) */}
          <Star
            className="h-10 w-10 text-muted-foreground"
          />
          
          {/* Full star overlay */}
          <div className="absolute inset-0">
            <Star
              className={cn(
                "h-10 w-10 transition-transform",
                index < Math.floor(displayValue) ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-transparent"
              )}
            />
          </div>

          {/* Half star overlay */}
          <div className="absolute inset-0 overflow-hidden" style={{ 
            clipPath: 'inset(0 50% 0 0)',
            display: (
              (hoverValue === index && hoverPosition !== null && hoverPosition < 0.5) ||
              (index === Math.floor(displayValue) && displayValue % 1 !== 0)
            ) ? 'block' : 'none'
          }}>
            <Star
              className="h-10 w-10 fill-yellow-400 text-yellow-400"
            />
          </div>
        </button>
      ))}
    </div>
  )
} 