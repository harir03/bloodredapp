# BloodRed App - Global Rules & Workflow

## 1. Workflow Orchestration
### Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, **STOP and re-plan immediately** — don't keep pushing.
- Use plan mode for verification steps, not just building.
- Write detailed specs upfront to reduce ambiguity.

### Subagent Strategy
- Use subagents liberally to keep main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- One task per subagent for focused execution.

### Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` (if exists) or document the pattern.
- Review lessons at session start for relevant project.

### Verification Before Done
- Never mark a task complete without proving it works.
- Run tests, check logs, demonstrate correctness.
- Ask: "Would a staff engineer approve this?"

### Demand Elegance (Balanced)
- For non-trivial changes: pause and ask “is there a more elegant way?”
- If a fix feels hacky: “Knowing everything I know now, implement the elegant solution.”

## 2. Task Management
- **Plan First:** Write plan to `tasks/todo.md` with checkable items.
- **Verify Plan:** Check in before starting implementation.
- **Track Progress:** Mark items complete as you go.
- **Explain Changes:** High-level summary at each step.
- **Document Results:** Add review section to `tasks/todo.md`.

## 3. Core Principles
- **Simplicity First:** Make every change as simple as possible. Impact minimal code.
- **No Laziness:** Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact:** Changes should only touch what's necessary. Avoid introducing bugs.

## 4. Post-Implementation Review & Quality Gate
- **Code Quality Consistency Review:** Naming, error handling, comments, code change policy, dead code, consistency, DRY, magic numbers, logging, types.
- **Cross-File Impact Analysis:** Always check what else depends on your change (models, API shape, Redis channels, props, CSS, env vars, ports).
- **UI Consistency Audit:** Card styling, text sizes, spacing, colors, empty states, responsive, component reuse, cn() usage, "use client", force-dynamic.
- **Edge Case Analysis:** Data (empty, large, missing fields, malformed input), network (Firebase down, timeouts), security (role gating).
- **Confidence Score:** Assign a score (0-100) after each feature. Ship if 90+.

## 5. AI Agent Common Pitfalls (MANDATORY RULES)
- **Version Consistency:** Never change package versions unless asked.
- **API Response Shape ↔ Consumer Sync:** Always update all consumers when API shape changes.
- **Defensive Data Access:** Always guard with `??` or `?.`.
- **Fresh Rebuilds:** Never copy `node_modules` or `.next/` cache.
- **Working Directory Awareness:** Always check `cwd` before running commands.
