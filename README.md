# FiveM-TimeSync
`by Ghost @ FNGS / 2026` → [Author's GitHub](https://github.com/FNGS-Gh)

This standalone script provides general time control features as a workaround for the FiveM asynchronous time behavior. 
It focuses on a highly customizable system to satisfy almost any possible needs a FiveM server developer might face along the way, featuring different scenarios, usage variety and so on.
For example, the variable time cycle allows you to have longer nights or days, while preserving the general client-side sync.

The script also implements a fairly optimized solution to the in-game sky map "twitching" issue, which is caused by the constant local time updates, moving the light source position (the Sun or the Moon) backwards on each iteration before the local script receives an updated time value.

*More details can be found below under the* **"2. Description"** *section ▼*

## 1. Installation

The script can be installed via two possible ways, depending on the developer's needs (options **A** and **B** onwards).

### A. Pure JavaScript:

If you don't use TypeScript for your project, and you don't care about the explanation comments within the source code, you only need to copy the following files and folders (and their content respectively) into your resource module:

```
/dist
fxmanifest.lua
```

The `/src` folder is used solely for the source TypeSript files, which are eventually built into the ready-to-use files inside the `/dist` folder.

---

### B. TypeScript:

For my projects, I use the "monorepo" approach, storing a single builder script within the root directory. Thus, make sure to prepare your FiveM resources environment accordingly. To use the TypeScript source files, you need to clone the whole repo. Also make sure that you have the `@citizenfx` packages:

```
npm install -D typescript @citizenfx/client @citizenfx/server
```

## 2. Description