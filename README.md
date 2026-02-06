# CAP Web Application

A progressive web application (PWA) built for Apex for Youth's College Access Program, providing a centralized hub for college application support. Serves 40+ high school students and 20+ mentors navigating the college application process.

## Overview

CAP students apply to colleges through multiple platforms (Common App, Questbridge, SUNY, CUNY) while managing financial aid deadlines, scholarship applications, and program activities. This app consolidates communication, deadline tracking, resources, and mentor connections into a single platform.

## Features

### Unified Chat System
Real-time messaging between students, mentors, and program administrators with push notifications (iPhone PWA-compatible).

### Smart Deadline Tracker
- Manual entry for specific college deadlines
- Auto-population of platform-specific to-dos (Common App, Questbridge, SUNY, CUNY)
- No hardcoded dates—uses application templates

### Integrated Calendar
Automatically syncs application deadlines with other in-app reminders and meeting scheduling.

### Resource Library
Admin-uploaded session materials (Google Docs, slides, worksheets) organized for easy student reference.

### Mentor Directory
Profiles of mentors with college background, majors, and career paths to help students explore options and make connections.

## Tech Stack

**Backend**
- Django
- PostgreSQL
- WebSockets (real-time chat)

**Frontend**
- React (three separate apps: main, chat, todos)
- Progressive Web App (PWA) capabilities

**Services**
- OneSignal (push notifications)
- Render (hosting - free tier)

**Testing**
- k6 (performance/load testing)

## Architecture

Three separate React applications for separation of concerns:

```
├── frontend/              # Main app (directory, resources, calendar)
├── community-frontend/    # Chat and messaging
├── todos-frontend/        # Deadline tracking
└── cap_portal/           # Django backend
```

Each app maps to its own URL and can be developed/deployed independently.

## Key Technical Decisions

**WebSockets for chat**: Chose to implement WebSockets directly rather than using Firebase to learn real-time communication fundamentals while keeping the solution maintainable.

**OneSignal for push notifications**: Selected specifically for iPhone PWA compatibility after discovering platform-specific limitations with other services.

**Template-based deadline auto-population**: Rather than hardcoding dates that require annual updates, the app uses application templates that students can customize to their timeline.

**Role-based access via email whitelist**: Simple but effective approach for a known user base of ~60 users. Admin maintains whitelist mapping emails to roles (admin/mentor/mentee).

## Performance

k6 load testing confirmed the app handles expected concurrent usage comfortably within Render's free tier limits. At 20 concurrent users performing database-heavy operations, the app consumed only 21% of available memory and under 30% CPU—well within constraints for the expected user base of ~60 total users.

## Project Context

Built as volunteer work for [Apex for Youth](https://apexforyouth.org/), a nonprofit serving low-income Asian American youth in New York City.