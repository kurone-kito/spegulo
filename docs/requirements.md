# Requirements

> **Status: intended product, no implementation yet.** This document
> describes what `spegulo` is meant to become. As of this writing,
> nothing described below is built, deployed, or available. If you
> arrived here from a search engine or a link expecting a working
> product, there isn't one yet -- this is the first requirements pass
> over a product that does not exist yet.

## Purpose and scope

`spegulo` is an Infrastructure-as-Code (IaC) project that provisions
[OpenClaw](https://github.com/openclaw/openclaw) -- an MIT-licensed,
self-hosted personal AI assistant -- onto a target environment.

The scope boundary is explicit: `spegulo` is the provisioning layer.
OpenClaw itself is upstream software this project deploys and
configures; `spegulo` does not fork or modify OpenClaw's own code.

## Primary use case

A single-operator personal knowledge AI: one operator provisions and
runs their own OpenClaw instance as a private assistant over their own
knowledge, rather than a shared or multi-user service.

## Target environments

The project intends to support the following candidate environment
classes:

- Local machine
- Virtual machine
- Cloud IaaS

These are recorded as candidates, not a decision. Selecting among them
is a separate, currently open question -- see
[Open questions](#open-questions) below and tracks
[#4](https://github.com/kurone-kito/spegulo/issues/4) and
[#7](https://github.com/kurone-kito/spegulo/issues/7) in the parent
roadmap.

## Knowledge-volume injection

The knowledge content an OpenClaw deployment operates over is supplied
at deployment time, from outside this repository -- it is never
committed here.

This has a direct, public-repository consequence: because `spegulo` is
a public repository, no knowledge content, secret, credential, or
personal data may be committed to it, under any circumstances. Anyone
provisioning their own instance supplies their own knowledge volume
and credentials externally, at deploy time.

## Non-functional requirements

At minimum, the provisioning process must satisfy:

- **Reproducibility.** Provisioning the same configuration twice
  produces an equivalent deployment.
- **Portability.** The provisioning approach works across the
  candidate target-environment classes listed above, rather than
  being written against exactly one of them.
- **Recoverability.** When a deployment is re-created (for example
  after a host is rebuilt or replaced), the operator has a documented
  path to get back to a working state without relying on data that
  only existed on the destroyed host.

## Out of scope

- Multi-tenant operation. `spegulo` targets a single operator per
  deployment, not a shared or hosted service for multiple users.
- Modifying OpenClaw itself. `spegulo` provisions and configures the
  upstream project; it does not maintain a fork or carry patches
  against OpenClaw's own source.

## Open questions

Decisions that are genuinely unresolved, recorded here rather than
guessed at:

- **Target deployment environment.** Which of the candidate
  environment classes above `spegulo` should actually support first is
  undecided. Docker is the maintainer's preferred shape, but GPU
  access from inside a container is the reported difficulty, so the
  choice stays open until that constraint is resolved. Tracked in
  roadmap [#1](https://github.com/kurone-kito/spegulo/issues/1),
  compared in [#4](https://github.com/kurone-kito/spegulo/issues/4),
  and decided in
  [#7](https://github.com/kurone-kito/spegulo/issues/7).
