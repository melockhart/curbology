# Glyph corruption in the PDF exports

Safari's PDF export subsets the webfonts, and the subset encodings do not map
back to ASCII. Extraction returns text with substituted glyphs, and the
substitution differs per font, so it cannot be fixed with one table.

Observed, across three files:

| Seen | Actually | Seen | Actually |
| --- | --- | --- | --- |
| `(` | n *or* h | `%` | s |
| `&` | s *or* & | `1` | h |
| `$` | s | `7` | & |
| `*` | n | `>` | m |
| `)` | n *or* h | `5` | m |
| `+` | n | `6` | fi (ligature) |
| `/` | h | `0` | n |
| `:` | & | | |

Every heading below was decoded by hand from context. Body copy came through
clean — only display type (the subsetted headings) is affected.

**This is why the rendered HTML matters.** Decoded-by-eye headings are an
inference; `outerHTML` is the fact.
