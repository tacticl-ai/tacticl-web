# Device Registration Deduplication

**Date**: 2026-03-15
**Status**: Approved

## Problem

Anonymous and authenticated device registration in Cidadel creates a new full document (120+ fields) every time a device hits the registration endpoint, even if the device has been seen before. This causes massive data duplication in Firestore — the same canvas fingerprint, WebGL data, fonts, codecs, etc. stored repeatedly.

## Solution

Deduplicate device registration by recognizing returning devices via `visitorId` (FingerprintJS) and only recording what changed.

### Data Model

**Device document** (`/devices/{deviceId}` or `/users/{userId}/devices/{deviceId}`):
- Always reflects the **current** state of the device (all 120+ fields)
- Add `lastSeen` (timestamp), `firstSeen` (timestamp), `visitCount` (integer)
- On repeat visit: update `lastSeen`, increment `visitCount`, diff & update only changed fields

**Visits subcollection** (`/devices/{deviceId}/visits/{visitId}`):
- Lightweight per-visit record
- Fields: `visitedAt`, `ip`, `changes` (map of field diffs, e.g. `{ browserVersion: "124 → 126" }`)
- If nothing changed on the device, the visit is just a timestamp + IP

### Registration Flow

```
Device hits registration endpoint
  → Collect fingerprint, get visitorId
  → Query: does device with this visitorId exist?
    → YES:
        1. Diff incoming device info against stored device info
        2. Update device doc with any changed fields + lastSeen + visitCount++
        3. Create visit doc in subcollection with timestamp + changed fields
    → NO:
        1. Create full device doc with all fields
        2. Set firstSeen = lastSeen = now, visitCount = 1
        3. Create first visit doc in subcollection (no changes, just timestamp)
```

### Applies To

- **Anonymous devices**: root `/devices` collection
- **Authenticated devices**: `/users/{userId}/devices` subcollection
- Same logic for both paths

### Boundary Condition

If FingerprintJS returns a **new `visitorId`**, that's a genuinely new device — create a new full record. The `visitorId` is the deduplication key.

## Changes Required

### Backend (cidadel-core)

1. **DeviceIdentity entity** — add `firstSeen`, `visitCount` fields (lastSeen likely exists)
2. **Device registration business logic** — add dedup check: lookup by visitorId before create
3. **Diff logic** — compare incoming fields to stored fields, build changes map
4. **Visit entity** — new model for the visits subcollection
5. **Visit repository** — CRUD for visits subcollection
6. **CreateDeviceRepository** — modify to upsert (update if exists, create if new)

### Frontend (cidadel-web)

- No changes needed — frontend already sends the full device payload. Backend handles dedup.
