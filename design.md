# NorCal EMS Policies App - Design Document

## Overview

A mobile-first reference app for EMS professionals to quickly search, browse, and access all Nor-Cal EMS policies. The app organizes ~200+ policies across 6 major categories into a clean, searchable interface with direct PDF access.

## Screen List

| Screen | Purpose |
|--------|---------|
| Home | Category overview with search bar, quick access to all 6 policy categories |
| Category Detail | Lists all sections and policies within a selected category |
| Search Results | Full-text search results across all policy titles |
| Policy Viewer | Opens the policy PDF in an in-app browser |

## Primary Content and Functionality

### Home Screen
The home screen features a prominent search bar at the top for instant policy lookup. Below it, 6 category cards are displayed in a vertical list, each showing the category number, name, and policy count. A "Recently Viewed" section at the bottom shows the last 5 accessed policies for quick re-access.

### Category Detail Screen
Displays all sub-sections within a category as collapsible accordion groups. Each section header shows the section number and name. Tapping a section reveals its individual policies. Each policy row shows the policy number and title, and tapping it opens the PDF.

### Search Results Screen
Shows matching policies as the user types, filtering by policy number and title. Results are grouped by category with clear section headers. Each result shows the full policy title with the matching text highlighted.

### Policy Viewer
Opens the policy PDF URL in an in-app browser (WebBrowser) for viewing. Shows a loading indicator while the PDF loads.

## Key User Flows

### Browse by Category
User opens app -> sees 6 category cards -> taps "1000 Treatment Guidelines" -> sees sections (Cardiac, Medical, Trauma, etc.) -> taps "1100 Cardiac" -> sees individual policies -> taps "1101 Chest Pain" -> PDF opens in browser

### Search for a Policy
User opens app -> taps search bar -> types "intubation" -> sees matching policies from all categories -> taps desired result -> PDF opens in browser

### Quick Re-access
User opens app -> scrolls to "Recently Viewed" -> taps a previously viewed policy -> PDF opens

## Color Choices

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| primary | #1E3A5F | #4A90D9 | Navy blue - EMS professional feel |
| background | #FFFFFF | #121417 | Clean white / deep dark |
| surface | #F0F4F8 | #1C2026 | Light blue-gray cards |
| foreground | #1A1A2E | #E8ECF0 | Strong readable text |
| muted | #6B7B8D | #8A9AAD | Secondary text |
| border | #D8E0E8 | #2A3240 | Subtle dividers |
| success | #22C55E | #4ADE80 | Active/available |
| warning | #F59E0B | #FBBF24 | Attention needed |
| error | #EF4444 | #F87171 | Errors |

The navy blue primary color conveys professionalism and trust, appropriate for an EMS/medical reference tool. The blue-gray surface tones create a calm, clinical feel.

## Navigation Structure

Single-tab layout with stack navigation. The home screen is the entry point. Category detail screens push onto the stack. Search is accessible from the home screen header.

## Data Architecture

All policy data is bundled locally as a JSON file within the app. No backend or API calls needed for policy browsing. Recently viewed policies are stored in AsyncStorage for persistence.
