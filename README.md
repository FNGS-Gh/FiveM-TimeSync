# FiveM-TimeSync
`by Ghost @ FNGS / 2026` → [Author's GitHub](https://github.com/FNGS-Gh)

This standalone script provides general time control features. It focuses on a highly customizable and optimized system to satisfy almost any possible needs a FiveM developer might face along the way, featuring different scenarios, usage variety and so on. For example, the variable time cycle allows you to have longer nights or days, while preserving the general client-side sync.

The script also implements a fairly optimized solution to the common "sky flickering" issue, which is usually caused by the constant local time updates, moving the light source position (the Sun or the Moon) backwards on each iteration before the local script receives an updated time value.

*More details can be found below under the* **"2. Description"** *section ▼*

## 1. Installation
❗️ *This project is published under the MIT License. Upon using it, please make sure to keep the credits and apply the same type of licensing.*

---

###
If you don't care about the code readability and you just want to deploy the resource straight away, you can delete everything except of the following files and folders (and their content respectively):

```
fxmanifest.lua
config.json
dist/
```

The `config.json` file can be modified anytime with no need to rebuild the scripts.

---

###
If you want to modify the code, you'll find the source TypeScript files within the `src/` folder. Please note that this repo doesn't contain any TS builder and etc, so you'll need to set up your dev environment accordingly.

Also make sure that you have the `@citizenfx` packages:

```
npm install -D typescript @citizenfx/client @citizenfx/server
```

## 2. Description

This project ended up being fairly optimized for a "time sync" script. I did my best to avoid unnecessary server load due to constant re-sync requests. The time calculation is done "on demand", using universal server uptime values (`GetNetworkTimeAccurate()` for client and `GetGameTimer()` for server) instead of periodic incremental tasks.

### Features:

- Local in-game time sync between all players;
- Fully customizable via the `config.json` file;
- Completely standalone;
- Lightweight production script files (in `prod/`);
- Adjustable in-game timeflow (e.g. 1:1 IRL time);
- Day and night can have different length (e.g. longer nights or longer days);
- No excessive re-syncs unless needed: time passes natually via the game engine. Throughout the whole testing, I've never witnessed a time offset of more than 10 in-game seconds, which would call a re-sync client-to-server request;
- No "sky twitching", as the recommended value for the maximum offset (10 seconds) adjusts time almost seamlessly during a re-sync;
###

I got a stable result of `0.01ms` processor time, and I don't see how it can be optimized any further. I believe it's a good result for the amount of features and the overall smoothness the script implements.

## 3. Known Issues

- Depending on the local game loading state, the in-game time offset might be around 20-30s before the local interval check notices it. The issue occurs only once upon the initial time sync, which happens when a player loads into the map. Not sure whether there is any need to fix it;

- I'm not sure how persistent and accurate the client's `GetNetworkTimeAccurate()` native is in relation to the server's `GetGameTimer()` one throughout a long server uptime. So far, I've done a single test by joining the server that has been running for ~4 hours, and not a single offset of more than 10 seconds has occurred even once. But the issue might unveil itself during a longer uptime. I'll keep testing those natives' co-accurracy;