# Hamburg House Hunt — Chrome extension

## Summary
Build a personal Chrome dashboard that opens housing portals, tracks manual login status, and captures listings from supported pages, and filters saved apartment details. Editable initial criteria: Hamburg, at least 2.5 rooms and 70 m², maximum €1,400 monthly rent including heating, and availability from 1 January through 31 May 2027 inclusive. No additional requirements.

Automatic capture runs on supported pages the user visits. Automatic login detection, background searches, and application submission are excluded. Login happens normally in the browser; indicators are manual checks.

## Portal dashboard
Seed 32 unique offer URLs on first installation: the 17 website portals below and 15 Immomio landlords in the following table. Apply the one-time portal migration described below to existing dashboards. Preserve query strings and hash routes. Support adding, renaming, editing, reordering, enabling, and deleting portals. Open all enabled, selected, or individual portals; disable repeat clicks while opening and report individual failures. Each opened portal resets to Not checked; users record Login needed or Ready with timestamps. Keep cooperative entries separate even when they share platforms.

| Name | URL |
| --- | --- |
| ImmoScout24 | https://www.immobilienscout24.de/Suche/de/hamburg/hamburg/wohnung-mieten?haspromotion=false&numberofrooms=2.5-&price=-1400.0&livingspace=70.0-&pricetype=calculatedtotalrent&sorting=2&enteredFrom=filter_removals |
| Immomio | https://tenant.immomio.com/de/landlords |
| EBV Harburg | https://www.ebv-harburg.de/wohnungen/wohnungsangebote/ |
| Gartenstadt Wandsbek | https://www.gartenstadt-wandsbek.de/wohnen/freie-wohnungen/ |
| GGI Hamburg | https://www.ggi-hamburg.de/vermietung/wohnungen |
| Immosolve 2211665 | https://2211665.hpm.immosolve.eu/#!/result-list-2 |
| BVE | https://www.bve.de/wohnen-beim-bve/wohnungsbestand/wohnungsangebote/ |
| dhu | https://dhu.hamburg/wohnen/wohnungsangebote/ |
| Immosolve 2222820 | https://2222820.hpm.immosolve.eu/?startRoute=result-list&objectIdentifier=2#!/result-list-2 |
| BDS Hamburg | https://www.bds-hamburg.de/unser-angebot/interessentenportal-immomio/#c6038 |
| Buchdrucker | https://www.buchdrucker.de/de/wohnungsangebote-stellplatzangebote-gewerbeangebote |
| BGFG | https://www.bgfg.de/wohnen/wohnungsangebote |
| Hamburger Wohnen | https://www.hamburgerwohnen.de/wohnen/wohnungssuche-home.html |
| Hanseatische | https://www.hanseatische.de/de/wohnungsangebote |
| MGF Farmsen | https://www.mgf-farmsen.de/immobiliensuche/aktuelle-angebote-wohnungen/stellplaetze/ |
| KAIFU | https://www.kaifu.de/wohnen/mietangebote/ |
| Wohnungsverein Hamburg von 1902 | https://wv1902.de/wohnungsangebote/ |

MGF's supplied page covers apartments and parking and refers applicants to Immomio. The repeated Reiherstieg URL was removed.

### Immomio landlords

Store `type: 'immomio'` and a UUID `landlordId`. Generate the offer URL as `https://tenant.immomio.com/en/landlords/{landlordId}/search` and the applications URL as `https://tenant.immomio.com/en/landlords/{landlordId}/applications`.

| Landlord | Landlord ID |
| --- | --- |
| Bauverein Reiherstieg eG | `9e3c3277-b667-43b4-96be-bd026126eb4e` |
| Wohnbau GmbH | `6476ded2-426b-5f58-a43e-22b299ceddd9` |
| Walddörfer Wohnungsbaugenossenschaft eG | `e3959407-8f56-4c7d-a056-1fb9a184ce4c` |
| SAGA Siedlungs- Aktiengesellschaft Hamburg | `e2577864-aac3-2ce6-170b-73978804dfe5` |
| Baugenossenschaft Fuhlsbüttel eG | `8b5524a0-2766-4ee6-9ab6-363ff645a982` |
| Hamburg-Rahlstedter Baugenossenschaft eG | `9ef8772e-e464-4aa2-9d84-b290635cdb38` |
| Hamburg Team Property Management GmbH | `f7d54ddd-54ca-66bf-9e54-451564fe3af6` |
| Vereinigte Hamburger Wohnungsbaugenossenschaft eG | `c05d8e95-6891-401a-93da-bfd8d7cf28c4` |
| DVG Immobilien GmbH & Co. KG | `1c02a269-56a7-e338-3693-a1dc6ab96f11` |
| Hamburger Lehrer-Baugenossenschaft eG | `677bd977-7994-25a8-516a-2b1b77e2c228` |
| Schmidt & Bethge Immobilien Vertriebs GmbH | `9285f235-c813-6742-7563-021cd46e02c8` |
| Hildegart Hausmann Immobilien | `d3f9fdef-e0a1-e813-421f-8defd2ed762e` |
| GCV Verwaltungs GmbH | `220afd1c-2227-d7b3-9c0c-54a8d6a715dd` |
| PIPPING Immobilien GmbH & Co. KG | `2f89b925-b214-4ccb-68c0-681b5431cdb7` |
| GCV Verwaltungs GmbH | `32bc12e2-67c7-2595-a414-dd099cd4d71a` |

Show an **Applications** button beside **Open portal** when an applications URL is available. Opening applications preserves the portal's check status. Website portals may also specify an optional applications URL. The portal editor supports selecting Website or Immomio and entering the corresponding URL fields or landlord ID. Validate IDs and URLs on save and backup import.

Keep both GCV entries separate because their landlord IDs differ. Identify captured Immomio offers by landlord ID rather than the shared hostname; continue recognizing original cooperative website domains.

## Apartment shortlist
Manual form: URL, source portal, title, location, rooms, area, monthly rent, heating inclusion, availability, notes. Permit unknown fields. Show Matches, Needs review, or Does not match with reasons. Any confirmed mandatory failure wins; otherwise unknown required information needs review. Heating must be confirmed included. Exact dates compare inclusively; month-only dates and by-arrangement need review. Earlier availability fails unless a confirmed acceptable start date is recorded. Recalculate on edits, sort by match category then newest first. Track Saved, Contacted, Viewing, Archived. Warn for duplicate listing URLs and offer editing; do not merge across portals.

## Implementation
Manifest V3, TypeScript, React, Vite; toolbar opens a dashboard with Portals, Apartments, Settings. Typed search criteria, portal, apartment, and derived result records. Local persistence through chrome.storage.local and only the storage permission. Declarative content scripts and a service worker support local capture. No backend, stored credentials, or external processing. JSON export and validated restore with replacement confirmation. Preserve forms on save failures. Provide unpacked-extension build/install instructions; store publication excluded.

## Acceptance
Verify 31 unique offer URLs and the 15 generated application URLs, route preservation, no duplicate seeds, and persistent edits. Check batch/selected opening, repeat-click prevention, individual failures, manual status resets. Test inclusive numeric/date boundaries, missing heating, ambiguous dates, and known failure precedence. Verify duplicates, criteria recalculation, workflow states, persistence, and backup restoration. Interpret May as ending 31 May 2027.

## User-requested extension: automatic capture (1.1)

The user subsequently requested properties be added automatically while visiting pages. This supersedes the manual-only capture boundary above. Declarative content scripts inspect recognizable visible cards and exposés on the saved portal/provider domains, including matching embedded frames. The dashboard updates through local storage events. A global toggle can stop capture. No automatic navigation, paging, login or application submission is added.

Merge by provider/object identity or URL, preserve manual records and edits, distinguish heating-inclusive rent from cold/unknown amounts, retain ambiguous availability for review, and show capture status. Serialize all extension writes through the service worker to avoid concurrent dashboard/capture data loss. Keep backward compatibility with version 1 backups. Unsupported layouts and authenticated offers without verified markup remain best effort. See PORTAL-IMPORT-RESEARCH.md for provider findings and access restrictions.

## Follow-up fixes and interactions (1.2)

Support the actual modern Immomio iframe's linkless cards, icon-labelled statistics, and separate `/apply/` exposés; merge by external object ID plus street/postcode/city and preserve progress and manual edits. Ignore exposé section links and headings such as Kosten when determining a title. Use the property heading and capture only the visited exposé, not recommendations. Make apartment cards links opening in a new tab while retaining their independent controls. Add removal with persistent import exclusions and a one-step Undo. Keep the active dashboard section after refresh via its URL fragment. Existing version 1 backups remain readable; new optional dismissal keys are included in exports.

## Archive, visited tracking and updated dates (1.3)

Automatically archive definite nonmatches on load/save/capture and criteria changes. Keep unknown/review cases visible. Preserve previous progress for automatically archived entries and restore it if they later qualify; preserve manual archives. Persist visited timestamps when a user opens a card or visits a recognized exposé, and show translucent green backgrounds on visited dashboard cards. Change the earliest start to 1 January 2027 with a one-time migration of the old February default; retain the 31 May 2027 end date and other user preferences. This supersedes the original February start above.

## Completed portal update (22 October 2026)

- Corrected Buchdrucker's offer URL.
- Converted the existing HARABAU, Fuhlsbüttel, Reiherstieg, Walddörfer, and vhw cards to their supplied Immomio landlords; added the remaining ten landlord entries.
- Added Immomio type, landlord ID, generated routes, and the conditional Applications button.
- Added optional `portalRevision: 1` for a one-time migration of existing saved dashboards and older backups. Match existing cards by known offer URL or landlord ID, preserve their IDs, ordering, enabled state and check status, and append new landlords. Keep apartment source references intact. Subsequent loads preserve user edits and deletions without reseeding.
- Rebuilt the unpacked extension in `dist` and the distributable `dist.zip`.

Verification: TypeScript and production build passed; 57 unit tests passed. All nine browser tests passed across the suite and targeted rerun. Tests cover generated routes, both GCV IDs, migration preservation and idempotence, invalid IDs/URLs, applications opening without status reset, and capture from original cooperative pages. Existing browser tests now wait for save/removal completion before reloading. Live authenticated offer/application pages were not tested.
