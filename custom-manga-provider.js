// CommonJS-compatible provider file for Seanime (no TypeScript, no ESM export)

const MANGA_DB = [
  {
    id: 1,
    title: { romaji: 'The Beginning After the End', english: 'The Beginning After the End' },
    coverImage: {
      large: 'https://us-a.tapas.io/sa/f7/16e8def2-901b-45ea-8d86-2aa4b05cc86b_z.jpg',
      medium: 'https://us-a.tapas.io/sa/f7/16e8def2-901b-45ea-8d86-2aa4b05cc86b_z.jpg'
    },
    status: 'HIATUS',
    description: 'A reincarnation fantasy following Arthur Leywin as he navigates a new life filled with magic and intrigue.',
    chapters: 225,
    volumes: null,
    authors: [{ name: 'TurtleMe' }],
    genres: ['Fantasy', 'Isekai'],
    relations: []
  }
];

function Provider() {}

Provider.prototype.getSettings = function () {
  return { supportsAnime: false, supportsManga: true };
};

Provider.prototype.getManga = async function (ids) {
  const results = [];
  for (const id of ids) {
    const found = MANGA_DB.find((m) => m.id === id);
    if (found) {
      results.push({
        id: found.id,
        title: found.title,
        coverImage: found.coverImage,
        status: found.status,
        description: found.description
      });
    }
  }
  return results;
};

Provider.prototype.getMangaDetails = async function (id) {
  return MANGA_DB.find((m) => m.id === id) || null;
};

Provider.prototype.listManga = async function (search, page, perPage) {
  const q = (search || '').trim().toLowerCase();
  let filtered = MANGA_DB;
  if (q.length > 0) {
    filtered = MANGA_DB.filter((m) => {
      const r = (m.title.romaji || '').toLowerCase();
      const e = (m.title.english || '').toLowerCase();
      return r.includes(q) || e.includes(q);
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.max(1, page);
  const start = (p - 1) * perPage;
  const slice = filtered.slice(start, start + perPage).map((m) => ({
    id: m.id,
    title: m.title,
    coverImage: m.coverImage,
    status: m.status,
    description: m.description
  }));

  return { media: slice, page: p, totalPages, total };
};

// Export in CommonJS style for loaders that don't accept ESM 'export'
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Provider;
}

// Also attach to global for any loader that looks for a global default
if (typeof globalThis !== 'undefined') {
  try {
    globalThis.CustomSourceProvider = Provider;
    globalThis.default = Provider;
  } catch (e) {
    // ignore attach errors
  }
}
