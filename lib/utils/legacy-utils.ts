import html2bbcodeModule from 'html2bbcode';
const { HTML2BBCode } = html2bbcodeModule as any;

// Html2bbcode wrapper from legacy common.js
export function html2bbcode(html: string): string {
  let converter = new HTML2BBCode();
  let bbcode = converter.feed(html);
  return bbcode.toString();
}

export const GAME_INSTALL_TEMPLATE = `【安装信息】

1. 解压缩
2. 载入镜像
3. 安装游戏
4. 复制镜像中的Crack文件夹(也可能是RUNE、TENOKE、SKIDROW等小组名称的文件夹)内的未加密补丁到游戏目录中覆盖
5. 运行游戏`;
