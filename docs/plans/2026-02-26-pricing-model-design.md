# Tacticl Pricing Model Design

**Date:** 2026-02-26
**Status:** Approved
**Author:** Brainstorming session (team analysis)

---

## Executive Summary

Tacticl uses a **premium flat-tier subscription model** with true 25x margin targeting. The product is positioned above commodity AI chatbots ($20/mo) because it delivers fundamentally different value: a multi-device AI agent that controls your machines. Acquisition via 14-day free trial requiring credit card upfront.

---

## Cost Structure

### What Tacticl Pays For

| Cost Category | % of Total | Monthly (medium user) | Scales With |
|---|---|---|---|
| LLM API tokens | 85-92% | ~$12 | Spark count x tokens |
| Cloud Run orchestrator | 4-8% | ~$0.80 | Active users, concurrent sparks |
| Database/storage | 2-4% | ~$0.15 | Spark history, log volume |
| Firebase Hosting | <1% | ~$0.01 | Page views (negligible) |
| WebSocket | <1% | ~$0.05 | Concurrent connected users |

**Key advantage:** Device compute is FREE. All heavy work (executing tactics, cloning repos, running builds, posting to social) runs on the user's own hardware. The cloud orchestrator is lightweight — routing, state tracking, checkpoint management.

### Cost Per Spark (Sonnet, blended ~$0.007/1K tokens)

| Spark Size | Tokens | Raw Cost | At 25x |
|---|---|---|---|
| Small (quick query) | 10K | $0.07 | $1.75 |
| Medium (multi-tactic) | 50K | $0.35 | $8.75 |
| Large (deep research) | 100K | $0.70 | $17.50 |
| Very Large (agent run) | 500K | $3.50 | $87.50 |

---

## Acquisition Model

### 14-Day Free Trial (Credit Card Required)

- Payment method required to start trial
- Full Pro-tier features for 14 days
- 3 devices, all models, 100 sparks cap during trial
- Auto-converts to chosen paid plan at day 14
- Cancel anytime during trial = no charge
- No permanent free tier (eliminates money-losing free users)

**Rationale:** Collect payment info upfront for highest conversion rates. Users experience full product value before committing. No ongoing cost from perpetual free-tier users.

---

## Tier Structure

### Pricing Table

| | Starter | Pro | Max | Enterprise |
|---|---|---|---|---|
| **Monthly** | **$49/mo** | **$129/mo** | **$349/mo** | **Custom** |
| **Annual** | $39/mo ($468/yr) | $99/mo ($1,188/yr) | $279/mo ($3,348/yr) | Custom |
| Token Allocation | 250K/mo | 750K/mo | 2.5M/mo | Custom |
| Approx. Sparks | 10-25 small | 30-75 small | 100-250 small | Unlimited |
| Raw Cost to Tacticl | ~$1.75/mo | ~$5.25/mo | ~$17.50/mo | Variable |
| **Effective Margin** | **28x** | **24.5x** | **20x** | **Negotiated** |

### Feature Breakdown

| Feature | Starter | Pro | Max | Enterprise |
|---|---|---|---|---|
| Devices | 3 | 10 | Unlimited | Unlimited |
| Models | Haiku + Sonnet | All models | All + priority routing | All + dedicated |
| Spark Types | All 6 | All 6 | All 6 | All + custom |
| Priority Levels | Normal | Normal + High | All priorities | Dedicated queue |
| Checkpoint Policies | Manual only | Manual + Auto | All policies | Custom policies |
| Scheduling | No | Yes | Yes + recurring | Yes + API access |
| Social Integrations | 1 platform | 3 platforms | Unlimited | Unlimited |
| Support | Community | Email (48h) | Priority (4h) | Dedicated CSM |

### Annual Pricing Rationale

20% discount on monthly price when billed annually:
- Cash flow: 12 months upfront
- Churn reduction: annual subscribers stick longer
- Starter annual: $39/mo x 12 = $468/yr vs $21 raw cost = 22x margin (still strong)

---

## Usage Cap Policy

When users approach or hit their monthly token allocation:

1. **80% warning** — In-app notification: "You've used 80% of your monthly allocation"
2. **100% hard cap** — Sparks queue but don't execute
3. **Upgrade prompt** — "You've used your monthly allocation. Upgrade to [next tier] for [Nx] more capacity"
4. **No overage charges** — Keeps the model simple and predictable
5. **Allocation resets** on billing cycle date

---

## Device Policy

Devices cost near-zero to support (WebSocket is 1 per user, not per device; device connections are lightweight pairing + periodic state check-ins). Device limits serve as **tier differentiators**, not cost controls:

| Tier | Device Limit | Covers |
|---|---|---|
| Trial | 3 | Phone + laptop + tablet |
| Starter | 3 | Phone + laptop + tablet |
| Pro | 10 | Multiple workstations, test devices |
| Max | Unlimited | No restrictions |
| Enterprise | Unlimited | No restrictions |

### Orchestrator Scalability

The cloud orchestrator can support many devices per account because:
- 1 WebSocket connection per user (not per device)
- Device daemon connections are lightweight (pairing code auth, periodic check-ins)
- Spark routing is pure orchestration logic (capability matching, availability, preferences)
- Backend cost scales with active sparks, not connected devices
- Device state (ONLINE/OFFLINE/BUSY) is a simple status field, not a persistent connection

---

## Market Positioning

### Why Premium Pricing is Justified

Tacticl is **not** a chatbot. It's a multi-device AI agent that:
- Remotes into your actual devices (phones, tablets, computers, watches)
- Executes real tasks on your hardware (code, social, research, devops, creative, data)
- Has human-in-the-loop checkpoints for safety
- Routes tasks to optimal devices based on capabilities
- Manages scheduling and recurring automation

### Competitive Context

| Product | Price | What It Does |
|---|---|---|
| ChatGPT Plus | $20/mo | Chat + basic tools |
| Claude Pro | $20/mo | Chat + analysis |
| GitHub Copilot Pro+ | $39/mo | Code completion only |
| Devin | $20/mo + $2.25/ACU | AI coding agent (cloud only) |
| Cursor Pro | $20/mo | IDE AI assistant |
| **Tacticl Starter** | **$49/mo** | **Multi-device AI agent across ALL your devices** |
| **Tacticl Pro** | **$129/mo** | **Full agent with all models, scheduling, 10 devices** |

Tacticl replaces the need for multiple AI subscriptions. A developer using ChatGPT ($20) + Copilot ($39) + a social tool ($15-30) spends $74-89/mo. Tacticl Pro at $129/mo replaces all of them with a unified multi-device agent.

---

## BYOK Consideration

The codebase supports Bring Your Own Key (AgentToken with ANTHROPIC/GITHUB/OPENAI providers). For BYOK users:
- They bypass Tacticl's LLM cost entirely
- The 25x markup on tokens doesn't apply
- **Recommendation:** BYOK only available on Max ($349/mo) and Enterprise tiers as a power-user feature. The platform fee at those tiers ($349+) covers orchestration costs with strong margin even without LLM markup.

---

## Revenue Projections (Illustrative)

Assuming 1,000 paying users after 12 months:

| Tier | % of Users | Users | Monthly Revenue | Annual Revenue |
|---|---|---|---|---|
| Starter | 50% | 500 | $24,500 | $294,000 |
| Pro | 35% | 350 | $45,150 | $541,800 |
| Max | 12% | 120 | $41,880 | $502,560 |
| Enterprise | 3% | 30 | ~$30,000 | ~$360,000 |
| **Total** | | **1,000** | **~$141,530** | **~$1,698,360** |

Raw LLM cost for 1,000 users: ~$7,000-15,000/month
Infrastructure: ~$2,000-5,000/month
**Gross margin: ~85-93%**

---

## Implementation Notes

### What Already Exists in Codebase

- `Spark.totalTokens` and `Spark.estimatedCost` — per-spark cost tracking
- `Tactic.tokenUsage` — per-sub-task token tracking
- `ExecutionLog.tokenUsage: { input, output }` — granular per-call tracking
- `AgentToken.usageLimits` — daily/monthly/per-request caps
- `AgentToken.currentUsage` — real-time usage counters
- Token usage display in UI (SparkDetailPage, TokenListPage)

### What Needs to Be Built

- Subscription/billing system (Stripe integration)
- Tier enforcement middleware (check allocation before spark execution)
- Usage dashboard (monthly allocation consumed vs. remaining)
- Upgrade prompts and flows
- Trial period management (14-day countdown, auto-conversion)
- Annual billing option
- Device limit enforcement per tier
- Social integration limit enforcement per tier

---

## Open Questions for Future Iteration

1. Should there be a "Teams" plan between Max and Enterprise for small teams (5-10 seats)?
2. Should scheduled/recurring sparks count differently against allocation?
3. Should model selection affect token consumption rate (e.g., Opus counts 3x against allocation)?
4. How to handle the trial-to-paid conversion UX (choose tier during signup or at end of trial)?
5. Should enterprise pricing be per-seat or per-organization?
