# Code Archaeology — 代码考古

[English](./README.md) | 中文

给你一段代码，告诉你它怎么来的。

写代码的时候经常遇到一个问题：这段逻辑为什么这样写？谁改的？改了几次？有没有相关的 PR 或 issue？
翻 git log 能找到答案，但过程很烦。这个工具就是把这件事自动化了。

## 它能做什么

**三种分析模式：**

```bash
# 精确到行 — 分析第 10-50 行的演变历史
code-dig dig src/auth.ts 10-50

# 整个文件 — 谁改过这个文件、改了多少次
code-dig dig src/auth.ts

# 目录扫描 — 找出哪些文件改动最频繁（热点地图）
code-dig dig src/core/
```

**输出长这样：**

```
📜 src/auth.ts:10-50 — 变更时间线

[2024-01-15] feat: add JWT refresh token (#123)
  Author: zheng.wang
  Files changed: 3 | +45 -12
  PR: #123 | Issue: #89

[2023-11-02] fix: race condition in token validation (#98)
  Author: colleague
  Files changed: 1 | +8 -3
  PR: #98

📊 统计：3 次修改, 2 位贡献者, 跨越 5 个月
```

**还能往代码里插注释：**

```bash
# 交互式 — 分析完问你要不要加注释
code-dig dig src/auth.ts 10-50 --annotate

# 直接插入
code-dig annotate src/auth.ts 10-50 --style detailed
```

插入后的效果（Python 文件）：

```python
# [Code Archaeology]
# History: 5 changes over 3 months (2 contributors)
# Last major change: fix token validation (#98) - 2024-01-15
# Key decisions:
#   - JWT refresh token rotation (2024-01-15)
#   - Race condition fix with mutex pattern (2023-11-02)
```

工具会自动识别文件类型，JS/TS/Java/Go/C 用块注释 `/* */`，Python/Ruby/Shell 用行注释 `#`，Rust/Swift 用 `//`。

## 安装

提供两套 CLI，功能完全一样，选你顺手的：

### Node.js

```bash
cd cli-node
npm install
npm run build

# 全局安装（可选）
npm link
```

### Python

```bash
cd cli-python
pip install -e .
```

> Python 版本要求 >= 3.9，依赖 click + gitpython + rich。

## 命令参考

| 命令 | 说明 |
|------|------|
| `code-dig dig <target> [lines]` | 分析历史，target 可以是文件或目录 |
| `code-dig annotate <file> [lines]` | 直接插入历史注释 |

**dig 选项：**
- `--format json` — 输出 JSON（方便脚本处理或喂给 AI）
- `--annotate` — 分析完后交互式询问是否插入注释

**annotate 选项：**
- `--style brief` — 只输出摘要（3 行）
- `--style detailed` — 包含所有关键变更记录（默认）

## Claude Code Skill

除了命令行，这个项目还附带一个 Claude Code skill 文件（`skill/code-archaeology.md`）。

skill 的优势是 AI 加持 — 不只是列出 commit 记录，还会：
- 用自然语言讲代码的演变故事
- 推断设计决策背后的原因（结合 commit message 和代码上下文）
- 标注高风险区域（频繁修改、多人交叉改动）
- 生成比 CLI 更深入的注释

使用方法：把 `skill/code-archaeology.md` 拷贝到你的 `.claude/skills/` 目录下即可。

## 工作原理

底层很简单，就是在 git 命令上做了一层封装：

1. `git log -L` — 追踪指定行范围的历史（自动处理行号漂移）
2. `git blame --porcelain` — 获取逐行的最后修改信息
3. `git log --follow` — 追踪文件历史（包括重命名）
4. `git log --name-only` — 目录级别的修改频率统计

从 commit message 里正则提取 PR 编号（`#123`）和 issue 引用（`fixes #89`），支持 GitHub 和 GitLab 两种格式。

## 项目结构

```
code-archaeology/
├── cli-node/          # TypeScript CLI（commander + simple-git + chalk）
├── cli-python/        # Python CLI（click + gitpython + rich）
└── skill/             # Claude Code skill 定义
```

两套 CLI 的架构完全对称：`core/` 负责数据采集，`annotator/` 负责注释生成和插入，`commands/` 是命令入口。

## 局限性

- 依赖 git 历史 — 如果文件是新建的或没提交过，啥也分析不出来
- `git log -L` 对大文件 + 长历史可能比较慢（上千行 + 上百 commit 的情况）
- commit message 写得糟糕的仓库，提取不出有价值的信息
- 注释插入是物理写文件，记得检查 diff 再提交

## License

MIT
