# Implementation Plan: AI-Powered Customer Support System

This document translates the Software Requirements Specification (SRS) into an actionable technical roadmap.

## 1. Architecture & Tech Stack
Based on the SRS, our core stack comprises:
- **Frontend**: React.js (Vite)
- **Backend**: Node.js (Express)
- **Database**: PostgreSQL
- **Orchestration**: n8n
- **API Gateway**: Meta's Official WhatsApp Business API
- **AI Engine**: Step 3.5 Flash (via OpenRouter) for high-speed initial filtering & GPT-OSS 120B (via OpenRouter) for deep reasoning.

## 2. Database Schema (PostgreSQL)
We'll map out a relational database with at minimum the following entities:
- **Users**: Admin, Manager, Executive roles (RBAC support).
- **Projects**: Entity mapping for WhatsApp groups -> Unique Project IDs.
- **Messages**: Raw ingestion log from WhatsApp (supports context window and historical analytics).
- **Tasks**: Generated tasks with states (New, Assigned, In Progress, Waiting for Client, Resolved, Closed), linked to Messages, Projects, and Users.
- **Audit Logs**: Tracking all status changes and manual overrides.

## 3. Core Modules & Feature Breakdown

### A. Auth & RBAC (NFR-1, NFR-2)
- JWT-based authentication.
- Email/Password login.
- Google SSO Auth integration.
- Role-Based middleware ensuring Executives can only manage tasks, while Admins manage the system and review everything.

### B. WhatsApp Ingestion & Response Service (FR-1, FR-2, FR-3, FR-11, FR-12)
- **Webhook Endpoint**: To receive inbound webhooks from Meta/Twilio.
- **n8n Workflows**: Orchestrating the ingestion from WhatsApp -> passing to AI -> saving to DB.
- **Response Job**: A delayed queue (2–5 seconds) responsible for sending the confirmation back to the WhatsApp group.

### C. AI Task Qualification Engine (FR-4, FR-5, FR-6, FR-7)
- **Prompt Engineering**: Instruct AI to classify intent and filter noise (casual banter).
- **Confidence Scoring**: Require >= 70% confidence for automated task creation.
- **Categories**: Critical Bug, Feature Request, Support Request, General Inquiry, Feedback/Suggestion, Uncategorized.
- **Threading Engine**: Linking follow-ups to existing tasks to prevent duplication.

### D. Executive Dashboard (React.js) (FR-8, FR-9)
- **Auth Views**: Login / SSO.
- **Task Kanban/List View**: Visualizing New -> Closed pipeline.
- **Task Detail View**: Showing message context, metadata, and allowing manual overrides.
- **Admin View**: User role management and review queue for "Uncategorized" messages. Ensure premium and responsive design aesthetics.

## 4. Development Phases

**Phase 1: Foundation & Base Structure**
- Initialize Git repository and project structure.
- Spin up PostgreSQL database and apply initial schema/migrations.
- Setup basic backend server (FastAPI/Node).
- Setup React project with routing, authentication UI, and API client.

**Phase 2: Core Messaging & AI Logic (Backend)**
- Implement WhatsApp Webhook endpoints.
- Integrate the AI Task Qualification Engine.
- Develop thread contextualization and task creation logic.
- Implement the delayed messaging service for automated client response.

**Phase 3: Executive Dashboard (Frontend)**
- Build the React Dashboard layout following high-end, responsive design aesthetics.
- Implement real-time task views and status mutation APIs.
- Implement manual override forms and display audit logs.

**Phase 4: Orchestration & Refining**
- Setup n8n instance and build necessary workflows linking WA, AI, and Backend.
- Add Google SSO.
- End-to-end testing with test WhatsApp groups to ensure stability.

## Next Steps
The decisions have been made and we will proceed to set up the foundation including Git structure, Node.js backend, and Vite React frontend.
