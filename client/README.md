# Flashcards App

A simple flashcard app built with React and Vite. Supports spaced repetition and folder organization for study cards.

## Features
- Create folders and flashcards
- Study cards with spaced repetition
- Track daily review stats

## Planned Features (most are tentative)
- Spaced Repetition – Optimizes review timing to boost long-term memory
- Offline-First – Study anytime, anywhere using Service Workers and IndexedDB
- Rich Flashcards – Markdown support, image embedding, color tags
- Smart Syncing – Changes sync to the backend when the user reconnects
- User Analytics – Tracks retention, study time, and progress
- Push Notifications – Study reminders via Firebase Cloud Messaging
- Authentication – Login with Firebase Auth (Google, Email/Password)
- PWA Installable – Can be installed on mobile/desktop like a native app

## Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- IndexedDB for local data
- Service Workers (for offline support)
- Cloudflare CDN (static hosting)

### Backend
- Node.js + Express (TypeScript)
- REST APIs for flashcards, users, sync
- MongoDB (Atlas or EC2-hosted)

## Getting Started
1. Install dependencies:
   `pnpm install`
2. Start the development server:
   `pnpm dev`

## Folder Structure
- `src/` - React source code
- `public/` - Static assets

## License
MIT

