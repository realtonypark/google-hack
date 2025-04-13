import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // For now, return mock data with half-star increments
    const mockDistribution = {
      "0.5": 10,
      "1.0": 15,
      "1.5": 20,
      "2.0": 25,
      "2.5": 35,
      "3.0": 45,
      "3.5": 60,
      "4.0": 80,
      "4.5": 50,
      "5.0": 40
    };

    return NextResponse.json({
      distribution: mockDistribution,
      totalRatings: Object.values(mockDistribution).reduce((a, b) => a + b, 0)
    });

    // TODO: Implement real data fetching
    // const ratingsRef = collection(db, 'ratings');
    // const ratingsQuery = query(ratingsRef, where('mediaId', '==', id));
    // const ratingsSnapshot = await getDocs(ratingsQuery);
    
    // const distribution: Record<string, number> = {};
    // ratingsSnapshot.forEach((doc) => {
    //   const rating = doc.data().rating.toFixed(1);
    //   distribution[rating] = (distribution[rating] || 0) + 1;
    // });

    // return NextResponse.json({
    //   distribution,
    //   totalRatings: ratingsSnapshot.size
    // });
  } catch (error) {
    console.error('Error fetching rating distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating distribution' },
      { status: 500 }
    );
  }
} 