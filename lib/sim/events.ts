import type { CompanyHealth } from "@/lib/sim/types";

export interface EventTemplate {
  title: string;
  description: string;
  effects: Partial<CompanyHealth>;
  /** Keyword used by the mock engine to route role reactions. */
  kind: "security" | "revenue" | "product" | "people" | "finance";
}

/** Crisis/event templates the user can inject (or that fire randomly). */
export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    title: "Customer discovered a security breach",
    description: "A customer reports that their data may have been exposed in a breach.",
    effects: { security: -30, customerTrust: -20 },
    kind: "security",
  },
  {
    title: "Major competitor launched a rival product",
    description: "A well-funded competitor just shipped a similar product.",
    effects: { revenue: -10, customerTrust: -8 },
    kind: "product",
  },
  {
    title: "Enterprise deal on the verge of closing",
    description: "A large enterprise customer is ready to sign a big contract.",
    effects: { revenue: 15 },
    kind: "revenue",
  },
  {
    title: "Production outage in the main service",
    description: "The core service is down and customers are affected.",
    effects: { security: -8, customerTrust: -12, morale: -5 },
    kind: "security",
  },
  {
    title: "Key engineer is burning out",
    description: "Morale signals suggest the team is overworked.",
    effects: { morale: -15 },
    kind: "people",
  },
  {
    title: "Investor asks for an emergency update",
    description: "A lead investor wants a status update on runway and growth.",
    effects: { runway: -5 },
    kind: "finance",
  },
];

export function randomEventTemplate(seed: number): EventTemplate {
  const index = Math.abs(Math.floor(seed)) % EVENT_TEMPLATES.length;
  return EVENT_TEMPLATES[index];
}
