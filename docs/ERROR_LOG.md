# Sonix - Error Log & Solutions

> This file documents every error we've encountered and how to fix it.
> Read this BEFORE attempting ANY build or debug session.

---

## 1. gradle.properties Corrupted (All Null Bytes)

**Symptom:** Build fails with `Could not get unknown property 'hermesEnabled'`
**Cause:** The `gradle.properties` file was overwritten with binary zeros during a file edit operation.
**Impact:** Complete build failure. No APK generated.

**Solution:**
- Always backup `gradle.properties` before editing
- If the file becomes corrupted, restore the full content from this log (see Appendix A)
- Never use `Set-Content` without `-Encoding UTF8` on gradle.properties

**Prevention:**
- Use `edit` tool with exact string replacement instead of full file writes
- Verify file content after any write operation

---

## 2. App Crash on Startup (Release APK)

**Symptom:** App opens splash screen then immediately closes. No error screen shown.
**Cause:** Initially thought to be native module issue, but actually the gradle.properties was corrupted (see #1). With correct gradle.properties, the app shows ErrorBoundary instead of crashing.
**Impact:** App unusable.

**Solution:**
- Fix gradle.properties corruption
- If ErrorBoundary shows "Something went wrong" (generic), modify App.js ErrorBoundary to show error details in production mode

**Prevention:**
- Always test with debug APK first to see JS errors
- Never suppress error details in production during development

---

## 3. Debug APK "Unable to load script"

**Symptom:** Red screen with "Unable to load script. Make sure you're running Metro..."
**Cause:** Debug APK tries to connect to Metro bundler dev server. If no server is running, it can't load the JS bundle.
**Impact:** App unusable in debug mode without Metro.

**Solution:**
- For release APKs: JS bundle is embedded in the APK (no Metro needed)
- For debug APKs: Must run `npx expo start` first, or use `npx expo run:android` which starts Metro automatically
- This is NOT a real error - it's expected behavior for debug builds

**Prevention:**
- Use release APKs for testing on physical devices
- Only use debug APKs when you have Metro running

---

## 4. newArchEnabled=false Ignored (RN 0.86+)

**Symptom:** Warning message: "Setting `newArchEnabled=false` in your `gradle.properties` file is not supported anymore since React Native 0.82."
**Cause:** React Native 0.86 (Expo SDK 57) always uses New Architecture. Cannot be disabled.
**Impact:** Setting has no effect. App always runs with Fabric + TurboModules.

**Solution:**
- Remove `newArchEnabled=false` from gradle.properties
- Keep `newArchEnabled=true` (or remove the line entirely - it's the default)
- Do NOT attempt to disable New Architecture

**Prevention:**
- All native modules must support Fabric/TurboModules
- Test all native features on fresh builds

---

## 5. Gradle Daemon Resource Exhaustion

**Symptom:** Shell tool kills processes with "ChildProcess.kill". All commands timeout.
**Cause:** Multiple Gradle daemon processes accumulate and consume all available memory/CPU.
**Impact:** Cannot run any commands. System becomes unresponsive.

**Solution:**
```powershell
taskkill /f /im java.exe
```
- Kill all Java processes before starting new builds
- Use `--no-daemon` flag for builds: `gradlew.bat assembleRelease --no-daemon`
- Reduce JVM memory if needed: `org.gradle.jvmargs=-Xmx1024m`

**Prevention:**
- Always run `gradlew.bat --stop` before starting a new build
- Don't run multiple Gradle builds simultaneously
- Monitor `tasklist /FI "IMAGENAME eq java.exe"` during builds

---

## 6. Shell Tool Timeout on Long Builds

**Symptom:** Gradle builds get killed before completion even with long timeouts.
**Cause:** The shell execution tool has an internal timeout limit that kills child processes.
**Impact:** Cannot complete 7-10 minute Gradle builds through direct shell commands.

**Solution:**
- Use batch files (.bat) that redirect output to a file
- Use subagent tasks to handle builds (recommended)
- Use `Start-Process` with `-NoNewWindow` for background builds

**Batch file approach:**
```batch
@echo off
cd /d "C:\path\to\android"
call .\gradlew.bat assembleRelease > build_output.txt 2>&1
echo BUILD_EXIT_CODE=%ERRORLEVEL%
```

**Prevention:**
- Always use subagent for builds
- Don't try to run Gradle directly through shell commands

---

## 7. Kotlin Incremental Cache Corruption

**Symptom:** Build fails with Kotlin compiler cache errors like `Could not delete caches-jvm`
**Cause:** Corrupted Kotlin incremental compilation cache after clean builds.
**Impact:** Build failure.

**Solution:**
- Delete the corrupted cache: `Remove-Item "android\app\build\kotlin" -Recurse -Force`
- Then retry the build

**Prevention:**
- After `gradlew clean`, also delete `app/build/kotlin` directory
- Use `--no-daemon` for clean builds to avoid cache conflicts

---

## 8. Expo Tunnel (ngrok) Disconnection

**Symptom:** Expo dev server shows "Tunnel connection has been closed" error.
**Cause:** ngrok tunnel intermittently disconnects. External service dependency.
**Impact:** Cannot use QR code to connect devices for development.

**Solution:**
- Restart Expo: `npx expo start --tunnel`
- Use LAN mode instead: `npx expo start --lan` (requires same network)
- Use direct IP: `npx expo start --host 192.168.1.5`

**Prevention:**
- Don't rely on tunnel for critical development
- Use release APKs for device testing

---

## 9. Expo Push Token Blocked by reCAPTCHA

**Symptom:** Cannot sign up for Expo push notification service. Account blocked.
**Cause:** Expo's reCAPTCHA blocks automated signups.
**Impact:** Cannot get Expo push token for notifications.

**Solution:**
- User must manually complete CAPTCHA on expo.dev
- Or use "Continue with Google" OAuth login
- Alternative: Use Firebase Cloud Messaging instead

**Prevention:**
- Set up Expo push token account early in development
- Don't rely on automated signup flows

---

## 10. Static IP Changes (LAN)

**Symptom:** APK cannot connect to backend because IP address changed.
**Cause:** Local network IP (192.168.1.x) changes when router restarts.
**Impact:** App cannot reach API server.

**Solution:**
- Deploy backend to cloud (Railway, AWS, etc.)
- Use cloud URL in .env: `EXPO_PUBLIC_API_URL=https://your-app.up.railway.app/api`
- Don't use local IP for release APKs

**Prevention:**
- Always deploy backend before building release APK
- Never hardcode local IP addresses

---

## 11. React Native Worklets + Reanimated Version Conflict

**Symptom:** Native crash on startup related to worklets/reanimated.
**Cause:** `react-native-worklets` version must be compatible with `react-native-reanimated` version.
**Impact:** App crash.

**Current Versions:**
- `react-native-reanimated`: 4.5.0
- `react-native-worklets`: 0.10.0

**Solution:**
- Run `npx expo install --fix` to sync versions
- Check compatibility before upgrading either package

**Prevention:**
- Never upgrade reanimated or worklets independently
- Always check changelog for version compatibility

---

## 12. build.gradle hermesEnabled Property Access

**Symptom:** `Could not get unknown property 'hermesEnabled' for object of type DefaultDependencyHandler`
**Cause:** The `hermesEnabled` property is accessed inside the `dependencies {}` block where project properties aren't directly available without React Native plugin initialization.
**Impact:** Build failure.

**Current Working Pattern (build.gradle):**
```groovy
dependencies {
    implementation("com.facebook.react:react-android")
    if (hermesEnabled.toBoolean()) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation jscFlavor
    }
}
```

**Solution:**
- Ensure React Native Gradle Plugin is applied: `apply plugin: "com.facebook.react"`
- Ensure `hermesEnabled=true` is in gradle.properties
- Don't delete `.gradle` directory (contains plugin state)

---

## 13. ErrorBoundary Hiding Error Details in Production

**Symptom:** App shows generic "Something went wrong" without error details in release builds.
**Cause:** ErrorBoundary has `if (!__DEV__)` check that hides error details in production.
**Impact:** Cannot debug production errors.

**Solution:**
- During development, always show error details in ErrorBoundary
- Remove or modify the `if (!__DEV__)` check to always show error info
- Only hide error details in final commercial release

**Current Working Pattern:**
```javascript
render() {
    if (this.state.error) {
      return (
        <View style={s.errorContainer}>
          <Text style={s.errorTitle}>⚠️ Something went wrong</Text>
          <ScrollView style={s.scrollArea}>
            <Text style={s.errorLabel}>Error:</Text>
            <Text style={s.errorMsg}>{this.state.error.message}</Text>
            {this.state.error.stack && (
              <>
                <Text style={s.errorLabel}>Stack:</Text>
                <Text style={s.errorStack}>{this.state.error.stack}</Text>
              </>
            )}
          </ScrollView>
          <TouchableOpacity style={s.errorBtn} onPress={() => this.setState({ error: null })}>
            <Text style={s.errorBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
}
```

---

## Appendix A: gradle.properties Full Content

```properties
# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true
android.useAndroidX=true
android.enablePngCrunchInReleaseBuilds=true
reactNativeArchitectures=arm64-v8a
newArchEnabled=true
hermesEnabled=true
edgeToEdgeEnabled=true
expo.gif.enabled=true
expo.webp.enabled=true
expo.webp.animated=false
EX_DEV_CLIENT_NETWORK_INSPECTOR=true
expo.useLegacyPackaging=false
expo.inlineModules.watchedDirectories=[]
```

---

## Appendix B: Standard Build Commands

```bash
# Clean build (recommended before release builds)
taskkill /f /im java.exe
Remove-Item "android\app\build" -Recurse -Force
Remove-Item "android\.gradle" -Recurse -Force
Remove-Item "android\app\build\kotlin" -Recurse -Force

# Build release APK (use subagent or batch file)
cd android
gradlew.bat assembleRelease

# Build debug APK (requires Metro server)
cd android
gradlew.bat assembleDebug

# Stop all Gradle daemons
gradlew.bat --stop

# Check for running Java processes
tasklist /FI "IMAGENAME eq java.exe"
```

---

## Appendix C: Key File Locations

| File | Path |
|------|------|
| gradle.properties | `android/gradle.properties` |
| build.gradle | `android/app/build.gradle` |
| App.js (ErrorBoundary) | `App.js` |
| AppNavigator | `src/navigation/AppNavigator.js` |
| FeedScreen | `src/screens/FeedScreen.js` |
| ProfileScreen | `src/screens/ProfileScreen.js` |
| MessagesScreen | `src/screens/MessagesScreen.js` |
| LoginScreen | `src/screens/LoginScreen.js` |
| DesignSystem | `src/design/DesignSystem.js` |
| .env | `.env` |
| package.json | `package.json` |

---

## 14. Animated Imported from "react" Instead of "react-native"

**Symptom:** `TypeError: undefined cannot be used as a constructor. at Skeleton`
**Cause:** `import Animated, { useRef, useEffect } from "react"` — Animated is not exported from "react", so it's undefined.
**Impact:** App crashes on startup with ErrorBoundary.

**Wrong:**
```javascript
import Animated, { useRef, useEffect } from "react";  // ❌ Animated is undefined
```

**Correct:**
```javascript
import { useRef, useEffect } from "react";
import { Animated } from "react-native";
```

**Solution:**
- Always import `Animated` from `react-native`
- Only import hooks (`useRef`, `useEffect`, `useCallback`, etc.) from `react`

**Prevention:**
- Before building, grep for `import.*Animated.*from.*"react"` (without `react-native`)
- Any match is a bug

---

*Last updated: 2026-07-22*
*Session: Phase 1 UI/UX Redesign + Build Debugging*
