# Raw sources

Immutable. Never edit a file in this folder. If a source is republished, fetch the new copy under a
new id and record the supersession in `../log.md`.

PDFs and API dumps are **not tracked in git** (see `.gitignore`) — they are large, and CBF serves
them from stable CDN URLs. This manifest is tracked, and `./fetch.sh` re-materialises the folder.
If CBF ever pulls a document, commit that file deliberately.

## CBF documents

| id | Kind | Retrieved | URL |
|---|---|---|---|
| `rec-a1-2026` | REC PDF | 2026-09-05 | via `championship-documents?filters[slug][$eq]=campeonato-brasileiro/feminino-a1/2026&populate=*` |
| `rec-a2-2026` | REC PDF | 2026-09-05 | via `championship-documents?filters[slug][$eq]=campeonato-brasileiro/feminino-a2/2026&populate=*` |
| `rec-a3-2026` | REC PDF | 2026-09-05 | via `championship-documents?filters[slug][$eq]=campeonato-brasileiro/feminino-a3/2026&populate=*` |
| `rec-copa-2026` | REC PDF | 2026-09-06 | `https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/REC_Copa_do_Brasil_Feminina_2026_7376920006.pdf` |
| `tabela-copa-2026` | Tabela Detalhada PDF (updated 27/07/2026) | 2026-09-06 | `https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/Tabela_Detalhada_Copa_do_Brasil_Feminina_2026_9604f84f3a.pdf` |
| `rec-supercopa-2026` | REC PDF | 2026-09-06 | `https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/REC_Supercopa_Feminina_2026_7bcf301c7a.pdf` |

## CBF live endpoints

| id | Used for | URL |
|---|---|---|
| `times-a1-2026` | A1 club list, canonical `nome_completo`; competitionId `1260614` | `https://www.cbf.com.br/futebol-brasileiro/times/campeonato-brasileiro/feminino-a1/2026` |
| `times-a2-2026` | A2 club list; competitionId `1260622` | `.../feminino-a2/2026` |
| `times-a3-2026` | A3 club list; competitionId `1260630` | `.../feminino-a3/2026` |
| `crests` | Club crest images | `https://conteudo.cbf.com.br/clubes/<clubId>/escudo.jpg` |
| `atletas-api` | Registered athletes, paginated | `https://www.cbf.com.br/api/cbf/atletas/campeonato/<competitionId>/clube/<clubId>/pagina/<n>` |
| `tabelas-copa-2026` | Copa ids, `phasesList`, per-phase fixtures | `https://www.cbf.com.br/futebol-brasileiro/tabelas/copa-do-brasil/feminino/2026` |
| `tabelas-supercopa-2026` | Supercopa ids, fixture, result, venue | `https://www.cbf.com.br/futebol-brasileiro/tabelas/supercopa-do-brasil/feminino/2026` |

Retrieval mechanics — the `populate=*` trap, the TLS failure, the Next.js flight payloads — are on
[[cbf-data-sources]]. Read that page before fetching anything new.
