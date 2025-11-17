# Visio Page - GTB Plan Interactif

A standalone, client-side interactive GTB (Building Automation) plan editor built with Vite + React. This application allows you to create professional building automation plans by dragging and dropping GTB modules onto floor plans.

## Features

- **Image Upload & Cropping**: Upload floor plans and crop them to the desired area
- **Drag & Drop Interface**: Intuitive drag-and-drop system for placing GTB modules
- **Module Repositioning**: Move placed modules by dragging them to new positions
- **Adjustable Module Size**: Dynamically resize all modules using a slider (60px - 200px)
- **Undo Functionality**: Undo up to 10 previous actions (supports Ctrl+Z keyboard shortcut)
- **High-Quality Export**: Download annotated plans as high-resolution PNG images
- **Client-Side Only**: No backend server required - everything runs in the browser
- **Professional UI**: Built with Ant Design for a polished, modern interface

## Technology Stack

- **React 18** - Modern functional components with hooks
- **Vite** - Lightning-fast build tool and dev server
- **Ant Design (antd)** - Enterprise-grade UI component library
- **Konva & React-Konva** - Canvas-based image cropping with interactive controls
- **html2canvas** - Client-side screenshot generation for exporting plans
- **use-image** - React hook for image loading with CORS support

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager

### Setup Steps

1. **Navigate to the project directory**
   ```bash
   cd C:\Users\natha\Desktop\App_Iz\visiopage
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - The app will automatically open at `http://localhost:5173`
   - If not, manually navigate to the URL shown in the terminal

## Usage Guide

### 1. Upload a Background Image

- Click the **"📁 Charger Image"** button
- Select a floor plan image (PNG, JPG, etc.)
- Use the cropping tool to select the desired area
- Click **"Recadrer"** to confirm

### 2. Place GTB Modules

- **Left Panel**: Contains 8 draggable GTB modules (4 types, 2 of each)
- **Drag & Drop**: Click and drag a module from the palette onto the plan
- **Position**: Drop the module at the desired location
- The module will be placed and visible on the plan

### 3. Adjust Module Positions

- **Reposition**: Click and drag any placed module to move it
- **Undo**: Press **Ctrl+Z** or click the **"Annuler"** button to undo the last action
- **Module Counter**: View the total number of placed modules in real-time

### 4. Customize Module Size

- Use the **"Taille des modules"** slider to adjust all module sizes simultaneously
- Range: 60px (small) to 200px (large)
- Default: 120px
- All modules (both in palette and placed) resize dynamically

### 5. Export Your Plan

- Click the **"💾 Télécharger"** button
- The app generates a high-resolution PNG (3x scale for quality)
- The image downloads automatically with timestamp: `GTB_Plan_[timestamp].png`
- Includes both background image and all placed modules

### 6. Clear Modules

- Click **"🗑️ Retirer Tous"** to remove all placed modules
- The background image remains intact
- This action can be undone

## Build Commands

```bash
# Development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Differences from Original Page 6

This standalone version has been simplified and adapted for client-side operation:

### Removed Features:
- ❌ Backend server integration (Express.js, MySQL)
- ❌ ImgBB cloud image storage
- ❌ LocalStorage site context management
- ❌ Devis selection system
- ❌ Automatic plan loading from database

### Retained Features:
- ✅ All drag-and-drop functionality
- ✅ Image cropping with Konva
- ✅ Module placement and repositioning
- ✅ Undo/redo with history
- ✅ Adjustable module sizes
- ✅ High-quality image export
- ✅ Professional Ant Design UI
- ✅ Keyboard shortcuts (Ctrl+Z)

### New Features:
- ✨ Download button (replaces server upload)
- ✨ Simplified single-page app (no routing)
- ✨ No external dependencies (works offline after load)

## Keyboard Shortcuts

- **Ctrl+Z** (Windows) / **Cmd+Z** (Mac): Undo last action

## Troubleshooting

### Issue: Modules not appearing after drag
- **Solution**: Ensure you drop the module inside the white canvas area

### Issue: Image won't upload
- **Solution**: Check file format (use PNG, JPG, JPEG)
- Try a smaller image file (< 10MB recommended)

### Issue: Download produces blank image
- **Solution**: Ensure a background image is loaded before downloading

---

**Built with ❤️ using React + Vite**
