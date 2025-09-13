> for gitops workflows, refer to [template](https://github.com/eagle-cooler/template)

# Power Eagle - Meta Plugin System

**Power Eagle** is a meta plugin system for Eagle.cool extensions that enables users to create, download, and manage custom userscript plugins. It provides a simple way to extend Eagle's functionality through URL-based plugin installation and rich UI components.

## Features

- 🔌 **Plugin Management**: Download and install plugins from URLs
- 🎨 **Rich UI Support**: SDK for complex interfaces, see [examples](./src/examples/)
- 🔒 **Isolated Execution**: Safe plugin contexts with prefixed storage
- 📦 **System Integration**: Native zip extraction using OS APIs
- 🎯 **Simple Development**: Just `plugin.json` + `main.js` files

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS + DaisyUI
- **Backend**: Eagle.cool Extension Framework
- **File System**: Node.js fs/path modules

## Start

`use template button` or

```sh
git clone https://github.com/meetqy/eagle-plugin-vite-react-ts.git
```

**Install and dev**

```sh
pnpm i
pnpm dev
```

or

```sh
npm i
npm run dev
```

## Dark and Light theme

More theme, Reference https://daisyui.com/docs/themes/

## Other

- Visit images on any devices, base on eagle. [rao.pics](https://github.com/meetqy/rao-pics)
