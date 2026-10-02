# Antigravity-CN 🚀

<div align="center">

**Community-Driven Deep Chinese Localization & Enhancement Suite for Google Antigravity**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-orange.svg)](https://nodejs.org/)

[中文文档 (Chinese)](./README.md) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

[Google Antigravity](https://antigravity.google) is an AI-first desktop development platform. However, the official interface currently only supports English.

**Antigravity-CN** provides a lightweight, non-invasive, and community-driven localization suite:
- **Zero Binary Tampering**: Injected via Electron's renderer preload hook without touching the 160MB+ backend Go binary (`language_server.exe`).
- **Code & Terminal Isolation**: Strictly excludes `<pre>`, `<code>`, Monaco editor, Prism highlights, and terminal streams to guarantee user code is never modified.
- **Safe 1-Click Install & Instant Restore**: Automatically backs up original files and supports single-command instant rollback.
- **Agent Chinese Behavioral Rules**: Pre-configured `GEMINI.md` guidelines for Chinese reasoning, Conventional Commits, and code documentation.
- **Inspector Mode**: Interactive shortcut (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd>) to click any untranslated text and copy translation snippets for PRs.

---

## 🚀 Quick Start

### 1-Click via NPX
```bash
# Ensure Antigravity is fully closed, then run:
npx antigravity-chinese install

# To restore the official English version at any time:
npx antigravity-chinese restore
```

### Manual Installation
```bash
git clone https://github.com/paopao-amns/antigravity-cn.git
cd antigravity-cn
npm install
npm run install-patch
```

---

## 🛠️ CLI Options

```bash
npx antigravity-chinese <command> [options]

Commands:
  install, i       Install Chinese localization patch (with automatic backup)
  restore, r       Restore official English original version
  status, s        Display installation and patch status

Options:
  --path <dir>     Manually specify Antigravity install or resources directory
  --force, -f      Bypass running process check
```

---

## 🤝 Contributing

Contributions are warmly welcomed! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for dictionary guidelines and PR instructions.

## 📄 License

Licensed under the [MIT License](./LICENSE).
