import Phaser from "phaser";

/**
 * Minimal view of an agent the scene needs to render. Intentionally decoupled
 * from the simulation/AI types so Phaser stays isolated from AI logic.
 */
export interface AgentView {
  id: string;
  name: string;
  location: string; // an agent id (a desk) or "meeting"
  mood: string;
  speech: string;
}

export const OFFICE_WIDTH = 840;
export const OFFICE_HEIGHT = 540;

const DESKS: Record<string, { x: number; y: number; label: string }> = {
  ceo: { x: 130, y: 110, label: "CEO" },
  cto: { x: 340, y: 110, label: "CTO" },
  engineer: { x: 550, y: 110, label: "Engineer" },
  security: { x: 740, y: 110, label: "Security" },
  pm: { x: 130, y: 300, label: "Product" },
  sales: { x: 340, y: 300, label: "Sales" },
  hr: { x: 550, y: 300, label: "HR" },
};

const MEETING = { x: 470, y: 460 };

const MOOD_COLORS: Record<string, number> = {
  happy: 0x34d399,
  neutral: 0x94a3b8,
  focused: 0x60a5fa,
  stressed: 0xf59e0b,
  worried: 0xa78bfa,
  angry: 0xf87171,
};

interface SpriteRef {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  speech: Phaser.GameObjects.Text;
  target: { x: number; y: number };
}

export class OfficeScene extends Phaser.Scene {
  private sprites = new Map<string, SpriteRef>();
  private views: AgentView[] = [];
  private ready = false;

  constructor() {
    super("office");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0f172a");

    for (const [, d] of Object.entries(DESKS)) {
      this.add.rectangle(d.x, d.y + 30, 96, 52, 0x1e293b).setStrokeStyle(1, 0x334155);
      this.add
        .text(d.x, d.y + 58, d.label, { fontSize: "11px", color: "#64748b" })
        .setOrigin(0.5, 0);
    }

    this.add.rectangle(MEETING.x, MEETING.y, 280, 96, 0x172554).setStrokeStyle(1, 0x1d4ed8);
    this.add
      .text(MEETING.x, MEETING.y - 62, "Meeting Room", {
        fontSize: "12px",
        color: "#93c5fd",
      })
      .setOrigin(0.5, 0);

    this.ready = true;
    this.renderViews();
  }

  /** Bridge entry point: called from React whenever store agents change. */
  setAgents(views: AgentView[]) {
    this.views = views;
    if (this.ready) this.renderViews();
  }

  private renderViews() {
    const attendees = this.views.filter((v) => v.location === "meeting").map((v) => v.id);

    for (const view of this.views) {
      const sprite = this.ensureSprite(view);
      sprite.body.setFillStyle(MOOD_COLORS[view.mood] ?? 0x94a3b8);
      sprite.speech.setText(view.speech).setVisible(view.speech.length > 0);
      sprite.target = this.targetFor(view, attendees);
    }
  }

  private ensureSprite(view: AgentView): SpriteRef {
    const existing = this.sprites.get(view.id);
    if (existing) return existing;

    const start = DESKS[view.id] ?? MEETING;
    const body = this.add.circle(0, 0, 15, 0x94a3b8);
    const name = this.add
      .text(0, 20, view.name, { fontSize: "11px", color: "#e2e8f0" })
      .setOrigin(0.5, 0);
    const speech = this.add
      .text(0, -42, "", {
        fontSize: "11px",
        color: "#0f172a",
        backgroundColor: "#ffffff",
        padding: { x: 6, y: 4 },
        wordWrap: { width: 150 },
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setVisible(false);

    const container = this.add.container(start.x, start.y, [body, name, speech]);
    const ref: SpriteRef = {
      container,
      body,
      speech,
      target: { x: start.x, y: start.y },
    };
    this.sprites.set(view.id, ref);
    return ref;
  }

  private targetFor(view: AgentView, attendees: string[]): { x: number; y: number } {
    if (view.location === "meeting") {
      const i = attendees.indexOf(view.id);
      const n = Math.max(attendees.length, 1);
      const spread = 200;
      return {
        x: MEETING.x - spread / 2 + (spread * i) / Math.max(n - 1, 1),
        y: MEETING.y,
      };
    }
    const desk = DESKS[view.location] ?? DESKS[view.id] ?? MEETING;
    const visiting = view.location !== view.id;
    return { x: desk.x + (visiting ? 34 : 0), y: desk.y + (visiting ? -8 : 0) };
  }

  update() {
    for (const sprite of this.sprites.values()) {
      sprite.container.x += (sprite.target.x - sprite.container.x) * 0.08;
      sprite.container.y += (sprite.target.y - sprite.container.y) * 0.08;
    }
  }
}
