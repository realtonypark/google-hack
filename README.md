# Media Match - Google DevFest WashU Hackathon Project

A web application that helps users log and discover their next favorite book, movie, or TV series using AI-powered recommendations. Built with Next.js and leveraging Google's Gemini AI, Google Books API, and TMDB API for a comprehensive media discovery experience.

## Features

- 🤖 AI-powered recommendations using Google's Gemini
- 🎬 Personalized content discovery
- 🔐 Secure authentication with Firebase
- 📱 Modern UI with responsive design
- 🔄 Real-time data handling
- 🎯 Type-safe development with TypeScript


## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Google account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/realtonypark/google-hack.git
cd google-hack
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key

# Google Books API Key
NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY=your_api_key

# TMDB API Key
NEXT_PUBLIC_TMDB_API_KEY=your_api_key

# Other environment variables
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Tech Stack

- **Frontend Framework**: Next.js 15
- **UI Components**: Radix UI
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **State Management**: React Context
- **AI Integration**: Google Gemini API
- **Media APIs**: 
  - Google Books API for book data
  - TMDB API for movie and TV series data


## License

This project is licensed under the MIT License - see the LICENSE file for details. 
