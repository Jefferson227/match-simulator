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
| `rec-serie-c-2025` | REC PDF, 16 pp., 387,021 bytes, dated 27/02/2025 (CMS record 4546) | 2026-09-10 | `https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/REC%20-%20Brasileiro%20S%C3%A9rie%20C%202025.pdf` |
| `rec-serie-d-2025` | REC PDF, 20 pp., 470,839 bytes, dated 27/02/2025 (CMS record 4542) | 2026-09-10 | `https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/REC%20-%20Brasileiro%20S%C3%A9rie%20D%202025.pdf` |
| `rec-serie-b-2026` | REC PDF, 16 pp., 627,110 bytes (CMS record 5188). **Outcome evidence only:** its Anexo A names the 4 clubs promoted from Série C 2025 | 2026-09-10 | `https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/REC_Brasileiro_Serie_B_2026_dc12c977f7.pdf` |
| `rec-serie-c-2026` | REC PDF, 18 pp., 567,740 bytes, dated 23/02/2026 (CMS record 5268). **Outcome evidence:** Anexo B gives Série C 2025's official 5º–16º and Série D 2025's 1º–4º; also the 2026 format change | 2026-09-10 | `https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/REC_Brasileiro_Serie_C_2026_d2552ddc00.pdf` |
| `rec-serie-d-2026` | REC PDF, 22 pp., 776,892 bytes (CMS record 5480). **Outcome evidence:** Anexo A names the 4 clubs relegated from Série C 2025; also the 96-club 2026 format | 2026-09-10 | `https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/REC_Brasileiro_Serie_D_2026_df281f18b7.pdf` |
| `tabela-serie-d-2026` | Tabela Básica PDF, 16 pp., 1,099,292 bytes, emitted 24/02/2026 (CMS record 6567). Prints every 1ª Fase match as "A definir", so it gives **no group composition or order**. It confirms the 2ª–4ª Fase crossings, Bloco I/II pairings, first-leg hosts and phase dates, with the Playoffs (26/08–02/09) parallel to the 6ª Fase | 2026-09-23 | `https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/Tabela_Basica_Serie_D_2026_f4f0adbc2b.pdf` |

The men's 2025 RECs resolve through the same CMS slug pattern as the women's
(`campeonato-brasileiro/serie-c/2025`, `…/serie-d/2025`); each slug returns 5 records (REC, PGA, Tabela
Detalhada, RGC 2025, Diretriz Técnica 2025). The Tabelas Detalhadas were not read.

## CBF editorial — **not regulatory**

Articles on `cbf.com.br/futebol-feminino`. CBF publishes them, so they are primary, but they are
**news, not rules**: nothing in them is a REC, PGA or Anexo, and a page citing one must say so. They
are the only source for the 20-club expansion target — see [[known-contradictions]] item 1.

| id | Kind | Published | Retrieved | Says |
|---|---|---|---|---|
| `news-expansao-2025` | CBF news article, "CBF anuncia novidades para o futebol feminino de 2025" | 17/01/2025 | 2026-09-07 | A1 *"ampliação progressiva para 20 clubes até 2027"* via 2 down / 4 up in 2025 and 2026; A2 *"crescimento gradual para 20 clubes até 2028"* |
| `news-calendario-2025` | CBF calendar article (Samir Xaud administration) | 24/11/2025 | 2026-09-07 | A1 *"ampliado de 16 para 18"*; A2 *"mantido"* at 16; A2 2026 composed as 2 down + 10 stayers (5º–14º) + 4 from A3. **Does not restate the 20-club goal.** |

Men's 2025 editorial, retrieved 2026-09-10 (URLs recorded):

| id | Kind | Says | URL |
|---|---|---|---|
| `news-serie-c-2025-final` | CBF news, "Série C: Ponte Preta derrota o Londrina e conquista seu primeiro título nacional" | Ponte Preta champion over Londrina | `https://www.cbf.com.br/futebol-brasileiro/noticias/campeonato-brasileiro/serie-c/serie-c-ponte-preta-derrota-o-londrina-e-conquista-seu-primeiro-titulo-nacional` |
| `news-serie-c-2025-acesso` | CBF news, "Ponte Preta e Londrina decidirão a Série C. Náutico e São Bernardo também conquistam acesso" | the 4 promoted clubs | `https://www.cbf.com.br/futebol-brasileiro/noticias/campeonato-brasileiro/serie-c/ponte-preta-e-londrina-decidirao-a-serie-c-nautico-e-sao-bernardo-conquistam-acesso` |
| `news-serie-d-2025-final` | CBF news, "É campeão! Barra conquista o título da Série D 2025" | Barra champion | `https://www.cbf.com.br/futebol-brasileiro/noticias/campeonato-brasileiro/serie-b/e-campeao-barra-conquista-o-titulo-da-serie-d-2025` |

Men's 2026 editorial, retrieved 2026-09-23 (MS-112). News, not regulation:

| id | Kind | Says | URL |
|---|---|---|---|
| `news-serie-d-2026-goiatuba` | CBF news, "Goiatuba garante acesso à Série C de 2027" | Goiatuba promoted "por ter tido melhor campanha" in the playoff; ASA, Gama, Uberlândia and ABC already promoted | `https://www.cbf.com.br/futebol-brasileiro/noticias/campeonato-brasileiro-serie-d/a/goiatuba-garante-acesso-a-serie-c-de-2027` |
| `news-serie-d-2026-f03-report` | CBF match report, São José 0×0 Goiatuba (playoff first leg) | "Caso haja novo empate, o Goiatuba será beneficiado por ter melhor campanha" | `https://www.cbf.com.br/futebol-brasileiro/noticias/campeonato-brasileiro/campeonato-brasileiro-serie-d/sao-jose-e-goiatuba-empatam-sem-gols-pelo-play-off-de-acesso-da-serie-d` |
| `news-serie-d-2026-f03-preview` | CBF preview, "São José x Goiatuba inaugura play-offs de acesso nesta quarta-feira" | A level aggregate goes to **penalties**, contradicting REC D 2026 Art. 21 §5 and what was applied | `https://www.cbf.com.br/futebol-brasileiro/noticias/campeonato-brasileiro-serie-d/a/sao-jose-x-goiatuba-inaugura-play-offs-de-acesso-nesta-quarta-feira` |
| `news-conselho-serie-c-2026` | CBF news, Conselho Técnico da Série C 2026 | "Esta será a última edição com 20 times, antes da adoção do formato com 24 equipes em 2027 e com 28 em 2028" | `https://www.cbf.com.br/futebol-brasileiro/noticias/serie-a/a/cbf-realiza-conselho-tecnico-da-serie-c-de-2026` |
| `news-calendario-2026` | CBF news, new men's professional calendar | Série D "saltará de 64 para 96"; clubs reaching the 16-tie phase keep their Série D place | `https://www.cbf.com.br/a-cbf/noticias/informes-cbf/a/cbf-anuncia-novo-calendario-do-futebol-profissional-masculino` |

> **URLs were not recorded** when these were read on 2026-09-07, and are deliberately not
> reconstructed here — a guessed URL is worse than none. Both are findable from
> `https://www.cbf.com.br/futebol-feminino/noticias` by date. Capture the URL on the next pass that
> touches them.

## Squad rosters — **secondary**, not CBF

| id | Kind | Retrieved | Where |
|---|---|---|---|
| `ogol-rosters-2026` | One JSON per club from **ogol.com.br**, for the 222 clubs of both seed files: `teamFullName`, `teamShortName`, the coach (name, age; nationalities for the women's), and every player's name, `positionCode`, age and nationalities, 6,558 players. The source of every name, squad, age, nationality and coach in the seed since MS-112 | 2026-09-22 (the files carry no date; this is their timestamp) | Supplied as MS-112 input, collected outside the repository. **Not committed**: it lived in the gitignored `.plans/MS-112/input/teams/`. `scripts/merge-ms112-rosters.mjs <input-dir>` rebuilds the seed from it. |
| `transfermarkt-free-coaches-2026` | 27 unattached coaches from **transfermarkt.com** (`retrievedAt` 2026-09-22) | 2026-09-22 | Same input folder, `mens/free-coaches.json`. **Not used**; deferred by MS-112. |

ogol and Transfermarkt refuse scripted access (403 / bot challenge; see [[player-ages]]). These
files were collected outside the repository, and their provenance is recorded here because the
input itself was not kept.

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
| `times-serie-c-2025` | Série C 2025 club list (21 records, 20 clubs); competitionId `12616` | `https://www.cbf.com.br/futebol-brasileiro/times/campeonato-brasileiro/serie-c/2025` |
| `times-serie-d-2025` | Série D 2025 club list (65 records, 64 clubs); competitionId `12617` | `https://www.cbf.com.br/futebol-brasileiro/times/campeonato-brasileiro/serie-d/2025` |
| `tabelas-serie-c-2025` | Série C ids in `competitionData`: phases `1899` 1ª Fase, `1969` 2ª Fase, `1983` 3ª Fase | `https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-c/2025` |
| `tabelas-serie-d-2025` | Série D ids in `competitionData`: phases `1900` 1ª Fase, `1951` 2ª Fase, `1957` 3ª Fase, `1965` Quartas de Final, `1971` Semi Finais, `1976` Final | `https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-d/2025` |
| `jogos-api` | Results **and match-sheet lineups** per round and phase: 216 Série C and 510 Série D matches, 2025 (source of the MS-106 squads). Série D 2026: all **610** matches, retrieved 2026-09-23; their scores are committed as `tests/support/data/serie-d-2026-results.json` (MS-112) | `https://www.cbf.com.br/api/cbf/jogos/campeonato/<competitionId>/rodada/<n>/fase/<fase_id>` |
| `times-serie-d-2026` | Série D 2026 club list (96 records: `time_id`, `nome_completo`, `time_uf`); competitionId `1260635` | `https://www.cbf.com.br/futebol-brasileiro/times/campeonato-brasileiro/serie-d/2026` |
| `tabelas-serie-d-2026` | Série D 2026 ids in `competitionData`: phases `2040` 1ª Fase, `2066` 2ª Fase, `2068` 3ª Fase, `2075` 4ª fase, `2080` Quartas de Final, `2089` Semifinais, `2090` Playoff de Acesso, `2099` Final. `.../2026/2040` serves the final 1ª Fase group tables, the only source of the group composition | `https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-d/2026` |

Retrieval mechanics — the `populate=*` trap, the TLS failure, the Next.js flight payloads — are on
[[cbf-data-sources]]. Read that page before fetching anything new.
