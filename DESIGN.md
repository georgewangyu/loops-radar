---
version: "alpha"
name: "Loops Radar"
description: "Public recurring-agent-loop catalog using George Design Language research-desk mode."
mode: "research-desk"
source: "../george-design-language/modes/research-desk.DESIGN.md"
colors:
  primary: "#1457FF"
  ink: "#141414"
  muted: "#64615A"
  page: "#E9E4DC"
  paper: "#FBFAF6"
  surface: "#FFFFFF"
  line: "#D7D0C1"
  green: "#176E45"
  signal: "#D7FF55"
---

# Loops Radar Design Contract

Loops Radar should feel like an operating desk for repeatable agent loops:
bounded, inspectable, and useful enough to run again.

## First Screen

The first viewport should show:

- what a loop is and why it is useful
- recommended loop or daily outlook
- catalog search/filter access
- contribution/install affordances

## Layout

- Loop entries should foreground trigger, cadence, inputs, workflow, output,
  guardrails, and verifier.
- The catalog should reward comparison and reuse, not vague automation hype.
- Detail pages should make source markdown easy to copy.

## Typography And Color

- Use George Research Desk tokens as the baseline.
- Blue is the primary action/accent color.
- Signal yellow-green is reserved for small emphasis, not backgrounds.

## Do

- Keep verifiers visible.
- Make report-only and approval-gated boundaries obvious.
- Preserve source repo attribution.

## Do Not

- Make autonomy the visual promise.
- Hide destructive-action guardrails.
- Add decorative automation imagery.
- Let cards nest inside other cards.
