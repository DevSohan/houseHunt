# Property import research

Checked 13 September 2026. This is an investigation, not an implemented importer. The current extension supports manual entry and has only the storage permission.

## Findings and limits

All 21 saved entry URLs were checked or attempted through public web inspection. Five ambiguous/dynamic pages were additionally opened in isolated, logged-out Chrome: Gartenstadt Wandsbek, both numbered Immosolve portals, WV1902, and Immomio. No personal browser session, login credentials, applications, or private APIs were accessed. No listing pagination or bulk extraction was performed. The ImmoScout24 search could not be inspected with the web reader. Empty templates and consent placeholders are not proof of no vacancies.

Eleven cooperative pages use or direct applicants to Immomio. Their integration variants differ: modern homepage.immomio.com frames, a legacy buchdrucker.immomio.de module, and consent-gated content. Three entries use Immosolve, including dhu's older presentation module. No supported export into this extension was identified on the inspected pages. This does not establish that no partner API exists.

## Portal-by-portal results

| Portal / source | Observation | Proposed capture path, not yet implemented |
| --- | --- | --- |
| [ImmoScout24](https://www.immobilienscout24.de/Suche/de/hamburg/hamburg/wohnung-mieten?haspromotion=false&numberofrooms=2.5-&price=-1400.0&livingspace=70.0-&pricetype=calculatedtotalrent&sorting=2&enteredFrom=filter_removals) | Search page unavailable to the web reader; no current listing DOM verified. | Save a listing link with personal notes. Full extraction is subject to the restrictions below; do not claim an adapter is verified. |
| [Immomio](https://tenant.immomio.com/de/landlords) | Isolated Chrome displayed the tenant login screen. The landlords page is an account entry point, not a verified apartment detail page. | User logs in, opens an actual offer, and captures that offer. Private offer layout remains unverified. |
| [EBV Harburg](https://www.ebv-harburg.de/wohnungen/wohnungsangebote/) | Public page embeds homepage.immomio.com. | Open the individual embedded offer; shared modern Immomio adapter would be needed. |
| [Gartenstadt Wandsbek](https://www.gartenstadt-wandsbek.de/wohnen/freie-wohnungen/) | Consent placeholder blocks listing content; provider not established. | User unlocks content normally, then opens an exposé. Until verified, support link/manual-text capture. |
| [Immosolve 2211665](https://2211665.hpm.immosolve.eu/#!/result-list-2) | Rendered title identifies Gemeinnützige Baugenossenschaft Bergedorf-Bille eG. Displayed no properties and a search-request action. | Modern Immosolve adapter when an actual listing is available. Preserve hash routes and object ID. |
| [HARABAU](https://www.harabau.de/wohnen/wohnungsangebote/) | Explicit Immomio workflow and homepage.immomio.com frame. | Modern Immomio offer capture; search-profile registration is also offered. |
| [BVE](https://www.bve.de/wohnen-beim-bve/wohnungsbestand/wohnungsangebote/) | Page states no public offers, separately links a cluster-housing project and housing application. | Capture an actual offer/project detail when available; don't turn the application page into an apartment. |
| [dhu](https://dhu.hamburg/wohnen/wohnungsangebote/) | Links to an older Immosolve presentation at hpm2.immosolve.eu. Its template contains separate cold rent, operating costs, heating, total rent, rooms, area and availability fields. | Dedicated legacy Immosolve adapter; template labels are not real listing values. Native shortlist, search agent and print-view interfaces are present. |
| [Immosolve 2222820](https://2222820.hpm.immosolve.eu/?startRoute=result-list&objectIdentifier=2#!/result-list-2) | Rendered title identifies Altonaer Spar- und Bauverein eG (altoba). Displayed no properties. | Modern Immosolve adapter once a detail page can be verified. Preserve both query and hash. |
| [BDS Hamburg](https://www.bds-hamburg.de/unser-angebot/interessentenportal-immomio/#c6038) | Immomio frame and organization-specific registration/search-profile instructions. | Modern Immomio offer capture. Existing account alone does not establish a completed BDS search registration. |
| [Buchdrucker](https://www.buchdrucker.de/de/wohnungsangebote) | Embeds buchdrucker.immomio.de, a different module. It displayed no offers and labels rent as Kaltmiete. | Legacy Immomio adapter. Never map Kaltmiete to heating-inclusive total rent. |
| [BGFG](https://www.bgfg.de/wohnen/wohnungsangebote) | Immomio frame; explicitly requires registration and a complete search profile. | Modern Immomio offer capture after opening an offer. |
| [Fuhlsbüttel](https://www.bg-fuhlsbuettel.de/index.php?id=22) | Confirmed homepage.immomio.com frame after following its own navigation. | Modern Immomio offer capture. |
| [Hamburger Wohnen](https://www.hamburgerwohnen.de/wohnen/wohnungssuche-home.html) | Explicit Immomio listing-frame link and search registration. | Modern Immomio offer capture. |
| [Reiherstieg](https://www.reiherstieg.de/wohnungsangebote/) | Immomio frame and search profiles with matching offers sent to the applicant's inbox. | Modern Immomio offer capture; provider notifications offer supported discovery. |
| [Hanseatische](https://www.hanseatische.de/de/wohnungsangebote) | Public page explicitly states no free apartments. | Site-specific detail capture when a listing appears; no live detail layout verified. |
| [MGF Farmsen](https://www.mgf-farmsen.de/immobiliensuche/aktuelle-angebote-wohnungen/stellplaetze/) | Apartments and parking are provided exclusively via Immomio; external-content consent and email matching are described. | Unlock content normally, select a residential offer, then capture. Exclude parking offers from apartment matching. |
| [Walddörfer](https://www.walddoerfer.de/wohnungsangebote/aktuelle-angebote/) | Explicit workflow: choose offer, apply, log in/register with Immomio. | Capture an individual offer; exact embedded DOM not verified. |
| [vhw](https://www.vhw-hamburg.de/wohnen/aktuelle-angebote.html) | homepage.immomio.com frame. | Modern Immomio offer capture. |
| [KAIFU](https://www.kaifu.de/wohnen/mietangebote/) | Public filters for object type, area, rooms and total rent; inspected page showed zero results. Member offers are directed to Meine KAIFU. | Separate public-detail adapter; member-portal structure remains unverified. Don't infer heating inclusion from Gesamtmiete alone. |
| [WV1902](https://wv1902.de/wohnungsangebote/) | No listing cards observed in isolated Chrome. Online housing application embeds app.wohnungshelden.de. | Capture actual offers when available. The Wohnungshelden application is not itself a listing and should not be imported as one. |

## Restrictions versus technical feasibility

An extension can technically read rendered page contents after a user action, but this does not establish permission under provider terms. [Immomio tenant terms §6.2](https://www.immomio.com/agb-mieter/) prohibit collecting, storing or processing platform data through automated queries. [ImmoScout24 terms §§8.2–8.3](https://www.immobilienscout24.de/agb/nutzungsagb.html) restrict automated extraction and building a separate database from retrieved records. Manual copy/paste or a one-click trigger is not a blanket legal exemption. No conclusion that all crawling is illegal, or that all personal clipping is permitted, follows from this investigation.

For the original aim of avoiding automated extraction, provider-native saved searches and notifications are the clearest verified discovery paths; keep the extension as a link/personal-notes organizer unless a supported integration or permission is established. Local parsing of text the user supplies is technically another option, but should not be presented as a legal workaround.

## Proposed next feature

1. Add an extension popup with **Open dashboard**, **Save listing link**, and, where enabled, **Read this property**. The existing toolbar currently only opens the dashboard.
2. Prefer individual exposés. A results page should present separate candidate cards for selection, never combine page-wide text into one apartment or silently traverse all listings.
3. Read only rendered listing information on invocation, then show an editable draft with original URL, provider/object ID, cooperative attribution, timestamp, and evidence for extracted numbers. Leave unknown fields blank.
4. Parse German amounts and dates, distinguish cold rent/operating costs/heating/total, avoid double counting, and recognize parking/commercial offers. Mark ambiguous heating and availability for review.
5. Identify duplicates by provider plus object ID when available, with canonical listing URL as fallback. Keep multiple cooperative/source references without importing the same offer twice.
6. Distinguish unsupported page, login required, consent required, still loading, and explicit empty results. Never equate missing readable text with no listings.
7. For user-triggered top-level reading, add activeTab and scripting. A cross-origin iframe needs permission for its own origin; allFrames alone does not grant access. Prefer opening the exposé as a top-level page or request narrowly scoped optional provider permissions. See [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) and [scripting](https://developer.chrome.com/docs/extensions/reference/api/scripting).
8. Validate adapters against real, user-accessible listing examples before marking them supported. None was validated against an authenticated offer in this investigation. Keep a manual draft fallback.

Recommended development order: link capture first; optional locally parsed user-provided text second; provider-authorized current-page adapters after real detail fixtures and the applicable access basis are available. Scheduled or all-portal extraction is not established as a supported route by these findings.
