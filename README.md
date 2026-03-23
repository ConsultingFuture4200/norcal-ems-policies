# Nor-Cal EMS Field Guide

Offline-first Android app for searching and reading Nor-Cal EMS policies in the field. All ~200+ policy PDFs are bundled inside the APK — zero internet required after install.

## For EMS Crews

1. Get the `.apk` file from your crew chief / administrator
2. On your Android phone: Settings → Security → Enable "Install from unknown sources" (or allow for your file manager)
3. Open the `.apk` file and tap Install
4. Open "NCE Field Guide" — everything works offline immediately

## For Developers / Administrators

### Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Java JDK 17** — Required for Android builds
- **Android SDK** — Via [Android Studio](https://developer.android.com/studio) or standalone SDK tools
  - Install: Android SDK Platform 34, Build Tools 34.0.0, NDK
  - Set `ANDROID_HOME` environment variable
- **Python 3** — Optional, only if you modify the pipeline scripts

### First-Time Setup

```bash
# Clone the repo
git clone <repo-url>
cd NorCalEMSGuide

# Install React Native dependencies
npm install

# Install pipeline dependencies
cd scripts
npm install
cd ..
```

### Build the Data (Run Pipeline)

This scrapes norcalems.org, downloads all PDFs, extracts text, and builds the SQLite database:

```bash
cd scripts
node pipeline.js
```

**What it does:**
1. Scrapes 6 policy index pages → finds all PDF links
2. Downloads ~200 PDFs to `scripts/output/pdfs/`
3. Extracts text from each PDF
4. Generates clinical keywords and provider level tags
5. Builds `policies.db` (SQLite with FTS5) and copies everything to `android/app/src/main/assets/`

This takes 5-15 minutes depending on your internet speed. You only need to re-run it when Nor-Cal EMS updates their policies.

### Build the APK

```bash
# Debug build (for testing)
cd android
./gradlew assembleDebug

# Release build (for distribution)
./gradlew assembleRelease
```

**Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
**Release APK:** `android/app/build/outputs/apk/release/app-release.apk`

### Signing for Distribution

For sideload distribution, you need a signing keystore:

```bash
# Generate a keystore (one-time)
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore norcal-ems-release.keystore \
  -alias norcal-ems \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_PASSWORD \
  -keypass YOUR_PASSWORD \
  -dname "CN=Nor-Cal EMS, O=Nor-Cal EMS, L=CA, ST=California, C=US"
```

Then configure `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('norcal-ems-release.keystore')
            storePassword 'YOUR_PASSWORD'
            keyAlias 'norcal-ems'
            keyPassword 'YOUR_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Updating Policies

When Nor-Cal EMS publishes updated policies:

1. Re-run the pipeline: `cd scripts && node pipeline.js`
2. Bump version in `android/app/build.gradle` (`versionCode` and `versionName`)
3. Build new APK: `cd android && ./gradlew assembleRelease`
4. Distribute to crews

## Architecture

```
User's Phone
├── SQLite Database (policies.db)
│   ├── policies table (id, title, section, content, keywords...)
│   ├── policies_fts (FTS5 full-text search index)
│   └── favorites table
├── Bundled PDFs (/pdfs/*.pdf)
│   └── ~200 PDF files, one per policy
└── React Native App
    ├── Home Screen (search + section cards)
    ├── Category Browser (subsection accordions)
    ├── Policy Detail (text view + PDF viewer)
    └── Favorites
```

**Search:** SQLite FTS5 with porter stemming. Searches across titles, clinical keywords, and full policy text. Fuzzy prefix matching ("card" → "cardiac").

**Offline:** Everything ships in the APK. No network calls. No first-launch download. Install and go.

## Tech Stack

| Component | Library |
|-----------|---------|
| Framework | React Native 0.73 (bare workflow) |
| Navigation | React Navigation 6 |
| Database | op-sqlite (SQLite with FTS5) |
| PDF Viewer | react-native-pdf |
| File System | react-native-blob-util |
| Icons | react-native-vector-icons (MaterialCommunityIcons) |

## Project Structure

```
NorCalEMSGuide/
├── scripts/                    # Build-time data pipeline
│   ├── pipeline.js             # Master pipeline (run this)
│   ├── scrape-policies.js      # Step 1: Scrape norcalems.org
│   ├── download-pdfs.js        # Step 2: Download PDFs
│   ├── extract-text.js         # Step 3: Extract text
│   ├── generate-metadata.js    # Step 4: Keywords + provider levels
│   └── build-sqlite.js         # Step 5: Build SQLite + copy to assets
├── src/
│   ├── App.tsx                 # Entry point with database init
│   ├── navigation/             # React Navigation setup
│   ├── screens/                # Home, Browse, Favorites, Detail
│   ├── components/             # Reusable UI components
│   ├── database/               # SQLite queries and types
│   ├── hooks/                  # Search, favorites, filter hooks
│   ├── theme/                  # Dark/light theme, typography, spacing
│   └── utils/                  # Helpers (highlighting, PDF paths)
├── android/                    # Android native project
│   └── app/src/main/assets/    # policies.db + pdfs/ (generated)
└── package.json
```

## License

The policy documents are published by Nor-Cal EMS and are free to use. This application is a field reference tool for EMS providers.
