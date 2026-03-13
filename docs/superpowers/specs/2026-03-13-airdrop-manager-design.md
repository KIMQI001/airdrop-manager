# Airdrop Task Manager - Design Spec

**Date:** 2026-03-13
**Project:** Airdrop Task Manager Web App

## 1. Project Overview

A single-page web application for managing cryptocurrency airdrop tasks. Users can track wallet addresses, manage airdrop tasks, view activity history, and see completion statistics on a dashboard.

## 2. Tech Stack

- **Frontend:** Single HTML file with vanilla JavaScript
- **Styling:** Tailwind CSS (CDN)
- **Storage:** Local JSON files (user selects a folder)
- **Deployment:** Static file (can be opened directly in browser)

## 3. Data Structure

```
data/
├── wallets.json   - Wallet addresses
├── tasks.json     - Airdrop tasks
├── activities.json - Activity logs
└── settings.json  - App settings
```

### 3.1 Wallet Schema
```json
{
  "wallets": [
    {
      "id": "uuid",
      "address": "0x...",
      "label": "Main Wallet",
      "network": "Ethereum",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

### 3.2 Task Schema
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Uniswap Airdrop",
      "description": "Claim tokens",
      "status": "pending|in-progress|completed",
      "priority": "low|medium|high",
      "walletId": "wallet uuid",
      "dueDate": "ISO date",
      "completedAt": "ISO date",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

### 3.3 Activity Schema
```json
{
  "activities": [
    {
      "id": "uuid",
      "type": "wallet_added|task_created|task_completed|...",
      "description": "Activity description",
      "entityId": "related entity uuid",
      "timestamp": "ISO date"
    }
  ]
}
```

## 4. UI/UX Specification

### 4.1 Layout
- **Sidebar:** Fixed left navigation (240px width)
- **Main Content:** Flexible width, scrollable
- **Header:** Page title + action buttons

### 4.2 Color Scheme
- **Primary:** Indigo (#4F46E5)
- **Secondary:** Slate (#64748B)
- **Success:** Emerald (#10B981)
- **Warning:** Amber (#F59E0B)
- **Danger:** Rose (#F43F5E)
- **Background:** Slate-50 (#F8FAFC)
- **Card:** White (#FFFFFF)

### 4.3 Typography
- **Font:** Inter (Google Fonts)
- **Headings:** Bold, Slate-900
- **Body:** Regular, Slate-600

### 4.4 Components
- **Cards:** White bg, rounded-lg, shadow-sm
- **Buttons:** Primary (indigo), Secondary (slate), Danger (rose)
- **Inputs:** Border slate-300, focus:ring indigo-500
- **Tables:** Striped rows, hover effect
- **Modals:** Centered, overlay bg-black-50

## 5. Page Specifications

### 5.1 Treasury (Wallet Management)
- Table showing all wallets with columns: Label, Address, Network, Created
- Add wallet button → Modal with form
- Edit/Delete actions per row
- Copy address button

### 5.2 Tasks
- Kanban or list view toggle
- Filter by status, priority
- Add task button → Modal with form
- Status dropdown to change quickly
- Due date display

### 5.3 Activity History
- Chronological list of all activities
- Filter by type
- Show timestamp, type icon, description
- Pagination or infinite scroll

### 5.4 Dashboard
- Stats cards: Total Wallets, Total Tasks, Completed, In Progress
- Completion rate progress bar
- Recent activities list
- Tasks by status pie chart (simple CSS)
- Upcoming deadlines

## 6. Functionality

### 6.1 File Operations
- "Select Folder" button to choose data directory
- Auto-save on every change
- Load data on app start
- Create default JSON files if not exist

### 6.2 CRUD Operations
- Create/Read/Update/Delete for wallets and tasks
- Validation: required fields, address format
- Confirmation for delete actions

### 6.3 Activity Logging
- Auto-log all CRUD operations
- Log types: wallet_added, wallet_updated, wallet_deleted, task_created, task_updated, task_deleted, task_completed

## 7. Acceptance Criteria

1. App loads without errors in modern browsers
2. User can select a folder for JSON storage
3. Can add, edit, delete wallets
4. Can add, edit, delete tasks with status changes
5. Activity history shows all actions with timestamps
6. Dashboard displays accurate statistics
7. Data persists in JSON files
8. Responsive design works on mobile
