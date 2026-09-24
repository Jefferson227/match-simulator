---
title: Player ages
type: concept
verified: 2026-09-20
sources: [atletas-api, jogos-api]
---

# Player ages

Every player in both seed files carries an `age`, added by MS-111 because [[player-stamina]] needs
one to pick a decay rate. **None of them is real.** This page records why, so nobody spends another
pass trying to harvest them.

## No source publishes them

Four were tried. All four failed, for different reasons.

**CBF publishes no birth date anywhere.** Neither endpoint in [[cbf-data-sources]] carries one —
not a date of birth, not an age, not any date field about a person:

- athlete API → `atleta_nome`, `atleta_apelido`, `clube_nome_completo`, `clube_nome_popular`,
  `clube_uf`, `clube_escudo`
- match API, per athlete → `id`, `nome`, `apelido`, `numero_camisa`, `reserva`, `entrou_jogando`,
  `goleiro`, `foto`

Age therefore joins position, strength and colours on the list of things CBF does not give us. See
[[invented-data]].

**Wikidata covers 3% of the seed.** Measured with club-scoped SPARQL
(`?club rdfs:label "<name>"@pt . ?p wdt:P54 ?club ; wdt:P569 ?dob`) over a sample of 8 clubs: 6 of
182 players matched. Three independent causes, each fatal on its own:

- **The women's seed matches nothing** — 0 of 92. Wikidata's club item is the *men's* club, so `P54`
  returns the men's squad history. The women's teams are separate items whose players are largely
  unmodelled.
- **Lower-division men's clubs are not covered.** Amazonas has exactly one player with a birth date
  in all of Wikidata, and Séries C and D are where most of the men's seed lives.
- **Coverage is historical.** ABC returns 227 players, overwhelmingly from the 1980s to the 2000s;
  the seed is its 2025 squad.

**Matching on name alone is worse than having no data.** Most of the seed is apelidos — "Felipe",
"Bento", "Cacá", "Bibi", "Papel". An unscoped label search resolved ABC's *Felipe* to a
footballer born 1977 and its *Pedro Paulo* to one born 1973, ages 49 and 53. They are different
people who share a nickname. A wrong age is indistinguishable from a right one downstream, so
this approach was rejected outright rather than used as a fallback.

**Transfermarkt and ogol refuse scripted access**, at the edge, before serving anything.
`ogol.com.br` and `zerozero.pt` answer **403** (Cloudflare); `transfermarkt.com.br` answers
**202** with a bot-challenge stub instead of the page. Full browser headers change nothing, because
these are JS challenges rather than header checks.

> **The one untried route.** Driving a real browser would likely pass both challenges. MS-111 could
> not attempt it — no browser was connected to the session. Anyone picking this up should know the
> apelido ambiguity above is unchanged by it, and that Transfermarkt shows *current* squads against
> the seed's 2025 ones.

## What the seed carries instead

`scripts/seed-player-ages.mjs`, re-runnable and idempotent. An age is a pure function of
`internalName|name|position` (FNV-1a, shaped by a triangular inverse CDF), so re-running it
reproduces the committed files exactly and a re-seed never reshuffles ages already in play.

| Position | min | peak | max |
|---|---|---|---|
| GK | 19 | 28 | 41 |
| DF | 17 | 27 | 39 |
| MF | 17 | 26 | 38 |
| FW | 17 | 25 | 38 |

Resulting spread over all 4270 players, which is what decides how much of the stamina table the game
ever exercises:

| Stamina band | Players | Share |
|---|---|---|
| ≤ 20 | 261 | 6.1% |
| 21–25 | 1285 | 30.1% |
| 26–28 | 1096 | 25.7% |
| 29–32 | 1004 | 23.5% |
| 33–35 | 448 | 10.5% |
| 36–38 | 169 | 4.0% |
| > 38 | 7 | 0.2% |

Every band is populated, so no branch of the decay table is dead in practice. The bands overlap
heavily on purpose: a squad where every forward was younger than every keeper would read as
obviously synthetic.

**No reference date applies.** A real age is only true relative to one; a generated age is not true
at all, and the seed does not age with the calendar. Season-to-season ageing is not implemented.
