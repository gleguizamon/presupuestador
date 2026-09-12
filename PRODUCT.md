# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Freelancers and independent content creators (designers, developers, social
media managers, consultants) in Latin America who bill and communicate with
clients on their own, without an admin team or accounting software. Spanish
(es-AR) is the working language; ARS is the default currency, with other
LatAm currencies supported.

## Product Purpose

Presupuestapp lets a solo freelancer produce professional client-facing
documents — quotes, service proposals, and (planned) contracts and invoices —
in minutes, export them as PDF, and share them via a link, without creating
an account or paying for software.

## Positioning

No account, no backend: every document lives in the visitor's own browser
(IndexedDB) and share links carry the data encoded in the URL itself, never
on a server. Free, with no subscription tier. Open source (public GitHub
repo, star count shown in the header) — this is a stated commitment, not
incidental.

Distinct from typical single-purpose invoice generators: it treats
"documents a freelancer sends a client" as a family (presupuesto, propuesta
de servicios, and more to come), not one form with a template picker.

## Operating Context

Used solo, at a desk or on the go, to close out a job: agree scope with a
client, then produce the presupuesto/propuesta, download or share it, move
on. No team collaboration, no review workflow — one person, one browser.

## Capabilities and Constraints

- Client-side only. No server ever stores document content; PDF generation
  (`@react-pdf/renderer`) and storage (IndexedDB via `idb`) both run in the
  browser.
- Document kinds today: `presupuesto` (line-item quote) and `propuesta`
  (content-creator service proposal, fixed monthly fee, no line items).
  `contrato` and `factura` are modeled but not yet built.
  New kinds register in `lib/doc/registry.ts`, so the app's chrome must stay
  kind-agnostic rather than hardcoding assumptions from either existing kind.
- A local document library (`/documentos`) lists/duplicates/renames/deletes
  documents; PDF export and read-only/editable share links exist for every
  registered kind.
- Currently light-mode-styled (no dark-mode tokens); the current redesign
  scope is explicitly light mode only.

## Brand Commitments

- Name: **Presupuestapp** (renamed from Presupuestafy, 2026-09-11).
- Public GitHub repo with a star-count button, always visible in the header
  — the open-source commitment must stay visible in whatever chrome
  replaces it.
- Voice: plain, direct Argentine Spanish ("sin vueltas", "sin cuenta, sin
  suscripción") — confident and unfussy, not corporate-formal.

## Evidence on Hand

No customer testimonials, logos, or case studies exist or should be
fabricated. The only "proof" asset today is the live GitHub star count.

## Product Principles

1. Privacy and ownership are structural, not a policy page — no backend
   exists to leak from. The design should keep this legible, not hide it
   behind generic SaaS trust-badge tropes.
2. One person's tool, not a team's — no multi-user chrome, roles, or
   collaboration surface belongs here.
3. Every document kind is a first-class citizen of the same shell; the UI
   framing must not read as "invoices, plus an add-on."
4. Fast to a finished PDF. Every visual decision should shorten, not
   lengthen, the path from blank document to downloaded/shared file.

## Accessibility & Inclusion

No formalized standard confirmed; treat WCAG AA contrast as the working
baseline (not yet a stated product requirement).
