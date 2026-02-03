import { Formatter } from '../interfaces/formatter';
import { MediaInfo } from '../types/schema';

export class JsonFormatter implements Formatter {
  format(data: MediaInfo): string {
    return JSON.stringify(data, null, 2);
  }
}
