# spegulo

> **Concept stage.** `spegulo` has no release, no installable artifact,
> and no working deployment yet. Everything below describes what the
> project aims to become, not what exists today.

`spegulo` aims to be an Infrastructure-as-Code (IaC) project that
provisions [OpenClaw](https://github.com/openclaw/openclaw) -- an
MIT-licensed, self-hosted personal AI assistant -- as a personal
knowledge AI onto a target environment. The knowledge volume it
operates over is intended to be injected at deployment time, from
outside this repository, so this repository itself can stay public.

## What is undecided

The target deployment environment is still an open question. The
candidates under consideration are a local machine, a virtual machine,
and cloud IaaS, but which of these `spegulo` should support first has
not been decided. See [docs/requirements.md](docs/requirements.md) for
the full requirements and open questions, and
[docs/deployment-options.md](docs/deployment-options.md) for the
environment comparison feeding that decision.

## Where to read more

- [docs/requirements.md](docs/requirements.md) -- product requirements
  and open questions
- [docs/deployment-options.md](docs/deployment-options.md) --
  candidate deployment environment comparison
- [CONTRIBUTING.md](.github/CONTRIBUTING.md) -- how to contribute to
  this repository

## Development

The commands below are real today, even though the product they will
eventually provision is not.

### Requirements

- Node.js: any of the following versions
  - Jod LTS (`^22.23.2`)
  - Krypton LTS (`^24.2.0`)
  - Latest (`>=26.0.0`)

### Install the dependencies

```sh
corepack enable
pnpm install
```

### Linting

```sh
pnpm run lint
pnpm run lint:fix # Lint and auto-fix
```

### Testing

```sh
pnpm run test
```

Currently, this command works as an alias for the `pnpm run lint`
command.

### Cleaning

```sh
pnpm run clean
```

## License

[MIT](./LICENSE)
