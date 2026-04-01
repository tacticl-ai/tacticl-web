# Landing Page Redesign — PDLC & Agentic AI Platform

**Date:** 2026-04-01
**Status:** Approved

## Vision

Reposition the Tacticl landing page from "distributed AI agents on your devices" to **"your personal AI staffing company."** One person can horizontally scale their team to develop any idea they can imagine — from a quick social post to a full product build.

Embody the industry moment (every person needs an agentic AI strategy) without name-dropping. Let the product speak for itself.

## Approach: "Imagine → Build → Ship" (Journey-Led)

Start accessible, progressively reveal depth. Hook with empowerment, earn trust by showing the sophisticated PDLC pipeline underneath. Works for both "I want to automate a tweet" and "I want to build a SaaS."

## Page Sections

### 1. Hero

- **Headline:** "One Person. Any Idea. A Full Team to Build It."
- **Subhead:** "Tacticl gives you an AI-powered development team on demand. Describe what you want to build — from a social post to a full product — and your team assembles, executes, and delivers."
- **CTAs:** "Get Started" (primary, links to signup) + "See How It Works" (secondary, scroll anchor)
- **Visuals:** Keep existing DNA helix / floating dots / parallax background. Replace disabled "Watch Demo" button with "See How It Works" scroll link.

### 2. The Journey — "How It Works"

Three steps, horizontal on desktop / vertical on mobile, animated connectors between steps.

1. **Describe your idea** — "Tell Tacticl what you want to build in plain English. A mobile app, a marketing campaign, an API integration — anything."
2. **Your team assembles** — "Tacticl spins up the right AI specialists for the job — from a single agent for quick tasks to a full 12-role development team for complex products."
3. **Review, steer, and ship** — "Your team works autonomously but checks in at key milestones. Approve, redirect, or skip roles — you're the CEO of your own AI staffing company."

### 3. Under The Hood — "Meet Your Team"

Premium, cutting-edge aesthetic — glassmorphism, subtle glow, prestigious and techy.

**Header:** "A full product team, on demand" / "Behind every Spark is a pipeline of specialized AI roles — the same structure used by world-class product teams, running in minutes instead of months."

**Part A: Pipeline Visualization**
Horizontal flow diagram showing 12 roles as connected nodes, grouped into phases:

| Phase | Roles |
|-------|-------|
| Discovery | PM, Researcher |
| Design | Architect, Designer |
| Build | Planner, Implementer |
| Quality | Reviewer, Tester, Security Analyst |
| Ship | Technical Writer, DevOps, Retro Analyst |

- Color-coded by phase (cyan / purple / pink palette)
- Animated dash-flow connectors (reuse existing `dashFlow` keyframe)
- On scroll-reveal, nodes light up left-to-right with staggered delay

**Part B: Role Cards**
3-4 column grid of compact cards. Each: icon, role name, one-line description.

- PM — "Defines requirements and success criteria"
- Researcher — "Gathers context, prior art, and constraints"
- Architect — "Designs the technical structure"
- Designer — "Creates UX/UI specifications"
- Planner — "Breaks work into executable steps"
- Implementer — "Writes the code"
- Reviewer — "Reviews for quality and correctness"
- Tester — "Validates functionality and edge cases"
- Security Analyst — "Audits for vulnerabilities"
- Technical Writer — "Produces documentation"
- DevOps — "Handles deployment and infrastructure"
- Retro Analyst — "Reviews execution and captures lessons"

### 4. Scale To Fit — "From a Tweet to a Product"

**Header:** "One platform. Every scale." / "Whether it's a quick automation or a full product build, Tacticl matches the right level of firepower to your task."

Three tier cards, glassmorphism style (frosted glass, subtle border glow, backdrop blur). Cards scale visually — Simple compact, Playbook medium, Full PDLC largest.

- **Simple** — "Quick tasks. One agent." / "Automate a social post, summarize a document, generate content — done in seconds." / Icon: single glowing node
- **Playbook** — "Your workflows. Your way." / "Build custom playbooks with the roles and stages you need — chain together research, content, analysis, or any combination. Reuse them across projects." / Icon: 3-4 connected nodes
- **Full PDLC** — "Full product development. The entire team." / "12 AI roles execute a complete product development lifecycle — from requirements through deployment and retrospective." / Icon: miniature pipeline flow

### 5. Connectors — "Plug Into Everything"

**Header:** "Connect your world" / "Tacticl agents work with the tools and platforms you already use."

Compact icon grid — single row (two on mobile). Minimal, no descriptions beyond label:
- Social — publish to connected platforms
- GitHub — repos, PRs, code
- Devices — MacBook, iPhone, iPad
- APIs — Anthropic, custom tokens

### 6. CTA

- **Headline:** "What will you build?"
- **Subtext:** "Your AI team is ready. Describe your first idea and watch it come to life."
- **Button:** "Get Started Free"
- Radial glow background treatment (keep existing style)

### 7. Footer

Same as current — copyright line, clean.

## Other Changes

- **Pricing section removed** from landing page, moved to dedicated `/pricing` route
- **PublicHeader** updated with "Pricing" nav link pointing to `/pricing`
- **Social Publishing demoted** from top-level feature to a connector example

## Design Aesthetic

- Premium, modern, pristine, prestigious, techy
- Glassmorphism (frosted glass, backdrop blur, subtle border glow)
- Existing color palette: cyan (#06b6d4), purple (#8b5cf6 / #6C63FF), pink (#ec4899)
- Dark background (#0D0D1A / #0F0F23)
- Staggered scroll-reveal animations
- Pipeline flow animations (dash-flow, node pulse)
- Responsive: horizontal flows on desktop, vertical on mobile

## Existing Assets to Reuse

- `useParallax`, `useScrollReveal`, `useTilt3D` hooks
- DNA helix background, floating dots, parallax grid
- `dashFlow`, `nodePulse`, `fadeInUp` keyframes
- `PricingSection` component (moved to new page)
- Color palette and gradient patterns
