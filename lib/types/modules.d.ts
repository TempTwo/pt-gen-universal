declare module 'html2bbcode' {
  export default class HTML2BBCode {
    constructor(options?: any);
    feed(html: string): { toString(): string };
  }
}
