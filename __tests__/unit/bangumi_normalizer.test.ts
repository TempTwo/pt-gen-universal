import { describe, it, expect } from 'vitest';
import { BangumiNormalizer } from '../../lib/normalizers/bangumi';
import { BangumiRawData } from '../../lib/types/raw-data';

describe('BangumiNormalizer', () => {
  const normalizer = new BangumiNormalizer();
  const config = {};

  it('should normalize bangumi data correctly', () => {
    const rawData: BangumiRawData = {
      site: 'bangumi',
      success: true,
      sid: '123',
      main_html: `
                <div id="headerSubject">
                    <h1 class="nameSingle">
                        <a href="/subject/123" title="Test Anime">测试动画</a>
                    </h1>
                </div>
                <div id="bangumiInfo">
                    <a href="/cover/m/123.jpg" class="thickbox cover"></a>
                    <ul id="infobox">
                        <li><span class="tip">中文名: </span>测试动画</li>
                        <li><span class="tip">放送开始: </span>2023年4月1日</li>
                        <li><span class="tip">话数: </span>12</li>
                        <li><span class="tip">别名: </span>Alias 1</li>
                        <li><span class="tip">别名: </span>Alias 2</li>
                    </ul>
                </div>
                <div id="subject_summary">Test summary</div>
                <div class="global_score">
                    <span property="v:average">8.5</span>
                </div>
                <span property="v:votes">100</span>
                <div id="subject_detail">
                    <div class="subject_tag_section">
                        <div>
                            <a class="l"><span>Tag1</span></a>
                            <a class="l"><span>Tag2</span></a>
                        </div>
                    </div>
                </div>
            `,
      characters_html: `
                <div id="columnInSubjectA">
                    <div class="light_odd">
                        <div class="clearit">
                            <h2>
                                <span class="tip">Char 1</span>
                            </h2>
                            <div class="clearit">
                                <p><small>CV 1</small></p>
                            </div>
                        </div>
                    </div>
                </div>
            `,
    };

    const result = normalizer.normalize(rawData, config);

    expect(result.site).toBe('bangumi');
    expect(result.id).toBe('123');
    expect(result.title).toBe('测试动画');
    expect(result.year).toBe('2023');
    expect(result.bangumi_rating_average).toBe(8.5);
    expect(result.genre).toEqual(['Tag1', 'Tag2']);
    expect(result.cast).toEqual(['Char 1: CV 1']);
    expect(result.trans_title).toContain('测试动画');
    expect(result.trans_title).toContain('Alias 1');
    expect(result.episodes).toBe('12');
    expect(result.playdate).toEqual(['2023年4月1日']);
  });
});
