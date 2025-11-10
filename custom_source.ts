
type AL_Title = { romaji?: string; english?: string; native?: string };

type AL_BaseManga = {
  id: number;
  title: AL_Title;
  coverImage?: { large?: string; medium?: string };
  status?: string;
  description?: string;
};

type AL_MangaDetailsById_Media = AL_BaseManga & {
  chapters?: number | null;
  volumes?: number | null;
  authors?: { name: string }[];
  genres?: string[];
  relations?: { id: number; relationType: string; title: AL_Title }[];
};

type ListResponse<T> = { media: T[]; page: number; totalPages: number; total: number };

abstract class CustomSource {
  abstract getSettings(): { supportsAnime: boolean; supportsManga: boolean };
  async getAnime(ids: number[]): Promise<any[]> {
    throw new Error('Not implemented');
  }
  async getManga(ids: number[]): Promise<AL_BaseManga[]> {
    throw new Error('Not implemented');
  }
  async getMangaDetails(id: number): Promise<AL_MangaDetailsById_Media | null> {
    throw new Error('Not implemented');
  }
  async listManga(search: string, page: number, perPage: number): Promise<ListResponse<AL_BaseManga>> {
    throw new Error('Not implemented');
  }
}

// ---------------------- In-memory manga database ----------------------

const MANGA_DB: AL_MangaDetailsById_Media[] = [
  {
    id: 1,
    title: { romaji: 'The Beginning After the End', english: 'The Beginning After the End' },
    coverImage: { large: 'https://us-a.tapas.io/sa/f7/16e8def2-901b-45ea-8d86-2aa4b05cc86b_z.jpg', medium: 'https://us-a.tapas.io/sa/f7/16e8def2-901b-45ea-8d86-2aa4b05cc86b_z.jpg' },
    status: 'HIATUS',
    description: 'A reincarnation fantasy following Arthur Leywin as he navigates a new life filled with magic and intrigue.',
    chapters: 223,
    volumes: null,
    authors: [{ name: 'TurtleMe' }],
    genres: ['Fantasy', 'Isekai'],
    relations: [],
  },
];

// ---------------------- Provider implementation ----------------------

export default class Provider extends CustomSource {
  getSettings() {
    return { supportsAnime: false, supportsManga: true };
  }

  async getManga(ids: number[]): Promise<AL_BaseManga[]> {
    const results: AL_BaseManga[] = [];
    for (const id of ids) {
      const found = MANGA_DB.find((m) => m.id === id);
      if (found) {
        results.push({
          id: found.id,
          title: found.title,
          coverImage: found.coverImage,
          status: found.status,
          description: found.description,
        });
      }
    }
    return results;
  }

  async getMangaDetails(id: number): Promise<AL_MangaDetailsById_Media | null> {
    return MANGA_DB.find((m) => m.id === id) || null;
  }

  async listManga(search: string, page: number, perPage: number): Promise<ListResponse<AL_BaseManga>> {
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
      description: m.description,
    }));

    return { media: slice, page: p, totalPages, total };
  }
}