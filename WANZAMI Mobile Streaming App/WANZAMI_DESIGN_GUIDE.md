# WANZAMI Mobile App - Design System Guide

## 🎨 Brand Identity

WANZAMI is a premium African streaming platform combining cinematic excellence with cultural authenticity.

### Color Palette

**Primary Colors:**
- Primary Background: `#0B0B0F` - Deep cinematic black
- Secondary Surface: `#14141B` - Card and modal backgrounds
- Elevated Surface: `#1C1C25` - Hover and elevated states

**Brand Accents:**
- Wanzami Red: `#E50914` - Primary brand color (CTA buttons, live badges)
- Gold Warmth: `#FFB020` - Premium cultural accent (ratings, highlights)

**Text Hierarchy:**
- Primary Text: `#FFFFFF` - Main headings and content
- Secondary Text: `#A1A1AA` - Supporting information
- Muted Text: `#6B7280` - Tertiary information

## 📱 App Structure

### Navigation
Bottom tab navigation with 5 main sections:
1. **Home** - Personalized dashboard with hero banners
2. **Movies** - Browse and filter movie catalog
3. **Series** - Explore TV series content
4. **Live** - Watch live events and premieres
5. **Profile** - User account and settings

### Screen Inventory

#### 1. Home Screen
- Cinematic hero carousel with featured content
- Continue Watching row
- Live Events Happening Now
- Trending in Nigeria
- Wanzami Originals
- Category rows (scrollable horizontal)

#### 2. Movies Screen
- Genre filter chips
- 2-column grid layout
- Rating badges
- Original content badges
- Hover animations

#### 3. Series Screen
- Similar layout to Movies
- Season/episode count indicators
- Progress bars for ongoing series

#### 4. Live Screen
- Featured live stream (full-width)
- Live badge with pulsing animation
- Viewer count in real-time
- Upcoming premieres section
- Watch party grid

#### 5. Search Screen
- Trending searches
- Browse by genre
- Search results grid
- Real-time filtering

#### 6. Profile Screen
- User avatar with premium badge
- Watch statistics
- Menu items with icons
- Settings and support

#### 7. Movie Detail Screen
- Full-width backdrop image
- Play, Download, Add to List actions
- Synopsis and metadata
- Cast carousel
- Similar content recommendations

#### 8. Live Stream Player Screen
- Video player with controls
- Live chat integration
- Viewer statistics
- Gift/support options
- Watch party features

## 🧩 Component Library

### Core Components

**MoviePosterCard** (`small`, `medium`, `large`)
- Aspect ratio: 2:3 (portrait)
- Hover scale and lift effect
- Rating badge (top-right)
- Progress indicator (bottom)
- Play button overlay on hover

**ContinueWatchingCard**
- Landscape format (16:9)
- Progress bar showing watch percentage
- Duration remaining display
- Large play button overlay

**HeroBanner**
- Full-width cinematic presentation
- Gradient overlays (black to transparent)
- Wanzami Original badge
- Title, metadata, description
- Play and More Info CTAs

**LiveStreamCard**
- Pulsing LIVE badge
- Viewer count
- Category tag
- Host information
- Scheduled time for upcoming events

**CategoryRow**
- Horizontal scrolling
- "See All" action
- Consistent spacing and padding

**BottomNavigation**
- Fixed position
- Active tab indicator (red line)
- Icon and label
- Smooth transitions

**TopAppBar**
- Gradient background
- WANZAMI logo
- Search, notifications, profile actions

**GenreChips**
- Horizontal scrolling
- Active state (red background)
- Inactive state (dark gray)

**EpisodeCard**
- Landscape thumbnail
- Episode number and title
- Duration and description
- Watched indicator

## 🎬 Interaction Design

### Micro-interactions
- **Poster Hover**: Scale 1.05, lift -4px
- **Live Badge**: Pulsing scale animation (infinite)
- **Button Tap**: Scale 0.95
- **Tab Switch**: Smooth layout animation
- **Skeleton Loading**: Pulse animation

### Animations
- Stagger animations for grid items (delay: index * 0.05)
- Fade-in for screen transitions
- Smooth scale on interactive elements
- Progress bar fills with transition

### Gestures
- Horizontal scroll for category rows
- Tap for selection
- Swipe for navigation (potential)

## 📐 Layout Guidelines

### Mobile Specifications
- Target: iPhone 15, Pixel 8
- Max width: 448px (md breakpoint)
- Centered container on larger screens
- Safe area padding for notch/home indicator

### Spacing System
- Container padding: 24px (1.5rem / px-6)
- Card gaps: 16px (1rem / gap-4)
- Section margin: 32px (2rem / mb-8)

### Typography
- Headlines: Bold, large (text-2xl to text-4xl)
- Body: Regular, base (text-base)
- Supporting: Small (text-sm, text-xs)
- Font family: System (Inter/SF Pro)

### Border Radius
- Small cards: 8px (rounded-lg)
- Large cards: 16px (rounded-xl)
- Hero: 24px (rounded-2xl)
- Buttons: 9999px (rounded-full)

## 🎯 Key Features

### Premium Indicators
- Crown icon for premium users
- "Wanzami Original" badges
- Premium plan highlights

### Social Features
- Live chat in stream player
- Viewer counts
- Watch parties
- Gift/support options

### Personalization
- Continue watching
- My list
- Watch history
- Recommendations

## 🌟 Brand Moments

1. **Logo**: "WAN" in red + "ZAMI" in white
2. **Loading States**: Skeleton screens with pulse
3. **Empty States**: Friendly messaging with CTAs
4. **Badges**: Original, Live, Premium
5. **Gradients**: Black to red, black to transparent

## 🔄 State Management

- Active tab state
- Current screen navigation
- Search query state
- Genre filter state
- Video player controls
- Chat messages

## ⚡ Performance

- Lazy loading for images
- Horizontal scroll optimization
- Smooth 60fps animations
- Optimized re-renders

---

**Created for**: African Film & Live Entertainment Streaming
**Platform**: Mobile (iOS & Android)
**Style**: Cinematic, Premium, Cultural
**Version**: 2.0.1
