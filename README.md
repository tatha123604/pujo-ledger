# Pujo Ledger

An offline-first Durga Puja ledger seeded from the 2025 balance sheet.

## Run locally

Serve this folder over HTTP (service workers do not work from `file://`). Any static server works; for example, use VS Code Live Server or `npx serve .`, then open the local URL.

## Deploy on Railway

This repository includes a `Dockerfile` and `railway.toml`, so Railway can run it as a production static PWA and automatically use Railway's assigned `PORT`.

### From the Railway dashboard

1. Push this folder to a GitHub repository.
2. In Railway, choose **New Project > Deploy from GitHub repo**.
3. Select the repository and wait for the deployment to finish.
4. Open the service's **Settings > Networking > Generate Domain** to get the live URL.

### From the Railway CLI

```text
npm install -g @railway/cli
railway login
railway init
railway up
railway domain
```

The app remains offline-first after deployment: ledger data and receipt images stay in each browser/device's IndexedDB. Use the built-in JSON backup/export to move data between devices.

## Build an Android APK

Install Node.js and Android Studio, then from this folder run:

```text
npm install
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio, use **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The app stores ledger data and receipt images in IndexedDB on the device. The JSON backup can be copied between devices; cloud sync can be added later behind the same storage boundary.

### Automatic APK from GitHub

Every push to `main` runs `.github/workflows/android-apk.yml`. Open the repository's **Actions**, select **Build Android APK**, open a successful run, and download the `pujo-ledger-debug-apk` artifact.
