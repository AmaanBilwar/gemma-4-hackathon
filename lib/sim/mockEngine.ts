import type { AgentAction, DecisionContext, Role } from "@/lib/sim/types";

/**
 * Deterministic, zero-cost decision engine used when mock mode is on (no API
 * key needed). It produces sensible, role-based reactions so the simulation
 * still shows an emergent-looking chain of communication for a demo.
 */
export function mockDecide(ctx: DecisionContext): AgentAction {
  const { agent, inbox, recentEvents } = ctx;
  const latestEvent = recentEvents[recentEvents.length - 1];
  const incoming = inbox[inbox.length - 1];

  // If someone messaged this agent, react to them first.
  if (incoming) {
    const reply = ROLE_REPLIES[agent.role];
    return {
      action: reply.action,
      target_agent: reply.target ?? incoming.from,
      message: reply.message,
      emotion: reply.emotion,
      reasoning: `Responding to ${incoming.from} about "${incoming.text}".`,
    };
  }

  // Otherwise, react to the most recent crisis event by role.
  if (latestEvent) {
    const kind = inferKind(latestEvent.title);
    const react = ROLE_EVENT_REACTIONS[agent.role][kind];
    if (react) {
      return {
        action: react.action,
        target_agent: react.target ?? "",
        message: react.message,
        emotion: react.emotion,
        reasoning: `Reacting to event: ${latestEvent.title}.`,
      };
    }
  }

  // Idle: keep working at own desk.
  return {
    action: "update_state",
    target_agent: "",
    message: agent.currentTask,
    emotion: "focused",
    reasoning: "Nothing urgent; continuing current work.",
  };
}

type Kind = "security" | "revenue" | "product" | "people" | "finance";

function inferKind(title: string): Kind {
  const t = title.toLowerCase();
  if (t.includes("breach") || t.includes("outage") || t.includes("security")) return "security";
  if (t.includes("deal") || t.includes("revenue") || t.includes("customer")) return "revenue";
  if (t.includes("competitor") || t.includes("product")) return "product";
  if (t.includes("burn") || t.includes("morale") || t.includes("engineer")) return "people";
  return "finance";
}

interface MockReply {
  action: AgentAction["action"];
  target?: string;
  message: string;
  emotion: AgentAction["emotion"];
}

/** Generic reply each role gives when directly messaged. */
const ROLE_REPLIES: Record<Role, MockReply> = {
  CEO: {
    action: "update_state",
    message: "Understood. I'll weigh the business impact.",
    emotion: "focused",
  },
  CTO: {
    action: "message_agent",
    target: "engineer",
    message: "Grace, can you dig into this and patch it fast?",
    emotion: "stressed",
  },
  Engineer: {
    action: "create_task",
    message: "Investigating and shipping a fix.",
    emotion: "focused",
  },
  "Product Manager": {
    action: "update_state",
    message: "Noting the customer impact for the roadmap.",
    emotion: "worried",
  },
  Sales: {
    action: "create_task",
    message: "Reassuring the affected customers personally.",
    emotion: "neutral",
  },
  Security: {
    action: "message_agent",
    target: "cto",
    message: "Linus, I'm escalating this — we need eng on it now.",
    emotion: "stressed",
  },
  HR: {
    action: "update_state",
    message: "Watching team stress levels during the incident.",
    emotion: "worried",
  },
};

/** Role x event-kind reaction table that drives the emergent chain. */
const ROLE_EVENT_REACTIONS: Record<Role, Partial<Record<Kind, MockReply>>> = {
  Security: {
    security: {
      action: "message_agent",
      target: "cto",
      message: "We have an incident — escalating to engineering now.",
      emotion: "stressed",
    },
  },
  CTO: {
    security: {
      action: "move",
      target: "engineer",
      message: "Heading to Grace's desk to triage.",
      emotion: "stressed",
    },
    product: {
      action: "update_state",
      target: "",
      message: "Assessing our technical differentiation.",
      emotion: "focused",
    },
  },
  Engineer: {
    security: {
      action: "create_task",
      target: "",
      message: "Patching the vulnerability and adding monitoring.",
      emotion: "focused",
    },
  },
  CEO: {
    security: {
      action: "call_meeting",
      target: "",
      message: "All-hands: let's contain this and protect customers.",
      emotion: "worried",
    },
    finance: {
      action: "update_state",
      target: "",
      message: "Preparing the investor update on runway.",
      emotion: "focused",
    },
    revenue: {
      action: "message_agent",
      target: "sales",
      message: "Nia, let's get this deal across the line.",
      emotion: "happy",
    },
  },
  Sales: {
    security: {
      action: "message_agent",
      target: "pm",
      message: "Customers are nervous — what can I tell them?",
      emotion: "worried",
    },
    revenue: {
      action: "create_task",
      target: "",
      message: "Closing the enterprise deal.",
      emotion: "happy",
    },
    product: {
      action: "update_state",
      target: "",
      message: "Sharpening our pitch against the competitor.",
      emotion: "neutral",
    },
  },
  "Product Manager": {
    security: {
      action: "message_agent",
      target: "sales",
      message: "Here's the customer comms plan for the incident.",
      emotion: "focused",
    },
    product: {
      action: "create_task",
      target: "",
      message: "Reprioritizing the roadmap to respond.",
      emotion: "focused",
    },
  },
  HR: {
    people: {
      action: "create_task",
      target: "",
      message: "Setting up support and rebalancing workload.",
      emotion: "worried",
    },
    security: {
      action: "update_state",
      target: "",
      message: "Keeping an eye on team stress during the crisis.",
      emotion: "worried",
    },
  },
};
