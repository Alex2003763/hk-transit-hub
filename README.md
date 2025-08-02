# HK Transit Hub - Smart Journey Planner

A Progressive Web App (PWA) for Hong Kong's public transport system, featuring real-time ETAs, route planning, and AI-powered trip suggestions for KMB buses and MTR.

## Features

- 🚌 **KMB Bus Routes**: Browse routes, view stops, and get real-time ETAs
- 🚇 **MTR Integration**: Access MTR station information and lines
- 🤖 **AI Trip Planner**: Get intelligent multi-modal journey suggestions
- 📱 **Progressive Web App**: Install on your device for offline access
- 🔄 **Auto-Updates**: Automatic service worker updates for the latest features
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📍 **Interactive Maps**: View routes and stops on an interactive map

## PWA Features

This app is a fully-featured Progressive Web App with:

- **Offline Functionality**: Core features work without internet connection
- **Auto-Update Service Worker**: Automatically detects and prompts for app updates
- **Install Prompt**: Can be installed on mobile devices and desktops
- **Background Sync**: Caches API responses for better performance
- **Push Notifications**: Ready for future notification features

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## CORS Solution

The app uses a Vite proxy configuration to handle CORS issues with the KMB API during development. In production, the service worker handles caching and offline functionality.

## Testing PWA Features

Visit `/test-pwa.html` in your browser to test PWA functionality including:
- Manifest loading
- Service worker registration
- API accessibility
- Install prompt availability
