# FiveM-TimeSync
`by Ghost @ FNGS / 2026` → [Author's GitHub](https://github.com/FNGS-Gh)

This standalone script provides general time control features as a workaround for the FiveM asynchronous time behavior among players. 
It focuses on a highly customizable and optimized system to satisfy almost any possible needs a FiveM developer might face along the way, featuring different scenarios, usage variety and so on.
For example, the variable time cycle allows you to have longer nights or days, while preserving the general client-side sync.

The script also implements a fairly optimized solution to the in-game sky map "twitching" issue, which is caused by the constant local time updates, moving the light source position (the Sun or the Moon) backwards on each iteration before the local script receives an updated time value.

*More details can be found below under the* **"2. Description"** *section ▼*

## 1. Installation
❗️ *This project is published under the MIT License. Upon using it, please make sure to keep the credits and apply the same type of license.*

---

If you don't care about the code readability and you just want to deploy the resource straight away, you can delete everything except of the following files and folders (and their content respectively):

```
fxmanifest.lua
config.json
dist/
```

The `config.json` file can be modified anytime with no need to rebuild the scripts.

---

If you want to modify the code, you'll find the source TypeScript files within the `src/` folder. Please note that this repo doesn't contain any TS builder and etc, so you'll need to set up your dev environment accordingly.

Also make sure that you have the `@citizenfx` packages:

```
npm install -D typescript @citizenfx/client @citizenfx/server
```

## 2. Description

This project ended up being fairly optimized for a "time sync" script. I did my best to avoid unnecessary server load due to constant re-sync requests. The time calculation is done "on demand", using universal timestamps instead of periodic incremental tasks. The client resource load depends entirely on the `MAX_TIME_OFFSET` and `CHECK_INTERVAL` values inside `Time.ts`.

With the `CHECK_INTERVAL` being set to `10000` ms, I got a stable result of `0.05 ms` processor time. it doesn't really change much upon altering the values in question, as well as removing calculations inside the main thread.

### Features:

- 