# Coaching Portal – Product Requirements Document (PRD)

**Version:** 2.0  
**Date:** January 2026  
**Product Type:** Web-based Coaching Portal (Progressive Web App)  
**Audience:** Product, Design, Engineering, Stakeholders  

---

## 1. Executive Summary

### 1.1 Vision
Build a professional, scalable coaching portal that centralizes client management, session workflows, resources, and communication—delivering a clean experience for both coach and clients across desktop and mobile.

### 1.2 Objectives
- Eliminate manual and fragmented coaching workflows
- Give clients 24/7 access to their coaching journey
- Provide a single operational dashboard for the coach
- Enable future expansion without architectural lock-in

### 1.3 Target Users
- **Coach (Primary Admin)**
- **Clients (Authenticated End Users)**
- **Public Visitors (Prospective Clients)**

### 1.4 Success Criteria
- Coach manages all clients and sessions from one dashboard
- Clients can independently access sessions, notes, resources, and actions
- Intake-to-active-client flow completed in under 5 minutes
- Fully usable on mobile as an installable PWA

---

## 2. Product Scope

### 2.1 In Scope (MVP)
- Public marketing site with intake form
- Authentication and role-based access
- Client portal (sessions, reflections, resources, actions)
- Coach dashboard (clients, sessions, intake, notes)
- File/resource management via external storage provider
- Notifications (email + in-app)
- Pricing calculator (internal tool)
- Responsive, mobile-first PWA

### 2.2 Out of Scope (Post-MVP)
- Automated booking/payments
- Video hosting or recording
- AI transcription or summaries
- Multi-coach support
- Community or group features

---

## 3. Platform & Architecture (Tech-Agnostic)

### 3.1 Frontend
- Component-based UI architecture
- Server-rendered or client-rendered compatible
- Form validation and controlled inputs
- Accessible, keyboard-navigable UI (WCAG 2.1 AA)

### 3.2 Backend
- Auth provider with role-based authorization
- Document-oriented or relational database
- Event-driven background jobs (notifications, reminders)
- External file storage integration (cloud drive or object storage)

### 3.3 Integrations
- Email delivery service
- Calendar (.ics export for MVP)
- External file storage API
- Optional spreadsheet-based pricing rules

> **No specific framework, database, or vendor is required.**
> Architecture must allow swapping providers without rewriting business logic.

---

## 4. Design System & UI Components

### 4.1 Component Library
All UI components **must be implemented using `shadcn/ui`** (or direct derivatives).

Required component patterns:
- Button, Input, Textarea, Select
- Card, Badge, Alert
- Dialog / Modal
- Tabs
- Dropdown Menu
- Table
- Toast / Sonner notifications
- Skeleton loaders

### 4.2 Styling
- Utility-first CSS approach
- Design tokens for color, spacing, typography
- Light theme required; dark theme optional
- Consistent spacing scale and radius system

### 4.3 UX Principles
- Coach-first efficiency
- Client clarity over density
- Clear empty states and feedback
- No hidden critical actions

---

## 5. User Roles & Permissions

### 5.1 Public Visitor
- View marketing pages
- Submit intake form

### 5.2 Client
- View own dashboard
- Access sessions, notes, reflections, resources
- Manage own action items
- Update personal profile
- Comment/message within sessions

### 5.3 Coach (Admin)
- Full access to all client data
- Manage intake forms
- Create and manage sessions
- Upload notes and resources
- View engagement metrics
- Use pricing calculator

---

## 6. Core Features

### 6.1 Public Website
- Landing page
- Services overview
- Testimonials
- Intake form with validation
- SEO-friendly structure

### 6.2 Intake Workflow
- Form submission stored securely
- Coach notification
- Accept / decline flow
- Acceptance creates client account and data structure

### 6.3 Client Portal
**Dashboard**
- Session stats
- Upcoming session
- Pending actions

**Sessions**
- Upcoming & past sessions
- Pre-session prep
- Post-session reflection
- Coach notes visibility controlled by coach

**Resources**
- Central library
- Filter by session, type, date
- Download or preview

**Action Items**
- Active vs completed
- Session-linked or self-created

**Profile**
- Personal info
- Notification preferences
- Data deletion request

### 6.4 Coach Dashboard
- Practice overview metrics
- Client list with engagement scores
- Intake management
- Session creation & editing
- Notes & resource uploads
- Pricing calculator (internal)

---

## 7. Data Model (Conceptual)

Entities:
- User
- Client Profile
- Intake Form
- Session
- Resource
- Action Item
- Notification
- Message

> Storage model must support:
> - Client-owned data isolation
> - Coach-wide visibility
> - Soft deletion and auditability

---

## 8. Notifications

### 8.1 Email
- Intake submitted
- Account created
- Session scheduled
- Session reminder
- Resource uploaded

### 8.2 In-App
- Notification bell
- Read/unread states
- Real-time or near-real-time delivery

---

## 9. Security & Privacy

- Enforced authentication for all private routes
- Role-based authorization checks
- HTTPS-only access
- Data encryption at rest and in transit
- GDPR-aligned data deletion workflow
- No public access to stored files

---

## 10. Performance & Quality Targets

- Lighthouse Performance: 90+
- First Contentful Paint < 1.5s
- Fully usable on mobile devices
- Zero critical accessibility violations

---

## 11. Development Phases

1. Foundation & Auth
2. Intake + Client Creation
3. Client Portal
4. Coach Dashboard
5. Notifications & PWA
6. QA, Security Review, Launch

---

## 12. Guiding Constraints

- Avoid vendor lock-in
- Prefer clarity over cleverness
- Every feature must justify its complexity
- shadcn/ui is mandatory for UI consistency

---

**End of Document**
