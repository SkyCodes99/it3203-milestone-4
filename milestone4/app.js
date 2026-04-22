/* ═══════════════════════════════════════════════════════════
   CINEXA — Milestone 4  |  app.js
   jQuery + Mustache.js  |  TMDB API v3
   ═══════════════════════════════════════════════════════════ */

$(function () {

  /* ─── CONFIG ─────────────────────────────────────────────── */
  const API_KEY     = 'ec49f2d5bd16d2cf6f6a55185e08503c';
  const BASE        = 'https://api.themoviedb.org/3';
  const IMG         = 'https://image.tmdb.org/t/p/';
  const POSTER_SZ   = 'w342';
  const BACKDROP_SZ = 'w780';
  const PER_PAGE    = 10;   // items shown per page-view

  /* ─── MUSTACHE TEMPLATE CACHE ────────────────────────────── */
  const T = {};
  function loadTemplates () {
    $('script[type="x-tmpl-mustache"]').each(function () {
      T[this.id] = $(this).html();
    });
    // Pre-parse for performance
    Object.keys(T).forEach(k => Mustache.parse(T[k]));
  }

  /* ─── STATE ──────────────────────────────────────────────── */
  const state = {
    view:      'collection',   // 'collection' | 'search'
    category:  'popular',      // popular | top_rated | upcoming
    query:     '',
    movies:    [],             // full result set (up to 50)
    page:      1,              // current page-view  (1-5)
    totalPgs:  0,
    activeId:  null,
    layout:    'grid'          // 'grid' | 'list'
  };

  /* ─── SECTION META ───────────────────────────────────────── */
  const META = {
    popular:   { title: 'Popular Movies',   sub: 'Trending on the big screen right now',  ep: 'popular'   },
    top_rated: { title: 'Top Rated Movies', sub: 'The highest-rated films of all time',    ep: 'top_rated' },
    upcoming:  { title: 'Upcoming Movies',  sub: 'Coming soon to a theater near you',      ep: 'upcoming'  },
    search:    { title: 'Search Results',   sub: 'Showing results for your query',          ep: null        }
  };

  /* ═══════════════════════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════════════════════ */
  function init () {
    loadTemplates();
    applyLayout(state.layout);
    loadCollection('popular');
  }

  /* ═══════════════════════════════════════════════════════════
     NAV — Primary (Collections / Search)
  ═══════════════════════════════════════════════════════════ */
  $('#primary-nav').on('click', '.nav-btn', function () {
    const view = $(this).data('view');
    if (view === state.view) return;
    $('#primary-nav .nav-btn').removeClass('active');
    $(this).addClass('active');
    state.view = view;
    closeDetail();

    if (view === 'search') {
      $('#search-bar-section').removeClass('hidden');
      $('#collection-nav').addClass('hidden-nav');
      setSectionMeta('search');
      clearGrid();
    } else {
      $('#search-bar-section').addClass('hidden');
      $('#collection-nav').removeClass('hidden-nav');
      loadCollection(state.category);
    }
  });

  $('#logo-btn').on('click', function () {
    $('#primary-nav .nav-btn').removeClass('active');
    $('[data-view="collection"]').addClass('active');
    state.view = 'collection';
    $('#search-bar-section').addClass('hidden');
    $('#collection-nav').removeClass('hidden-nav');
    closeDetail();
    loadCollection(state.category);
  });

  /* ─── Sub Nav (Popular / Top Rated / Upcoming) ─────────── */
  $('#collection-nav').on('click', '.subnav-btn', function () {
    const cat = $(this).data('category');
    if (cat === state.category && state.view === 'collection') return;
    $('#collection-nav .subnav-btn').removeClass('active');
    $(this).addClass('active');
    state.category = cat;
    closeDetail();
    loadCollection(cat);
  });

  /* ─── View Toggle (Grid / List) ────────────────────────── */
  $('#view-toggle').on('click', '.toggle-btn', function () {
    const layout = $(this).data('layout');
    if (layout === state.layout) return;
    $('.toggle-btn').removeClass('active');
    $(this).addClass('active');
    state.layout = layout;
    applyLayout(layout);
    // Re-render current page without re-fetching
    renderGrid();
  });

  function applyLayout (layout) {
    $('#movies-container')
      .removeClass('view-grid view-list')
      .addClass(layout === 'grid' ? 'view-grid' : 'view-list');
  }

  /* ═══════════════════════════════════════════════════════════
     SEARCH
  ═══════════════════════════════════════════════════════════ */
  $('#search-btn').on('click', doSearch);
  $('#search-input').on('keypress', function (e) { if (e.which === 13) doSearch(); });

  function doSearch () {
    const q = $.trim($('#search-input').val());
    if (!q) return;
    state.query = q;
    state.page  = 1;
    state.movies = [];
    state.activeId = null;
    closeDetail();
    setSectionMeta('search', `Showing results for "${q}"`);
    fetchSearch(q);
  }

  /* ═══════════════════════════════════════════════════════════
     FETCH — COLLECTION  (parallel 3 TMDB pages → 50 results)
  ═══════════════════════════════════════════════════════════ */
  function loadCollection (endpoint) {
    state.view     = 'collection';
    state.category = endpoint;
    state.page     = 1;
    state.movies   = [];
    const meta = META[endpoint] || META.popular;
    setSectionMeta(endpoint);
    showLoading(true);

    const reqs = [1, 2, 3].map(p =>
      $.getJSON(`${BASE}/movie/${meta.ep}`, { api_key: API_KEY, page: p })
    );

    $.when(...reqs).done(function (...res) {
      let all = [];
      res.forEach(r => {
        const d = Array.isArray(r) ? r[0] : r;
        all = all.concat(d.results || []);
      });
      state.movies   = all.slice(0, 50);
      state.totalPgs = Math.ceil(state.movies.length / PER_PAGE);
      renderGrid();
      showLoading(false);
    }).fail(function (xhr) {
      showLoading(false); showError(xhr);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     FETCH — SEARCH
  ═══════════════════════════════════════════════════════════ */
  function fetchSearch (q) {
    showLoading(true);

    const reqs = [1, 2, 3].map(p =>
      $.getJSON(`${BASE}/search/movie`, { api_key: API_KEY, query: q, page: p })
    );

    $.when(...reqs).done(function (...res) {
      let all = [];
      res.forEach(r => {
        const d = Array.isArray(r) ? r[0] : r;
        all = all.concat(d.results || []);
      });
      state.movies   = all.slice(0, 50);
      state.totalPgs = Math.ceil(state.movies.length / PER_PAGE);
      renderGrid();
      showLoading(false);
    }).fail(function (xhr) {
      showLoading(false); showError(xhr);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER GRID  — uses Mustache templates
  ═══════════════════════════════════════════════════════════ */
  function renderGrid () {
    $('#no-results').addClass('hidden').empty();
    const start = (state.page - 1) * PER_PAGE;
    const items = state.movies.slice(start, start + PER_PAGE);
    const $c    = $('#movies-container').empty();

    if (items.length === 0) {
      const html = Mustache.render(T['tmpl-no-results'], {
        message: state.view === 'search'
          ? 'No movies found. Try a different search term.'
          : 'No movies available.'
      });
      $('#no-results').html(html).removeClass('hidden');
      $('#pagination').addClass('hidden');
      return;
    }

    const tmplId  = state.layout === 'grid' ? 'tmpl-grid-card' : 'tmpl-list-row';
    const tmpl    = T[tmplId];

    items.forEach(function (m, i) {
      const view = buildCardView(m, i);
      $c.append(Mustache.render(tmpl, view));
    });

    renderPagination();

    // Update count badge
    $('#result-count-badge')
      .text(`${state.movies.length} movies`)
      .removeClass('hidden');

    // Smooth scroll to top of results
    $('html,body').animate({ scrollTop: $('#section-header').offset().top - 74 }, 250);
  }

  /* Build view-model for a card */
  function buildCardView (m, index) {
    const year = m.release_date ? m.release_date.slice(0, 4) : '';
    const rating = m.vote_average ? m.vote_average.toFixed(1) : '';
    const posterUrl = m.poster_path ? `${IMG}${POSTER_SZ}${m.poster_path}` : null;
    const overview  = m.overview   || '';
    const shortOverview = overview.length > 120 ? overview.slice(0, 117) + '…' : overview;
    return {
      id:            m.id,
      title:         m.title,
      year,
      rating,
      lang:          m.original_language ? m.original_language.toUpperCase() : '',
      posterUrl,
      shortOverview,
      delay:         (index * 0.028).toFixed(3)
    };
  }

  /* ═══════════════════════════════════════════════════════════
     PAGINATION  — uses Mustache template
  ═══════════════════════════════════════════════════════════ */
  function renderPagination () {
    const cur   = state.page;
    const total = state.totalPgs;

    if (total <= 1) { $('#pagination').addClass('hidden'); return; }

    const pages = [];
    for (let p = 1; p <= total; p++) {
      pages.push({ num: p, isCurrent: p === cur });
    }

    const html = Mustache.render(T['tmpl-pagination'], {
      current: cur,
      total,
      count:   state.movies.length,
      prev:    cur - 1,
      next:    cur + 1,
      pages,
      isFirst: cur === 1,
      isLast:  cur === total
    });
    $('#pagination').html(html).removeClass('hidden');
  }

  /* Pagination click delegation */
  $(document).on('click', '.page-btn:not(:disabled)', function () {
    const pg = parseInt($(this).data('page'), 10);
    if (!pg || pg === state.page) return;
    state.page = pg;
    renderGrid();
  });

  /* ═══════════════════════════════════════════════════════════
     CLICK — MOVIE CARD → FETCH DETAILS
  ═══════════════════════════════════════════════════════════ */
  $(document).on('click', '.movie-card', function () {
    const id = parseInt($(this).data('id'), 10);
    if (id === state.activeId) { closeDetail(); return; }
    state.activeId = id;
    $('.movie-card').removeClass('active');
    $(this).addClass('active');
    fetchDetail(id);
  });

  /* ═══════════════════════════════════════════════════════════
     FETCH — MOVIE DETAIL
  ═══════════════════════════════════════════════════════════ */
  function fetchDetail (id) {
    showDetailSpinner();
    $.ajax({
      url:      `${BASE}/movie/${id}`,
      method:   'GET',
      dataType: 'json',
      data:     { api_key: API_KEY, append_to_response: 'credits' },
      success:  renderDetail,
      error:    function (xhr) { closeDetail(); showError(xhr); }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER DETAIL  — uses Mustache template
  ═══════════════════════════════════════════════════════════ */
  function renderDetail (m) {
    const year       = m.release_date  ? m.release_date.slice(0, 4) : '—';
    const rating     = m.vote_average  ? m.vote_average.toFixed(1)  : null;
    const runtime    = m.runtime       ? `${m.runtime} min`         : null;
    const posterUrl  = m.poster_path   ? `${IMG}${POSTER_SZ}${m.poster_path}`   : null;
    const backdropUrl= m.backdrop_path ? `${IMG}${BACKDROP_SZ}${m.backdrop_path}` : null;
    const director   = (m.credits && m.credits.crew)
      ? (m.credits.crew.find(p => p.job === 'Director') || {}).name || '—' : '—';
    const cast       = (m.credits && m.credits.cast)
      ? m.credits.cast.slice(0, 4).map(p => p.name).join(', ') || '—' : '—';
    const budget     = m.budget  > 0 ? '$' + m.budget.toLocaleString()  : '—';
    const revenue    = m.revenue > 0 ? '$' + m.revenue.toLocaleString() : '—';
    const language   = m.spoken_languages && m.spoken_languages[0]
      ? m.spoken_languages[0].english_name : (m.original_language || '—');

    const view = {
      id:          m.id,
      title:       m.title,
      tagline:     m.tagline || null,
      year,
      rating,
      runtime,
      language,
      overview:    m.overview || null,
      posterUrl,
      backdropUrl,
      genres:      m.genres || [],
      director,
      cast,
      status:      m.status || '—',
      budget,
      revenue
    };

    const html = Mustache.render(T['tmpl-detail'], view);
    $('#detail-content').html(html);
    $('#detail-panel').removeClass('hidden');
    $('#content-layout').addClass('detail-open');
  }

  /* ═══════════════════════════════════════════════════════════
     CLOSE DETAIL
  ═══════════════════════════════════════════════════════════ */
  $('#close-detail').on('click', closeDetail);

  function closeDetail () {
    state.activeId = null;
    $('.movie-card').removeClass('active');
    $('#detail-panel').addClass('hidden');
    $('#content-layout').removeClass('detail-open');
  }

  /* ═══════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════ */
  function setSectionMeta (key, customSub) {
    const m = META[key] || META.popular;
    $('#section-title').text(m.title);
    $('#section-subtitle').text(customSub || m.sub);
  }

  function showLoading (on) {
    if (on) {
      $('#loading-overlay').removeClass('hidden');
      $('#movies-container').empty();
      $('#pagination').addClass('hidden');
      $('#result-count-badge').addClass('hidden');
    } else {
      $('#loading-overlay').addClass('hidden');
    }
  }

  function showDetailSpinner () {
    $('#detail-content').html(
      '<div style="padding:3rem;text-align:center;color:var(--text-dim)">' +
      '<div class="spinner" style="margin:0 auto 1rem"></div><p>Loading…</p></div>'
    );
    $('#detail-panel').removeClass('hidden');
    $('#content-layout').addClass('detail-open');
  }

  function clearGrid () {
    $('#movies-container').empty();
    $('#pagination').addClass('hidden');
    $('#no-results').addClass('hidden');
    $('#result-count-badge').addClass('hidden');
  }

  function showError (xhr) {
    const msgs = {
      401: 'Invalid API key.',
      404: 'Resource not found.',
      429: 'Too many requests — please wait a moment.'
    };
    const msg = msgs[xhr.status] || 'Something went wrong. Please try again.';
    $('#movies-container').html(
      `<div style="padding:2rem;color:var(--accent2);font-size:.88rem">⚠ ${msg}</div>`
    );
  }

  /* ─── BOOT ─── */
  init();

});
