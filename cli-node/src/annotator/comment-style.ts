import { LanguageConfig, CommentStyle } from '../types.js';

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

export function getLanguageConfig(filePath: string): LanguageConfig | undefined {
  const ext = '.' + filePath.split('.').pop()?.toLowerCase();
  return LANGUAGES.find(lang => lang.extensions.includes(ext));
}

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
