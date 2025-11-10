/*
  Seanime Custom Source - Manga Provider (example)
  Filename: custom-manga-provider.ts

  Notes:
  - Class name MUST be `Provider` and it should implement the CustomSource contract
  - This is a minimal, in-memory example you can drop into a Seanime extension dev environment
  - Fill/extend the example data to suit your actual manga collection
*/

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

/*
  NOTES & INTEGRATION GUIDE

  1) To let Seanime use *other providers* for chapter lists, Seanime's manga UI expects an AniList media id
     when calling ctx.manga.getChapterContainer (see the official docs). If the manga exists on AniList, set
     `aniListId` below (or set this provider's `id` to that AniList id). When an AniList id is present, other
     providers (mangadex, manganato, etc.) can resolve chapters more reliably.

  2) If a manga is NOT present on AniList (like many webtoons / OEL works), the app can still search external
     providers using titles. The `ctx.manga.getChapterContainer` call accepts a `titles` array which helps
     identify the manga on the external provider. To support that, include rich `title` fields and `year` in
     the media details so UI plugins and other providers can try title-based matching.

  3) Example fields added to the in-memory DB (see top of file):
     - `aniListId?: number | null`   // optional AniList ID for cross-provider resolution
     - `externalLinks?: { site: string; url: string }[]` // useful hints for users & plugins

  4) If you'd like, I can implement a small UI plugin that will expose a "Find chapters via external provider"
     button on the manga detail page. That plugin would call `ctx.manga.getChapterContainer({ mediaId: <aniListId>, provider: '<providerId>', titles: [<titles>], year: <year> })`
     and display the returned chapters. This is a reliable fallback when `aniListId` is missing.

  Reference: Seanime Manga UI docs — getChapterContainer and related APIs.
*/