#!/usr/bin/env bash
# Re-materialise the raw source folder from the URLs in sources.md.
# WebFetch fails on cbf.com.br with "unable to verify the first certificate" — curl is required.
set -euo pipefail
cd "$(dirname "$0")/cbf"

fetch() { # fetch <id> <url>
  [ -f "$1.pdf" ] && { echo "have $1"; return; }
  echo "get  $1"
  curl -fsSL -o "$1.pdf" "$2"
}

CDN=https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn
fetch rec-copa-2026      "$CDN/REC_Copa_do_Brasil_Feminina_2026_7376920006.pdf"
fetch tabela-copa-2026   "$CDN/Tabela_Detalhada_Copa_do_Brasil_Feminina_2026_9604f84f3a.pdf"
fetch rec-supercopa-2026 "$CDN/REC_Supercopa_Feminina_2026_7bcf301c7a.pdf"

# The division RECs are addressed indirectly; resolve each slug through the CMS.
# NOTE: &populate=* is mandatory — without it every document comes back with url: null.
for d in a1 a2 a3; do
  [ -f "rec-$d-2026.pdf" ] && { echo "have rec-$d-2026"; continue; }
  url=$(curl -fsSL "https://cms.cbf.com.br/api/championship-documents?filters[slug][\$eq]=campeonato-brasileiro/feminino-$d/2026&populate=*" \
        | grep -o 'https://[^"]*REC[^"]*\.pdf' | head -1) || true
  [ -n "${url:-}" ] && { echo "get  rec-$d-2026"; curl -fsSL -o "rec-$d-2026.pdf" "$url"; } \
                    || echo "MISS rec-$d-2026 — CMS returned no REC link"
done
