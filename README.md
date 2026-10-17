# RAWIT

RAWIT is an offline-first personal WiFi subscription manager built with Expo and React Native. It helps track subscribers, WiFi networks, subscription periods, payments, upcoming expirations, and local reminders.

## Project documents

- [Project description](docs/project-description.md): product goals, supported behavior, and scope.
- [Implementation plan](docs/implementation-plan.md): current delivery checklist and completed milestones.
- [Agent guide](AGENTS.md): repository rules for implementation and maintenance.

## Development

Use the package manager represented by `pnpm-lock.yaml`:

```sh
pnpm install
pnpm start
```

Available checks:

```sh
pnpm lint
pnpm typecheck
```

Expo Router routes are currently in `src/app/`. Start the project with `pnpm start`, then use the Expo CLI options for the intended development build or platform. Native features such as notifications must be checked in an installed build; Expo Go may not match.

## Scope

The app stores core records locally with SQLite and is designed to work without internet access. It does not connect to a backend, discover WiFi clients, or control routers. See the project description for product rules and the implementation plan for delivery status.
