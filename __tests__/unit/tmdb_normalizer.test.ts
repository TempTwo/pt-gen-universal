import { describe, it, expect } from 'vitest';
import { TmdbNormalizer } from '../../lib/normalizers/tmdb';
import { TmdbRawData } from '../../lib/types/raw-data';

describe('TmdbNormalizer', () => {
  const normalizer = new TmdbNormalizer();
  const config = {};

  it('should normalize movie data correctly', () => {
    const rawData: TmdbRawData = {
      site: 'tmdb',
      success: true,
      tmdb_id: '123',
      id: 123,
      media_type: 'movie',
      title: 'Test Movie',
      original_title: 'Original Test Movie',
      overview: 'Test overview',
      release_date: '2023-01-01',
      vote_average: 8.5,
      vote_count: 100,
      poster_path: '/poster.jpg',
      genres: [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Drama' },
      ],
      production_countries: [{ iso_3166_1: 'US', name: 'USA' }],
      spoken_languages: [{ iso_639_1: 'en', name: 'English' }],
      runtime: 120,
      credits: {
        cast: [{ name: 'Actor 1', character: 'Role 1', id: 1 }],
        crew: [
          { name: 'Director 1', job: 'Director', id: 2 },
          { name: 'Writer 1', job: 'Writer', id: 3 },
        ],
      },
      external_ids: { imdb_id: 'tt1234567' },
      alternative_titles: { titles: [{ iso_3166_1: 'CN', title: '测试电影', type: '' }] },
    };

    const result = normalizer.normalize(rawData, config);

    expect(result.site).toBe('tmdb');
    expect(result.id).toBe('123');
    expect(result.title).toBe('Test Movie');
    expect(result.year).toBe('2023');
    expect(result.poster).toBe('https://image.tmdb.org/t/p/original/poster.jpg');
    expect(result.tmdb_rating_average).toBe(8.5);
    expect(result.genre).toEqual(['Action', 'Drama']);
    expect(result.region).toEqual(['USA']);
    expect(result.director).toEqual(['Director 1']);
    expect(result.writer).toEqual(['Writer 1']);
    expect(result.cast).toEqual(['Actor 1']);
    expect(result.trans_title).toContain('Test Movie');
    expect(result.trans_title).toContain('测试电影');
    expect(result.imdb_link).toBe('https://www.imdb.com/title/tt1234567/');
  });

  it('should normalize tv show data correctly', () => {
    const rawData: TmdbRawData = {
      site: 'tmdb',
      success: true,
      tmdb_id: '456',
      id: 456,
      media_type: 'tv',
      name: 'Test Show',
      original_name: 'Original Test Show',
      first_air_date: '2022-01-01',
      number_of_episodes: 10,
      number_of_seasons: 1,
      episode_run_time: [45],
      created_by: [{ name: 'Creator 1', id: 1 }],
      credits: {
        cast: [],
        crew: [], // created_by used for directors in TV
      },
    };

    const result = normalizer.normalize(rawData, config);

    expect(result.site).toBe('tmdb');
    expect(result.title).toBe('Test Show');
    expect(result.year).toBe('2022');
    expect(result.episodes).toBe('10');
    expect(result.seasons).toBe('1');
    expect(result.duration).toBe('45 分钟');
    expect(result.director).toEqual(['Creator 1']);
  });
});
