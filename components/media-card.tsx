"use client";

import Image from "next/image";
import { useState } from "react";
import { PlusCircle, CheckCircle, Film, BookOpen, Tv, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addToLibrary } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface MediaCardProps {
  media: {
    id: string;
    title: string;
    type: "movie" | "book" | "series";
    coverImage: string;
    year: string;
    genres: string[];
    recommendedBy?: string;
    trending?: boolean;
    trendingRank?: number;
  };
}

export default function MediaCard({ media }: MediaCardProps) {
  const router = useRouter();

  const getMediaIcon = () => {
    switch (media.type) {
      case "movie":
        return <Film className="h-4 w-4" />;
      case "book":
        return <BookOpen className="h-4 w-4" />;
      case "series":
        return <Tv className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card
      className="w-[250px] overflow-hidden cursor-pointer border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] 
               hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.25)] hover:translate-y-[-3px)]
               transition-all duration-300 rounded-xl"
      onClick={() => router.push(`/media/${media.id}`)}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden group">
        <Image
          src={media.coverImage || "/placeholder.svg"}
          alt={media.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        
        {/* Cinematic overlay - subtle gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {media.trending && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold
                        bg-gradient-to-r from-purple-500 to-pink-500 text-white
                        border border-white/20 shadow-lg
                        flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            #{media.trendingRank}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {getMediaIcon()}
            <span className="capitalize">{media.type}</span>
            <span className="mx-1">•</span>
            <span>{media.year}</span>
          </div>
          
          <h3 className="font-semibold leading-tight text-foreground/90 line-clamp-2 tracking-tight">
            {media.title}
          </h3>
          
          <div className="flex flex-wrap gap-1 pt-1">
            {Array.isArray(media.genres) &&
              media.genres.slice(0, 2).map((genre) => (
                <Badge 
                  key={genre} 
                  variant="outline" 
                  className="text-xs font-medium border-border/50 bg-background/80 
                            backdrop-blur-sm px-2 py-0.5"
                >
                  {genre}
                </Badge>
              ))}
          </div>
          
          {media.recommendedBy && (
            <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
              Recommended by {media.recommendedBy}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}