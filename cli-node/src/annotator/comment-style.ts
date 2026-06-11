import { LanguageConfig } from '../types.js';

/**
 * 语言注释风格配置表。
 * 根据文件扩展名匹配对应的注释语法，用于生成格式正确的注释块。
 */
const LANGUAGES: LanguageConfig[] = [
  {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
    commentStyle: 'block',
    blockStart: '/**',
    blockEnd: ' */',
    blockMiddle: ' * ',
  },
  {
    extensions: ['.java', '.kt', '.scala', '.groovy'],
    commentStyle: 'block',
    blockStart: '/**',
    blockEnd: ' */',
    blockMiddle: ' * ',
  },
  {
    extensions: ['.go'],
    commentStyle: 'block',
    blockStart: '/*',
    blockEnd: ' */',
    blockMiddle: ' * ',
  },
  {
    extensions: ['.c', '.cpp', '.cc', '.cxx', '.h', '.hpp'],
    commentStyle: 'block',
    blockStart: '/*',
    blockEnd: ' */',
    blockMiddle: ' * ',
  },
  {
    extensions: ['.py', '.pyx', '.pyi'],
    commentStyle: 'line',
    linePrefix: '# ',
  },
  {
    extensions: ['.rb', '.rake'],
    commentStyle: 'line',
    linePrefix: '# ',
  },
  {
    extensions: ['.sh', '.bash', '.zsh', '.fish'],
    commentStyle: 'line',
    linePrefix: '# ',
  },
  {
    extensions: ['.rs'],
    commentStyle: 'line',
    linePrefix: '// ',
  },
  {
    extensions: ['.swift'],
    commentStyle: 'line',
    linePrefix: '// ',
  },
];

/**
 * 根据文件路径的扩展名查找对应的语言配置。
 * 未识别的扩展名返回 undefined，调用方需处理不支持的情况。
 */
export function getLanguageConfig(filePath: string): LanguageConfig | undefined {
  const ext = '.' + filePath.split('.').pop()?.toLowerCase();
  return LANGUAGES.find(lang => lang.extensions.includes(ext));
}

/**
 * 将多行文本包装为指定语言的注释块。
 * block 风格产出 / ** ... * / 结构，line 风格逐行加前缀。
 */
export function wrapComment(lines: string[], config: LanguageConfig): string {
  if (config.commentStyle === 'block') {
    const result: string[] = [config.blockStart!];
    for (const line of lines) {
      result.push(config.blockMiddle! + line);
    }
    result.push(config.blockEnd!);
    return result.join('\n');
  }

  return lines.map(line => config.linePrefix! + line).join('\n');
}
