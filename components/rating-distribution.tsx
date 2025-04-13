"use client"

import { Star } from "lucide-react"

interface RatingDistributionProps {
  distribution: Record<string, number>
  totalRatings: number
}

export function RatingDistribution({ distribution, totalRatings }: RatingDistributionProps) {
  // Create an array of ratings from 5 down to 0.5
  const allRatings = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5]
  
  // Find the max count for scaling
  const maxCount = Math.max(...Object.values(distribution))

  return (
    <div className="space-y-1.5">
      {allRatings.map((rating) => {
        const ratingKey = rating.toFixed(1)
        const count = distribution[ratingKey] || 0
        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0

        return (
          <div key={rating} className="flex items-center gap-2 text-sm">
            <div className="w-12 text-right flex items-center justify-end gap-1">
              <span>{rating}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 h-4 relative">
              <div className="absolute inset-y-0 left-0 bg-pink-100 rounded-sm w-full" />
              <div 
                className="absolute inset-y-0 left-0 bg-pink-500 rounded-sm transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <div className="w-16 text-muted-foreground">
              {count > 0 ? `${Math.round(percentage)}%` : '--'}
            </div>
          </div>
        )
      })}
      <div className="text-sm text-muted-foreground pt-1">
        Based on {totalRatings} ratings
      </div>
    </div>
  )
} 