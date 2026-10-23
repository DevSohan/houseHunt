# Hamburg House Hunt

A local Chrome extension with automatic capture of recognizable apartment listings on supported pages you visit. Includes 21 saved portals, login checklists, apartment matching, progress tracking, and JSON backups. The initial specification and exact portal URLs are in [PLAN.md](PLAN.md); automatic capture extends that initial manual-only version.

## Install in Chrome

1. Run `npm install` and `npm run build` in this folder.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked**, then select this project's `dist` folder.
4. Pin **Hamburg House Hunt** and click its toolbar icon to open the dashboard.

After code changes, rebuild, click Reload on the extension card, and refresh the dashboard. Export a backup before removing the extension or switching Chrome profiles.

### Upgrade to version 1.3

Reload the extension in `chrome://extensions`, accept Chrome's site-access prompt if shown, then refresh both the dashboard and any already-open portal tabs. Existing saved data is preserved. The dashboard toggle enables/disables capture globally (enabled by default). Chrome must allow the extension access to the supported sites for automatic capture to run.

Visit a results page or an individual exposé and let its content load. Recognizable listings appear automatically in Apartments and the toolbar badge shows the latest detected count for that tab. Embedded provider frames are supported when Chrome grants access to their domains. Sign in and handle consent screens normally. A capture-status line explains when no readable listing was found; opening an individual exposé may help.

The importer recognizes linked listing cards, detail URLs, and the modern Immomio iframe's linkless apartment cards. Immomio cards use icon-labelled room/area fields; parking is excluded. Opening an Immomio `/apply/…` exposé enriches the existing card using its external object ID and address, including whole/half rooms and rent breakdown. Public HARABAU cards and its exposé have been inspected and covered by regression fixtures; private account layouts and legacy Immomio modules remain unverified.

It does not navigate, scroll, paginate, submit forms, call listing APIs, or bypass login. Unsupported layouts and incomplete offers may not import. Provider layouts change; support is best effort, not guaranteed for all 21 portals. Linkless cards initially link back to the cooperative's offer page; once you visit the exposé, that same record gains its direct listing link. List-only rent amounts remain under review until heating inclusion is confirmed in the detail page or by you.

Cold rent and ambiguous totals stay flagged for review. Exact German dates are converted; other availability text stays for manual review. Repeat visits update captured records without duplicating them, while manual edits to an imported record freeze its extracted fields. Notes and progress are preserved. Manual records are not overwritten. Never-seen or expired listings are not automatically removed.

Exposé capture uses the property heading and ignores section self-links such as `#kosten` and recommended properties. Revisiting an exposé repairs an automatically captured "Kosten" title while preserving notes and progress. If you manually edited the record, its title remains protected and can be corrected through Edit details.

Apartment cards open the source in a new tab when clicked; progress, View listing, and Edit details remain independent controls. **Remove property** removes the record and prevents automatic re-import; **Undo remove** restores the most recently removed record while the dashboard remains open. Removal exclusions persist in backups. Refreshing the dashboard keeps the current section through its URL fragment (`#apartments`, `#portals`, or `#settings`).

Properties with a definite **Does not match** result are automatically archived when loaded, saved, captured, or re-evaluated after a criteria change. Use **Include archived** to see them. Needs review entries stay visible. If an automatically archived entry later qualifies, its previous progress is restored; manually archived entries stay archived.

Opening a card or View listing marks it visited. Recognized exposé visits also update the record automatically. Visited dashboard cards use a translucent green background and an Opened timestamp; this survives refresh and backup restoration. Merely capturing a results card does not mark it visited.

Version 1.3 changes the earliest start date to **1 January 2027**, keeping the latest date at **31 May 2027**. The old February default in existing data is migrated once; other customized dates and later edits are preserved.

## Use

- **Immomio:** choose the Immomio portal type and enter a landlord ID to generate offer and application links. Applications opens beside Open portal without resetting check status. Website portals can also have an optional applications URL. Existing dashboards receive the Buchdrucker URL correction and supplied landlord updates once; both GCV landlord IDs remain separate.
- **Portals:** open all enabled portals, a selection, or a single portal. Log in on each website as normal. Mark status manually; opening a portal resets its check status. Edit portal URLs if your saved searches change.
- **Apartments:** manually enter listing details. Missing information is allowed and marked for review. Record the total rent including heating and choose Included only once confirmed. Availability accepts an exact `YYYY-MM-DD` date or text such as `by arrangement`; only exact dates can automatically match.
- **Settings:** edit criteria and export/restore JSON backups. Restore validates the file and asks before replacing data. Changed criteria recalculate your shortlist; they do not rewrite external search URLs.

Initial criteria: Hamburg, 2.5+ rooms, 70+ m², at most €1,400 including heating, 1 January–31 May 2027 inclusive. Apartments available earlier are outside this chosen window unless you record a confirmed start within it.

Everything stays in this Chrome profile. The extension uses `storage` plus declarative content scripts on the saved portal domains and their Immomio, Immosolve and Wohnungshelden providers. It reads rendered listing text on visited pages, but does not read passwords, cookies or application documents. Opening a tab only reports browser creation, not successful website loading. Login checklist indicators remain manual notes. Automatic page reading remains subject to the provider restrictions described in [PORTAL-IMPORT-RESEARCH.md](PORTAL-IMPORT-RESEARCH.md); using an extension is not a blanket exemption.

## Development and verification

`npm run dev` provides a browser preview using localStorage, separate from extension data. Automatic capture and portal batch opening require the installed extension. `npm test` checks matching, import parsing/merging, backup validation, and storage comparison; `npm run build` runs TypeScript checks and creates the unpacked extension. Run the build before `npm run test:e2e`: the capture test exercises the built content script and service worker against fixture pages with simulated Chrome APIs. Browser tests use installed Google Chrome; they do not verify live account login flows.

Manual Chrome acceptance checks:

- Open all 31 portals; confirm both Immosolve routes retain their query/hash. Disable a portal and check Open all skips it. Select it explicitly and verify Open selected still opens it.
- Change statuses, reorder/edit portals, add an apartment, restart Chrome, and verify persistence. Opening portals resets only their statuses. Remove all portals and verify they stay removed after reload.
- Enter matching and incomplete apartments; change criteria and verify categories update. Try saving a duplicate listing URL and open the existing entry when prompted.
- Export a backup, change data, restore with confirmation, and verify the export is recovered. A malformed backup must leave existing data intact.
- Keep two dashboard tabs open; save in one, then save in the stale tab. The stale save must show a conflict instead of overwriting newer data; unsaved form contents remain available to copy before reloading.
