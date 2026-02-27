# Post-Implementation Testing Procedure (Step-by-Step)

## 1. Code Quality Consistency Review
*   **Check naming:** All new functions, variables, and files must follow naming conventions (PascalCase for components, camelCase for utilities, etc.).
*   **Error handling:** Every async function must have try/catch. Decide if fail-open or fail-closed is intentional. Log errors with `console.error()` or `logger.error()`.
*   **Comments:** Every new block must have a comment explaining what it does and why (`// [ARIA] ...`).
*   **Code Change Policy:** Never delete code. Comment out old code with an explanation, add new code below with a comment.
*   **Dead code:** Remove or comment out any leftover references to replaced functions, models, or variables.
*   **Consistency:** New code must match the style, indentation, and patterns of surrounding code.
*   **DRY principle:** Extract and reuse duplicated logic.
*   **Magic numbers:** Move hardcoded values to constants or config files.
*   **Logging:** All important operations must be logged at appropriate levels.
*   **Types:** All TypeScript params and returns must be properly typed. Avoid `any` unless justified.

## 2. Cross-File Impact Analysis
*   **Trace dependencies:** For every change, check what else in the codebase depends on it (models, API shape, Redis channels, props, CSS, env vars, ports).
*   **Update all consumers:** If an API response shape changes, update every component, loader, and fallback object that consumes it.
*   **Check imports and references:** Update all files importing or referencing changed models, functions, or variables.

## 3. UI Consistency Audit (for frontend features)
*   **Card styling:** Must use standard app theme (rounded-xl, surface colors, borders).
*   **Text sizes:** Data: text-[10px]–text-xs, Labels: text-sm, Headings: text-lg/text-xl (Mapped to FONTS constant).
*   **Spacing:** Cards: p-3/p-4, Grids: gap-3/gap-4 (Mapped to SPACING constant).
*   **Colors:** Use only palette colors from `theme.ts` (COLORS).
*   **Empty states:** Show skeleton shimmer or "No data" message, never blank screens.
*   **Responsive:** Must work well on standard phone sizes and tablets.
*   **Component reuse:** Use existing components before creating new ones.

## 4. Edge Case Analysis
*   **Data edge cases:** Test with 0 records, large datasets, missing fields, malformed input.
*   **Network edge cases:** Test with Firebase disconnected, offline states, timeouts.
*   **Security edge cases:** Test for proper role restrictions, data exposure.

## 5. Confidence Score Assignment
After all checks, assign a confidence score (0-100):
*   Code Quality: 0-25
*   Cross-File Impact: 0-25
*   UI Consistency: 0-20
*   Edge Case Coverage: 0-20
*   Test Readiness: 0-10

**Verdict:**
*   SHIP IT (90+)
*   REVIEW NEEDED (70-89)
*   REWORK (below 70)

## 6. Comprehensive Testing Checklist
*   **Syntax check:** TypeScript compilation checks.
*   **Dev server:** `npx expo start` runs without errors.
*   **Manual UI checks:**
    *   All pages load without blank screens.
    *   Data tables/lists paginate correctly.
    *   Filters work.
    *   Detail modals open/close.
    *   Empty states render properly.

## 7. Review Personas
*   **Security Architect:** Checks threat model, input validation, auth boundaries, data exposure.
*   **UX Designer:** Checks visual consistency, loading states, error messages, accessibility.
*   **QA Engineer:** Checks edge cases, error paths, boundary conditions, regression.
