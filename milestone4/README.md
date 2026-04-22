# CINEXA — TMDB Movie SPA · Milestone 4

## What's new in M4 vs M3
| Feature | M3 | M4 |
|---|---|---|
| Mustache.js templates | ✗ | ✅ All cards, list rows, details, pagination |
| Grid / List view toggle | ✗ | ✅ Dynamic switch, no reload |
| List view with overview | ✗ | ✅ Thumbnail + meta + truncated overview |
| Collection sub-nav separation | Basic | ✅ Collections tab + Search tab (no overwrite) |
| Pagination template | Inline jQuery | ✅ Mustache template |
| Detail panel template | Inline jQuery | ✅ Mustache template |
| Result count badge | ✗ | ✅ |
| Sticky detail panel | ✗ | ✅ Sticky sidebar with scroll |
| Mobile bottom-sheet detail | ✗ | ✅ |

## File Structure
```
milestone4/
├── index.html          ← Single HTML page + all Mustache templates
├── css/
│   └── style.css       ← All styles (grid, list, detail, responsive)
├── js/
│   └── app.js          ← All logic (jQuery AJAX + Mustache rendering)
└── README.md
```

## Technologies
- **jQuery 3.7.1** — AJAX, DOM, event delegation
- **Mustache.js 4.2.0** — Logic-less templates for all dynamic HTML
- **TMDB API v3** — Movie data

## Mustache Templates (all in index.html)
| Template ID | Used For |
|---|---|
| `tmpl-grid-card` | Grid view movie card |
| `tmpl-list-row` | List view movie row |
| `tmpl-detail` | Movie detail panel |
| `tmpl-pagination` | Pagination controls |
| `tmpl-no-results` | Empty state message |

## Setup
The TMDB API key is already embedded in `js/app.js`.
Deploy all files to a web server and open `index.html`.
Must run over HTTP/HTTPS (not `file://`).
