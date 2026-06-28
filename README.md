# AI Company Simulator

A real-time, multi-agent company simulation. Seven AI employees — CEO, CTO,
Engineer, Product Manager, Sales, Security, and HR — live in a top-down virtual
office. Inject a crisis and watch them communicate, make decisions, move around,
and shift the company's health.

Built for a hackathon: **Next.js 16 · AI SDK 7 · Cerebras Gemma 4 31B · Phaser 4
· Zustand · Tailwind v4**.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

It runs **out of the box with no API key** — "Mock" mode is on by default and
uses a deterministic decision engine. Click **Start**, then inject an event
(e.g. _"Customer discovered a security breach"_) and watch the office react.

### Using the real model (Gemma 4 31B)

```bash
cp .env.local.example .env.local   # then paste your Cerebras key
```

Uncheck **Mock** in the header. Each tick, every agent's state is sent to Gemma
4 31B (via the Cerebras provider) which returns a structured action.

## How it works

Every simulation tick (2.5s), each agent:

1. **Observes** — company health, recent events, and messages addressed to it.
2. **Reasons** — mock engine, or Gemma 4 31B with constrained-decoding JSON.
3. **Returns a structured action**:
   ```ts
   { action, target_agent, message, emotion, reasoning }
   // action ∈ message_agent | move | create_task | update_state | call_meeting
   ```
4. **The engine executes it** — `applyAction` updates agents, messages, and the
   five company-health metrics (revenue, security, morale, runway, customer trust).

Nothing is hard-scripted: a security breach makes Security escalate to the CTO,
who walks to the Engineer, while the CEO calls a meeting and Sales reassures
customers — an emergent chain.

## Project structure

```
app/
  page.tsx                   # renders the Dashboard
  api/agents/decide/route.ts # agent state -> Gemma -> structured action
  api/events/route.ts        # crisis event templates
  api/chat/route.ts          # direct message to one agent
components/                  # Dashboard, OfficeCanvas, AgentSidebar, CompanyHealth, EventPanel, ChatPanel
hooks/useSimulationLoop.ts   # setInterval tick driver
store/simStore.ts            # Zustand state + tick logic (mock or API)
lib/
  ai/model.ts                # cerebras("gemma-4-31b") — the only model
  sim/                       # types, seed agents, events, mockEngine, applyAction, decide, ui helpers
phaser/
  OfficeScene.ts             # top-down office rendering (isolated from AI logic)
  PhaserGame.tsx             # bridge: store -> scene (client-only)
```

**Phaser is isolated from AI logic.** The scene only receives a minimal
`AgentView` (id, name, location, mood, speech) from the store via `PhaserGame`;
it never imports simulation or model code.

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npx oxlint       # lint
npx oxfmt        # format
```
