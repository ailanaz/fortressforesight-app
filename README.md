# FortressForesight

**A home readiness, records, and recovery support platform for homebuyers and homeowners.**

FortressForesight helps people protect what protects them by combining risk awareness, secure home recordkeeping, disaster preparation, and guided recovery support in one place.

---

## Who It's For

**Homebuyers** - "What should I know about this property before I buy it?"

**Homeowners** - "How do I stay organized and lower my risk?"

**Homeowners in crisis** - "What do I do right now, and how do I keep track of everything?"

---

## The Four Pillars

**Risk** - Understand flood zones, storm exposure, wildfire risk, maintenance risk, and insurance exposure before problems arise.

**Records** - Store policies, inspections, receipts, photos, warranties, contacts, and home details in one secure place.

**Readiness** - Checklists, reminders, mitigation guidance, and planning support to reduce risk over time.

**Recovery** - Document damage, track expenses, prepare for adjusters, manage claims, and organize repairs from start to finish.

A fifth layer runs through everything: **Support** - plain-language explanations so users feel less overwhelmed at every stage.

---

## The Promise

> FortressForesight gives homeowners clarity before disaster, structure during crisis, and confidence through recovery.

*Clarity before disaster. Structure during crisis. Confidence through recovery.*

---

## App Structure

1. **Property Profile** - Address or ZIP code lookup, flood zone info, wildfire risk, storm risk, and a risk scorecard
2. **Document Storage** - Upload and organize photos of policies, receipts, inspections, and warranties
3. **Readiness Center** - Premade and custom checklists for buying a home, seasonal maintenance, and post-storm prep
4. **Recovery Tracker** - Room-by-room damage log, expense tracking, claim status, and adjuster prep guides
5. **Knowledge Base** - Plain-language articles on deductibles, RCV vs ACV, flood insurance, public adjusters, and more

Also includes **Emergency Contacts** and a **Login** flow scaffold.

---

## Tech Stack

- React with Vite
- React Router
- Firebase-ready environment setup
- GitHub Pages deployment via GitHub Actions

## Planned Integrations

- Firebase Authentication, Firestore, and Cloud Storage
- FEMA flood map data/services
- NOAA weather and storm data
- Google Maps / geocoding
- Google Play subscription billing through an Android wrapper app

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you want to use locally.

Never commit `.env`.

Google Play upgrade configuration:

- `VITE_PLAY_APP_PACKAGE`
- `VITE_PLAY_STORE_URL`

## Deployment

- Repo: `ailanaz/fortressforesight-app`
- Custom domain: `fortressforesight.app`
- Hosting: GitHub Pages via GitHub Actions

## Status

Initial scaffold and full interface restore, in development.
