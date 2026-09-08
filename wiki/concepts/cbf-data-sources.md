---
title: Fetching data from CBF
type: concept
verified: 2026-09-07
sources: [tabelas-copa-2026, atletas-api, times-a1-2026]
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

## The athlete API

```
https://www.cbf.com.br/api/cbf/atletas/campeonato/<competitionId>/clube/<clubId>/pagina/<n>
```

Returns `atleta_nome`, `atleta_apelido`, `clube_nome_completo`, `clube_nome_popular`, `clube_uf`,
`clube_escudo`. It publishes **no player position** and no strength or colour data of any kind —
which is why [[invented-data]] exists. Pagination is lossy: one club reported 32 registered athletes
and returned only 29 across its pages.

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
Bahia (2023), Fortaleza (2025) and Botafogo (2022–23) each appear twice. **Deduplicate on
`nome_popular` and cross-check the REC's Art. 2º.** A raw record count is an upper bound, never a
club count.

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

For club `name`, the `times` endpoint's `nome_completo` is canonical, **not** REC Anexo A. The two
disagree for roughly 7 A1 clubs. See [[known-contradictions]].
