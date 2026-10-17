---
name: rawit-app-conventions
description: Guide screen layout, form flows, UX states, reusable UI, and data-access boundaries when adding or changing features in the RAWIT Expo app. Use for RAWIT screen or persistence work; use the Expo design-system skill for broader theme or component-system changes.
---

# RAWIT App Conventions

Make each RAWIT screen easy to understand and consistent across its loading, empty, populated, error, and form states. Choose flows for the user's task first, then implement them with the existing app structure.

## Before changing a screen

- Read the relevant rules in `AGENTS.md` and `docs/project-description.md`.
- Inspect the route, its shared frame, neighboring screens, and existing components before adding a new pattern.
- Trace the user's task from entry point through success, cancellation, and failure. Check whether the controls shown in each state can actually help the user.
- Keep product behavior within RAWIT's offline-first scope and existing Expo architecture.

## Forms and navigation

- Prefer a native bottom sheet for short create or edit forms opened from a list or other focused screen. Follow the existing Expo UI patterns in `SubscriberSheet` and `WifiNetworkSheet`.
- Use a full page when the form is long, has multiple steps, needs substantial supporting context, or is better served by a dedicated route. Keep this an intentional choice rather than sending every form to a new page.
- Make opening, saving, cancelling, and dismissing behavior clear. Preserve entered values when validation fails; show field errors near their fields; prevent accidental dismissal during a consequential operation.
- Keep forms usable with the keyboard, screen readers, and practical touch targets. Give controls clear labels and accessible states.

## Consistent UX states

For every data-backed screen, decide what the user sees while loading, after a load failure, with no records, with records, and when a search/filter returns no matches. Do not let one state accidentally inherit controls that only make sense in another.

- Show one clear primary action for the current state. Do not duplicate the same action in a page-level button and an empty-state action. Choose one location, or show the page-level action only when records exist and put the action in the empty state otherwise.
- When a collection has no records, omit search and filters that cannot return useful results. Show a concise explanation and one way to create the first record.
- When records exist, show search/filter controls only when they help with that collection; keep the add action available once.
- When a search or filter has no matches, retain the control that caused it and offer a clear/reset action. Do not describe this as an empty collection or show a duplicate create action by default.
- Keep loading and failure states distinct from an empty result. Offer one useful retry on failure; do not flash an empty state while data is still loading.
- Keep labels, action placement, and dismissal behavior consistent across related screens. Change the pattern only when the user's task benefits from it.

Before finishing a screen change, ask: Can the user tell what to do next? Are any controls redundant, unavailable, or misleading in this state? Does the screen still make sense when there is no data or an operation fails?

## Reusable components and readable data access

- Reuse existing components and screen patterns before introducing another. Extract a shared component when it represents a clear concept and is used by multiple screens or is clearly about to be reused. Keep its API smaller than its implementation; avoid a general-purpose component with many screen-specific switches.
- Keep route components focused on composing UI, handling screen state, and navigation. Put shared presentation in `src/components/`, reusable interaction behavior in `src/hooks/`, and persistence in `src/lib/database/` following nearby conventions.
- Keep SQL and Expo SQLite details inside the database layer. Screens and reusable UI should call typed domain operations instead of issuing SQL or depending on raw database handles.
- Keep the persistence boundary replaceable by using clear, typed operations and domain-shaped results. Isolate row mapping, query details, and database-specific errors in the data layer. Do not add an abstract storage framework or generic repository layer without a demonstrated need.
- Use parameterized SQL, preserve relationships, and use transactions for related writes. Keep domain rules explicit and separate from presentation and SQL where the current structure supports it.
- Prefer descriptive names, narrow types, deliberate nullable handling, and straightforward functions. Avoid `any`, hidden side effects, duplicate business rules, and abstractions that make the flow harder to trace.

## Styling and review

- Follow the installed NativeWind and existing theme conventions. Reuse spacing, typography, color, and radius tokens; do not introduce a parallel styling system.
- Keep route files under `src/app/` and follow the current folder structure rather than moving files as part of an unrelated feature.
- Review the rendered states and changed flows, not just the default screen. Run the repository's applicable checks and report checks that could not be run, including installed-build behavior when native interactions matter.
