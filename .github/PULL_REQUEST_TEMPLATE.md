## Summary / Összefoglaló

<!-- What changed and why. / Mi változott és miért. -->

## Self-review checklist — Magyar

Mielőtt lezárod a javítást, nézd át a következő szempontok szerint:

- [ ] **Root cause, nem a szimptóma** — a hiba ott lett javítva, ahol keletkezik, vagy csak elnyomtad a tünetet (pl. timeout növelés helyett megértetted-e miért lassabb az adott eset)?
- [ ] **Reprodukálható-e a feltételezésed** — ha azt állítod hogy "X miatt lassabb", van-e bizonyítékod (log, mérés, korábbi futási idő), vagy csak találgatás?
- [ ] **Regressziót okoz-e a fix más ágon** — ha egy timeoutot vagy assertet módosítottál, átfutottad-e fejben (vagy valóságban) az összes érintett scenario-t, nem csak azt amelyik bukott?
- [ ] **Az assert/validáció arányos-e a kockázattal** — szigorítasz valamit (assert hozzáadása)? Biztos vagy benne hogy minden legit állapotban is teljesül, nem csak a happy path-on?
- [ ] **Van-e silent failure a megoldásban** — a fix elnyel-e egy hibát ahelyett hogy explicit jelezné (pl. `except: pass`, vagy `""` ami valódi hibát is elfedhet)?
- [ ] **Konzisztens-e a doksival** — ha a CLAUDE.md / README valamit állít a viselkedésről, a kód még egyezik vele a fix után is?
- [ ] **DRY marad-e** — nem írtál-e duplikált logikát csak mert gyorsabb volt, mint megkeresni a meglévő helperben?
- [ ] **Tesztelve van-e valóban, nem csak feltételezve** — futott-e CI/lokális teszt a fix után, vagy csak "logikailag jónak tűnik"?
- [ ] **A commit/PR leírás tartalmazza a "miért"-et** — nem csak azt, mit változtattál, hanem hogy milyen megfigyelés vezetett a döntéshez (pl. "az adott oldal lassabb betöltésű, ezért a timeout 10s-re nőtt — lásd CI log X futás").
- [ ] **Van-e olcsóbb/egyszerűbb megoldás** — mielőtt a számokat (timeout, retry count) tologatod, megnézted-e van-e determinisztikus wait-stratégia (pl. `waitForLoadState`, konkrét elemre várás) ami kiküszöböli a találgatást?

### Kiegészítő pontok

- [ ] **Egyedi eset vagy visszatérő minta?** — ha ugyanez a probléma máshol is előfordulhat a suite-ban, érdemes-e a fixet közös helperbe/fixture-be emelni egy egyedi patch helyett?
- [ ] **Quarantine vs. azonnali fix** — ha a flaky teszt oka nem egyértelmű, a helyes válasz most a teszt explicit flaky-ként jelölése + jegy nyitása, nem egy találgatott fix?
- [ ] **Sorrend-függetlenség** — a teszt önállóan/izoláltan futtatva is helyes marad, vagy csak megosztott state miatt "véletlenül jó" a jelenlegi futási sorrendben?

## Self-review checklist — English

Before closing out a fix, review against these:

- [ ] **Root cause, not the symptom** — was the bug fixed where it actually originates, or did you just suppress the symptom (e.g. did you understand _why_ a case is slower, instead of just raising a timeout)?
- [ ] **Is your assumption reproducible** — if you claim "X is slower because of Y," do you have evidence (logs, measurements, prior run times), or is it a guess?
- [ ] **Does the fix risk a regression elsewhere** — if you changed a timeout or an assertion, did you walk through (mentally or for real) every affected scenario, not just the one that failed?
- [ ] **Is the assertion/validation proportionate to the risk** — if you're tightening something (adding an assertion), are you sure it holds for every legitimate state, not just the happy path?
- [ ] **Is there a silent failure in the fix** — does it swallow an error instead of surfacing it explicitly (e.g. `except: pass`, or an empty string that can also mask a real failure)?
- [ ] **Is it consistent with the docs** — if CLAUDE.md / README states something about the behavior, does the code still match it after the fix?
- [ ] **Does it stay DRY** — did you duplicate logic just because it was faster than finding the existing helper?
- [ ] **Was it actually tested, not just assumed** — did CI/local tests run after the fix, or does it just "look logically correct"?
- [ ] **Does the commit/PR description include the "why"** — not just what changed, but what observation drove the decision (e.g. "this page loads slower, so the timeout was raised to 10s — see CI run X").
- [ ] **Is there a cheaper/simpler fix** — before tuning numbers (timeout, retry count), did you check for a deterministic wait strategy (e.g. `waitForLoadState`, waiting on a specific element) that removes the guesswork entirely?

### Additional points

- [ ] **One-off case or a recurring pattern?** — if the same issue could occur elsewhere in the suite, should the fix be promoted to a shared helper/fixture instead of a one-off patch?
- [ ] **Quarantine vs. fix-now** — if the root cause of a flaky test isn't clear, is the right call here to mark it flaky explicitly and open a ticket, instead of shipping a guessed fix?
- [ ] **Order independence** — does the test still pass when run in isolation / a different order, or is it only "correct" by accident of shared state?

## Test plan / Tesztelési terv

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:smoke`
- [ ] Full suite (`npm test`) if the change touches shared fixtures/core logic
