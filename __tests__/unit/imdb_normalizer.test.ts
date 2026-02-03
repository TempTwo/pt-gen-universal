import { describe, it, expect } from 'vitest';
import { ImdbNormalizer } from '../../lib/normalizers/imdb';
import { ImdbRawData } from '../../lib/types/raw-data';

describe('ImdbNormalizer', () => {
  const normalizer = new ImdbNormalizer();
  const config = {};

  it('should normalize imdb data correctly', () => {
    const rawData: ImdbRawData = {
      site: 'imdb',
      success: true,
      imdb_id: 'tt1234567',
      json_ld: {
        '@type': 'Movie',
        name: 'The Shawshank Redemption',
        datePublished: '1994-10-14',
        genre: ['Drama', 'Crime'],
        image: 'https://example.com/poster.jpg',
        duration: 'PT2H22M',
        description: 'Two imprisoned men bond over a number of years...',
        aggregateRating: {
          ratingValue: 9.3,
          ratingCount: 2500000,
        },
        director: [{ '@type': 'Person', name: 'Frank Darabont' }],
        creator: [{ '@type': 'Person', name: 'Stephen King' }], // Writer/Creator
        actor: [
          { '@type': 'Person', name: 'Tim Robbins' },
          { '@type': 'Person', name: 'Morgan Freeman' },
        ],
        keywords: 'prison,escape',
      },
      next_data: {},
      details: {
        'Country of origin': ['USA'],
      },
      release_date: [{ country: 'USA', date: '14 October 1994' }],
      aka: [{ country: 'China', title: '肖申克的救赎' }],
    };

    const result = normalizer.normalize(rawData, config); // Pass config

    expect(result.site).toBe('imdb');
    expect(result.id).toBe('tt1234567');
    expect(result.title).toBe('The Shawshank Redemption');
    expect(result.year).toBe('1994');
    expect(result.poster).toBe('https://example.com/poster.jpg');
    expect(result.imdb_rating_average).toBe(9.3);
    expect(result.genre).toEqual(['Drama', 'Crime']);
    expect(result.director).toEqual(['Frank Darabont']);
    expect(result.writer).toEqual(['Stephen King']);
    expect(result.cast).toEqual(['Tim Robbins', 'Morgan Freeman']);
    expect(result.aka).toContain('肖申克的救赎');
    expect(result.playdate).toContain('14 October 1994(USA)');
    expect(result.tags).toEqual(['prison', 'escape']);
  });
});
