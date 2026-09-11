---
title: Fetching data from CBF
type: concept
verified: 2026-09-10
sources: [tabelas-copa-2026, atletas-api, times-a1-2026, jogos-api, times-serie-c-2025, times-serie-d-2025, tabelas-serie-c-2025, tabelas-serie-d-2025]
asserts:
  - file: wiki/raw/fetch.sh
    exists: true
---

# Fetching data from CBF

Read this before fetching anything new from `cbf.com.br`. Every item here cost a wasted extraction
pass at least once.

## `populate=*` is mandatory

```
https://cms.cbf.com.br/api/championship-documents?filters[slug][$eq]=<slug>&populate=*
```

Without `&populate=*` every document comes back with `url: null`. The real PDF link lives at
`file.data.attributes.url`. The 2026-09-05 pass read the missing `url` as an empty response and
recorded the endpoint as **down**; it was serving the whole time. See [[log]] for the correction.

## `WebFetch` cannot reach CBF

Both `cbf.com.br` and `cms.cbf.com.br` fail with `unable to verify the first certificate`. Use
`curl`. This is why `../raw/fetch.sh` exists.

## Competition pages are flight payloads, not an API

Competition pages are Next.js App Router flight payloads embedded in the HTML
(`self.__next_f.push`). There is no separate JSON API for them. Per-phase pages are
`.../<slug>/<year>/<fase_id>`; probing an invented `fase_id` silently returns the default phase page
rather than a 404, so a returned page is **not** evidence that the phase exists.

The ids you need live in the `tabelas` page's flight payload, in **`competitionData`**: the
`competitionId`, `championshipId`, `categoryId` and each phase's `fase_id` with its name and round
count. That is where Série C 2025 (`12616`: phases `1899`/`1969`/`1983`) and Série D 2025 (`12617`:
`1900`/`1951`/`1957`/`1965`/`1971`/`1976`) came from.

## The athlete API

```
https://www.cbf.com.br/api/cbf/atletas/campeonato/<competitionId>/clube/<clubId>/pagina/<n>
```

Returns `atleta_nome`, `atleta_apelido`, `clube_nome_completo`, `clube_nome_popular`, `clube_uf`,
`clube_escudo`. It publishes **no player position** and no strength or colour data of any kind —
which is why [[invented-data]] exists. Pagination is lossy: one club reported 32 registered athletes
and returned only 29 across its pages.

**On the men's 2025 competitions it is far worse**, and the loss is not a paging bug. Page 0 returns
a non-JSON error. Page 1 of Ponte Preta returns 11 athletes while reporting `total: 1` page and
`total_atletas: 49`. Other samples: Tombense 9 of 39, Floresta 8 of 44, Portuguesa 6 of 38,
Humaitá 4 of 48, Trem 2 of 33. Built from this API alone, roughly 60% of an 84-club men's seed
would be invented names. **Use the match lineups below instead.**

## The match API — results *and* lineups

```
https://www.cbf.com.br/api/cbf/jogos/campeonato/<competitionId>/rodada/<n>/fase/<fase_id>
```

One call returns every match of a round, grouped by `grupo`. Each match carries the score (`gols`),
a shootout count (`panaltis`), venue, referees, events (`penalidades`) and **both sides'
`atletas`**.
Each athlete has `id`, `nome`, `apelido`, `numero_camisa`, `reserva`, `entrou_jogando` and
**`goleiro` true/false**. This is the only place CBF marks a goalkeeper.

- **Coverage is near-complete.** Série C 2025: 216 matches, 15 of 432 team-sheets empty, 31–52 named
  athletes per club. Série D 2025: 510 matches, 3 of 1,020 empty, 27–50 per club. Every club had at
  least 27 real names and 2 flagged goalkeepers, so MS-106 needed no padding.
- **Names carry the shirt number.** They come as "01 - Luiz". The prefix is sometimes doubled
  ("37 - 37 - Serginho"), and some `apelido`s end in a number too ("Guilherme Pira - 10",
  "Ciel 99"). Strip both ends.
- **`goleiro` is per match.** Count it across the sheets rather than trusting one.
- **A season's sheets include players who left mid-season**, sometimes for another club in the same
  competition. Assign a shared athlete `id` to one club.
- **Knockout second legs returned HTTP 500 intermittently** on 2026-09-10 (every Série D `rodada/2`
  on the first pass). `curl --retry 5 --retry-all-errors` got all of them; plain `--retry` does not
  retry a 500.

## Club crests

`https://conteudo.cbf.com.br/clubes/<clubId>/escudo.jpg`. Not used by the game — the seed carries
`colors`, not images — but it is the only visual asset CBF exposes per club.

## `tabelas/` returns 200 for a season that does not exist

`/futebol-brasileiro/tabelas/<comp>/<year>` returns **HTTP 200 with an empty flight payload** for an
unpublished year, while `times/` and `competicoes/` correctly 404 for the same year. **A 200 there is
not evidence the season exists.** Check the payload for `nome_popular` / `campeonato_id` before
believing it. Found 2026-09-07, after a pass spent probing 2027.

## `times` emits one record per legal entity, not per club

A mid-season SAF conversion leaves the club with two records, so a raw count over-reports the field:
Bahia (2023), Fortaleza (2025) and Botafogo (2022–23) each appear twice. **Deduplicate, then
cross-check the REC's Art. 2º.** A raw record count is an upper bound, never a club count.

**Deduplicating on `nome_popular` is not enough.** Série D 2025 breaks it both ways:

- **Pouso Alegre** has two entities with *different* `nome_popular`s: `63322` "Pouso Alegre Saf",
  which played every match, and `34519` "Pouso Alegre", which played none and returns 0 athletes. A
  `nome_popular` key keeps both.
- **Two different clubs share a `nome_completo`**: "Santa Cruz Futebol Clube" is both PE `20039` and
  RN `35622`. A `nome_completo` key merges them.

Série C has the same phantom pattern: Brusque `20233` played no match and has 0 athletes. **Dedupe
on "played a match in this competition"** — the club ids in the match API — and check the count
against Art. 2º and Anexo A.

## `curl` needs `-g` for the bracketed filter

```sh
curl -fsSLg "https://cms.cbf.com.br/api/championship-documents?filters[slug][\$eq]=<slug>&populate=*"
```

Without `-g`, curl treats `[` and `]` as glob ranges. `../raw/fetch.sh` escaped only `\$` and worked
by luck; it now passes `-g` explicitly.

## Some REC records exist with no file

2022 and 2023 REC records are present in the CMS with `file: null` — CBF no longer serves those PDFs.
A record in the index is not a document.

## Year coverage

The site's year selector stops at **2026**. `/times/.../2027` returns 404 and the
`championship-documents` endpoint returns nothing for 2027. Any page here dated 2026 will need a
fresh pass once CBF opens the next season — that is what the lint staleness check is for.

## Which endpoint wins

For the women's seed, the `times` endpoint's `nome_completo` is canonical for club `name`, **not**
REC Anexo A. The two disagree for roughly 7 A1 clubs. **The men's Série C and D seed uses REC
Anexo A instead**, because `times` strips accents and names SAF legal entities. See
[[known-contradictions]] items 3 and 8, and [[ms-106-mens-lower-divisions]].
