# DevConnect Capstone Project Report

## 1. Executive Summary
DevConnect is a full-stack web application designed to solve one of the most common hackathon and project-team challenges: finding the right collaborators with verifiable technical skills. Instead of relying only on self-declared claims, DevConnect integrates coding profiles (GitHub, LeetCode, GeeksforGeeks), resume analytics, and AI-generated profile insights to help users build stronger teams faster.

The platform supports the full lifecycle of collaboration:
- User onboarding and authentication
- Skill profile aggregation from external platforms
- Team requirement posting and candidate applications
- Team-lead review workflows and notifications
- Resume ATS-style analysis and AI career insights

This report presents the problem definition, architecture, modules, data flow, technology stack, and future roadmap.

## 2. Problem Statement
Hackathon participants and early-stage developers often struggle with:
- Discovering teammates with complementary skills
- Verifying actual coding competency and consistency
- Evaluating candidates quickly for time-sensitive events
- Coordinating team formation and communication in one place

Traditional social platforms are not tailored to technical credibility. DevConnect addresses this gap by combining social matching with technical evidence and intelligent analysis.

## 3. Objectives
The main objectives of DevConnect are:
- Build a centralized platform for developer team formation.
- Integrate external coding profiles for data-backed credibility.
- Provide resume quality feedback using ATS-style analysis.
- Offer AI-based profile insights and growth recommendations.
- Enable role-based workflow for team leads and applicants.
- Ensure secure access and data ownership using row-level policies.

## 4. Scope
### 4.1 In Scope
- User signup/login and session-based route protection
- Profile and linked-account management
- Team post creation and team-join application flow
- Applicant review and status management
- Notification system for application outcomes
- Resume upload and resume analysis
- Platform listing for upcoming opportunities

### 4.2 Out of Scope (Current Version)
- Real-time chat/messaging between users
- Fully automated account verification for all external usernames
- End-to-end recruitment analytics dashboard for organizations
- Multi-language localization

## 5. System Design
### 5.1 Architecture Style
DevConnect follows a modern full-stack web architecture using Next.js App Router:
- Presentation Layer: React-based client pages and reusable UI components
- Application Layer: Next.js API routes for orchestration and integrations
- Data Layer: Supabase PostgreSQL, authentication, and object storage
- Intelligence Layer: Resume heuristics and AI-driven profile analysis

### 5.2 Architectural Components
- Client Application (browser)
- Next.js Server Runtime (API routes + middleware)
- Supabase (Auth, Database, Storage)
- External Stats APIs (GitHub, LeetCode, GeeksforGeeks)
- AI Service (Gemini endpoint for profile analysis)

## 6. Technology Stack with Role in Workflow
### 6.1 Frontend
- Next.js 16 (App Router): Routing, layouts, API co-location, SSR/CSR capabilities
- React 19: State-driven UI and component composition
- TypeScript: Strong typing across pages, models, and API responses
- Tailwind CSS 4: Rapid utility-first styling and responsive design
- Framer Motion: Animated card transitions and smoother UI experience
- Lucide React: Consistent iconography across dashboards and forms

### 6.2 Backend and Data
- Next.js Route Handlers: Internal API layer for profile stats and analysis
- Supabase Auth: Email/password and OAuth session management
- Supabase PostgreSQL: Core relational data storage
- Supabase Storage: Resume file upload and retrieval
- Supabase RLS Policies: Ownership and access control at row level

### 6.3 External Integrations
- GitHub REST API: Repository, stars, followers, language usage
- LeetCode external stats APIs: Solved counts, ranking, contest metadata
- GeeksforGeeks public APIs: Coding score and solved metrics

### 6.4 AI and Document Analysis
- Resume parser library: PDF text extraction in server runtime
- Heuristic ATS engine: Score generation and structured suggestions
- Gemini API: AI-based profile strengths, improvements, and career paths

## 7. Detailed Workflow
### 7.1 User Authentication Workflow
1. User signs up or logs in from authentication pages.
2. Supabase Auth validates credentials and creates a session.
3. Middleware checks protected route access.
4. Authenticated users are redirected to dashboard routes.
5. Unauthenticated users attempting protected routes are redirected to login.

### 7.2 Profile and Account Linking Workflow
1. User opens Networks page.
2. User submits usernames for GitHub, LeetCode, and GeeksforGeeks.
3. Platform usernames are upserted into linked_accounts.
4. Profile page fetches these accounts and calls internal stats APIs.
5. Aggregated results are rendered as platform cards.

### 7.3 Resume Analysis Workflow
1. User uploads resume to Supabase Storage bucket.
2. Public file URL is saved in profile data.
3. Profile page triggers resume analysis API.
4. API fetches PDF, extracts text, computes resume signals:
   - Section structure
   - Contact details
   - Skill presence
   - Action verbs
   - Quantified achievements
5. API validates whether document is likely a resume.
6. Valid resume receives ATS score, summary, skills, and suggestions.
7. Invalid/non-resume file returns meaningful validation error.

### 7.4 Team Formation Workflow
1. Team lead creates a post with title, description, hackathon, and required skills.
2. Feed page lists posts with search and filtering.
3. Interested users apply to posts.
4. Unique constraints prevent duplicate applications.
5. Team leads review pending applications.

### 7.5 Application Decision and Notification Workflow
1. Team lead accepts or rejects an application.
2. Application status is updated in database.
3. Notification is created for candidate.
4. Candidate sees updates in Notifications page.
5. If accepted, candidate receives team lead contact context.

### 7.6 AI Profile Insights Workflow
1. System collects available platform stats and resume context.
2. Backend composes structured prompt.
3. Gemini endpoint returns insight JSON.
4. UI displays strengths, improvements, career paths, and skill gaps.
5. If AI key/service is unavailable, fallback insights are provided.

## 8. Module Breakdown
### 8.1 Authentication Module
Responsibilities:
- Signup/login handling
- Session state and sign-out
- Route-level access control

Key Features:
- Email/password authentication
- OAuth callback handling
- Auto-redirection via middleware

### 8.2 Dashboard Module
Responsibilities:
- Provide a consolidated entry point after login
- Surface quick project and profile insights
- Route users efficiently to major workflows

Key Features:
- Authenticated dashboard landing page
- Sidebar navigation with protected access
- Summary-driven navigation to platform features

### 8.3 Profile Module
Responsibilities:
- User identity display
- Resume upload and ATS insights
- Combined performance score rendering

Key Features:
- Dynamic platform score cards
- Resume status and analysis feedback
- Refreshable stats pipeline

### 8.4 Public User Profile Module
Responsibilities:
- Display user details for candidate evaluation
- Support recruiter/team-lead review decisions
- Present cross-platform credibility in one screen

Key Features:
- User profile page by user ID
- Shared profile viewing for decision workflows
- Unified view of coding stats and profile context

### 8.5 Networks Module
Responsibilities:
- Add or update external coding profile handles
- Persist linked platform accounts

Key Features:
- Upsert per platform
- Connected account status feedback

### 8.6 Feed Module
Responsibilities:
- Team post creation
- Team discovery and application

Key Features:
- Search by title, description, and skills
- Role-aware actions (owner view vs applicant view)

### 8.7 Requests Module
Responsibilities:
- Team-lead review of candidates
- Candidate stat inspection
- Accept/reject action handling

Key Features:
- Expandable candidate detail cards
- Multi-platform candidate stat view
- Decision-to-notification handoff

### 8.8 Notifications Module
Responsibilities:
- Show application decision alerts
- Read/unread management
- Notification cleanup

Key Features:
- Mark all as read
- Delete single notification
- Accepted/rejected visual differentiation

### 8.9 Research Collaboration Module
Responsibilities:
- Publish research collaboration opportunities
- Discover open research positions and requirements
- Support applicant submission for research roles

Key Features:
- Research post creation and listing
- Research post detail and apply flow
- Dedicated research requests review page

### 8.10 Research Profile Module
Responsibilities:
- Store research-oriented academic profile data
- Manage publications and research identity details
- Support better matching for research collaborations

Key Features:
- Research profile create/fetch/update APIs
- Publication CRUD operations
- Academic profile enrichment for applicants

### 8.11 Platforms Module
Responsibilities:
- List upcoming hackathon/contest opportunities

Key Features:
- Date-based sorting
- External link to event platform

### 8.12 Resume Analysis Module
Responsibilities:
- Parse resume text from uploaded PDF
- Validate document type relevance
- Compute ATS-style quality metrics

Key Features:
- Non-resume rejection
- Signal-based scoring
- Actionable improvement suggestions

### 8.13 Profile AI Analysis Module
Responsibilities:
- Generate higher-level career insights from profile data

Key Features:
- Structured insight output
- Fallback logic when AI service unavailable

### 8.14 Platform Statistics Integration Module
Responsibilities:
- Fetch coding performance data from external platforms
- Normalize responses for frontend consumption
- Handle failures gracefully across third-party services

Key Features:
- GitHub stats route
- LeetCode stats route
- GeeksforGeeks stats route with error fallback

## 9. Database Design Summary
Primary entities:
- profiles
- linked_accounts
- posts
- applications
- notifications
- platforms

Storage:
- resumes bucket for uploaded resume files

Security:
- Row Level Security policies enforce ownership and visibility boundaries.

## 10. Data Flow Diagrams
### 10.1 DFD Level 0 (Context)
Paste the following Mermaid source in a Mermaid renderer:

flowchart LR
    U[User] --> W[DevConnect Web App]
    W --> S[Supabase Auth and Database]
    W --> ST[Supabase Storage]
    W --> E[External Coding APIs]
    W --> A[AI Analysis Service]
    S --> W
    ST --> W
    E --> W
    A --> W

### 10.2 DFD Level 1 (Profile and ATS Flow)
Paste the following Mermaid source in a Mermaid renderer:

flowchart TD
    U1[Authenticated User] --> N1[Profile Page]
    N1 --> N2[Fetch Linked Accounts]
    N2 --> DB1[(linked_accounts)]
    N1 --> N3[Fetch Platform Stats]
    N3 --> API1[GitHub Route]
    N3 --> API2[LeetCode Route]
    N3 --> API3[GFG Route]
    API1 --> EXT1[GitHub API]
    API2 --> EXT2[LeetCode APIs]
    API3 --> EXT3[GFG APIs]
    N1 --> N4[Resume Upload]
    N4 --> ST1[(Supabase Storage resumes)]
    N4 --> DB2[(profiles.resume_url)]
    N1 --> N5[Resume Analyze Route]
    N5 --> N6[PDF Text Extraction]
    N6 --> N7[Resume Validation and ATS Scoring]
    N7 --> N1

### 10.3 DFD Level 1 (Team Request and Notification Flow)
Paste the following Mermaid source in a Mermaid renderer:

flowchart TD
    TL[Team Lead] --> F1[Create Team Post]
    F1 --> DBP[(posts)]
    C[Candidate] --> F2[Browse Feed]
    F2 --> DBP
    C --> F3[Apply to Post]
    F3 --> DBA[(applications)]
    TL --> R1[Review Requests]
    R1 --> DBA
    TL --> R2[Accept or Reject]
    R2 --> DBA
    R2 --> DBN[(notifications)]
    C --> NTF[Notifications Page]
    NTF --> DBN

## 11. Key Engineering Decisions
1. App Router with colocated API routes was chosen for simpler full-stack cohesion.
2. Supabase was selected to reduce backend boilerplate and accelerate development.
3. Row-level policies were prioritized for secure multi-user data separation.
4. ATS analysis moved from random scoring to deterministic signal-based scoring for credibility.
5. Error-first UX was introduced for invalid resumes to improve user trust.

## 12. Non-Functional Considerations
### 12.1 Security
- Route guard middleware for unauthorized access prevention
- RLS policy boundaries for data ownership
- Controlled write access for uploads and user-owned rows

### 12.2 Reliability
- Fallback handling for external API failures
- Graceful degradation for AI service failures
- Validation and explicit error responses in resume processing

### 12.3 Performance
- Parallel fetch calls in selected API workflows
- Caching hints for some external data endpoints
- Lightweight card-based UI with incremental loading states

### 12.4 Maintainability
- Componentized UI primitives
- Typed models for major data contracts
- Module-separated routes and feature pages

## 13. Testing and Validation Strategy
Recommended testing layers for capstone evaluation:
- Unit tests for ATS scoring and resume validation helpers
- API route tests for stats normalization and error branches
- Integration tests for application and notification workflow
- UI tests for auth redirects and protected route behavior
- Regression tests for resume parser edge cases

## 14. Limitations
- External API stability may vary based on third-party uptime.
- Username validation in Networks can be strengthened before persistence.
- Resume ATS currently supports PDF text extraction path only.
- Notification model is in-app and does not yet include push/email delivery queue.

## 15. Future Enhancements
### 15.1 Product Enhancements
- Real-time direct messaging and team chat rooms
- Team compatibility scoring using skill overlap and gaps
- Portfolio and project showcase with media attachments
- Advanced search filters by role, stack, and experience depth

### 15.2 AI Enhancements
- Role-specific resume scoring (Frontend, Backend, ML, DevOps)
- Interview-readiness insights from profile trajectory
- Personalized learning roadmap from detected skill gaps

### 15.3 Platform Enhancements
- Background job scheduler for periodic profile sync
- Event-driven notification pipeline (email and push)
- Admin analytics dashboard for adoption and engagement
- CI-based test automation and deployment pipelines

## 16. Conclusion
DevConnect demonstrates a practical and scalable approach to data-driven team formation for developers. It combines social collaboration features with objective technical signals, resume analytics, and AI insights, resulting in a platform that improves trust, matching quality, and decision speed in hackathon and project environments.

From a capstone perspective, the project showcases full-stack engineering competence across frontend design, backend integration, secure database architecture, external API orchestration, and intelligent analysis workflows.

## 17. Recent UI Changes (March 2026)
- Sidebar is now toggleable (collapse/expand) using a dedicated header toggle button.
- Sidebar supports compact icon-only mode when collapsed, with hover titles for usability.
- Added a functioning Light/Dark mode toggle button in the sidebar footer.
- Theme selection is persisted using browser localStorage and applied on load.
- Navigation scope was simplified based on latest requirement:
    - Kept: Dashboard
    - Removed: Profile, Networks, Feed, Research Collaborations, Requests, Notifications, Platforms
- Sign Out action remains available in both expanded and collapsed sidebar states.
