import { describe, it, expect } from 'vitest';
import { BBCodeFormatter } from '../../lib/formatters/bbcode';
import { MarkdownFormatter } from '../../lib/formatters/markdown';
import { JsonFormatter } from '../../lib/formatters/json';
import { MediaInfo } from '../../lib/types/schema';

describe('Formatters (New)', () => {
  const mockData: MediaInfo = {
    site: 'test',
    id: '1',
    poster: 'https://example.com/poster.jpg',
    trans_title: ['肖申克的救赎'],
    this_title: ['The Shawshank Redemption'],
    chinese_title: '肖申克的救赎',
    foreign_title: 'The Shawshank Redemption',
    aka: [],
    year: '1994',
    region: ['美国'],
    genre: ['剧情', '犯罪'],
    language: ['英语'],
    playdate: ['1994-09-10(多伦多电影节)', '1994-10-14(美国)'],
    douban_rating: '9.7/10 from 2900000 users',
    douban_link: 'https://movie.douban.com/subject/1292052/',
    duration: '142分钟',
    director: ['弗兰克·德拉邦特'],
    writer: ['弗兰克·德拉邦特', '斯蒂芬·金'],
    cast: ['蒂姆·罗宾斯', '摩根·弗里曼'],
    tags: ['经典', '励志'],
    introduction: '20世纪40年代末，小有成就的青年银行家安迪...',
    awards: '获奖信息',
    episodes: '',
    seasons: '',
  };

  describe('BBCodeFormatter', () => {
    const formatter = new BBCodeFormatter();
    const result = formatter.format(mockData);

    it('should format basic info correctly', () => {
      expect(result).toContain('[img]https://example.com/poster.jpg[/img]');
      expect(result).toContain('◎译　　名　肖申克的救赎');
      expect(result).toContain('◎片　　名　The Shawshank Redemption');
      expect(result).toContain('◎年　　代　1994');
      expect(result).toContain('◎类　　别　剧情 / 犯罪');
      expect(result).toContain('◎导　　演　弗兰克·德拉邦特');
      expect(result).toContain('◎豆瓣评分　9.7/10 from 2900000 users');
    });

    it('should handle missing data', () => {
      const partialData = { ...mockData, trans_title: [], director: [] };
      const partialResult = formatter.format(partialData);
      expect(partialResult).not.toContain('◎译　　名');
      expect(partialResult).not.toContain('◎导　　演');
    });
  });

  describe('MarkdownFormatter', () => {
    const formatter = new MarkdownFormatter();
    const result = formatter.format(mockData);

    it('should format basic info correctly', () => {
      expect(result).toContain('![海报](https://example.com/poster.jpg)');
      expect(result).toContain('## 基本信息');
      expect(result).toContain('- **译名**: 肖申克的救赎');
      expect(result).toContain('- **片名**: The Shawshank Redemption');
      expect(result).toContain('## 制作人员');
      expect(result).toContain('- **导演**: 弗兰克·德拉邦特');
    });
  });

  describe('JsonFormatter', () => {
    const formatter = new JsonFormatter();
    const result = formatter.format(mockData);

    it('should format as valid JSON', () => {
      const parsed = JSON.parse(result);
      expect(parsed.this_title).toEqual(['The Shawshank Redemption']);
      expect(parsed.year).toBe('1994');
    });
  });
});
