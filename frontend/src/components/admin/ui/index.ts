/**
 * Barrel export for admin UI primitives.
 *
 * One folder for shared visual building blocks used across management pages.
 * Components here are pure presentational — no domain logic, no API calls.
 * Consumers import from `@/components/admin/ui` rather than deep paths.
 *
 * Cohesion rationale: each component here is a small reusable visual primitive
 * (single concern = "present this content with consistent styling"). Grouping them
 * together makes the import surface clear and reduces file count.
 */
export { default as MetricTile } from "./MetricTile";
export { default as AdminPanel } from "./AdminPanel";
export { default as AdminErrorBlock } from "./AdminErrorBlock";
export { default as StatusPill } from "./StatusPill";
export { default as EmptyTableState } from "./EmptyTableState";
