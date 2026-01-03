# iPhone PWA Installation and Usage Guide

## Overview

This guide provides detailed instructions for installing and using BidMVP as a Progressive Web App (PWA) on iPhone. PWAs allow the app to be installed on the home screen and run in standalone mode, providing a native app-like experience without downloading from the App Store.

**What is a PWA?** A Progressive Web App is a website that behaves like a native mobile app. Once installed, it appears on your home screen, runs in full-screen mode, and works even when you have limited connectivity.

---

## Prerequisites

Before installing BidMVP as a PWA on your iPhone, ensure you meet these requirements:

### Required iOS Version
- **iOS 11.3 or later** (iOS 16.4+ recommended for best experience)
- Check your iOS version: Settings → General → About → Software Version

### Browser Requirement
- **Must use Safari** - PWAs only work in Safari on iOS
  - Chrome, Firefox, and other browsers on iOS do not support PWA installation
  - Safari is pre-installed on all iPhones

### Network Requirements
- **HTTPS connection** - The app must be served over HTTPS (automatically handled when deployed to Vercel)
- **Internet connection** - Required for initial installation and most app features

### App Deployment
- The app must be deployed to a production URL (e.g., Vercel deployment)
- The manifest.json and service worker must be accessible

---

## Installation Instructions (Step-by-Step)

Follow these steps to install BidMVP on your iPhone home screen:

### Step 1: Open the App in Safari

1. Open the **Safari** app on your iPhone (not Chrome or any other browser)
2. Navigate to your BidMVP URL (e.g., `https://your-app.vercel.app`)
3. Wait for the page to fully load

### Step 2: Access the Share Menu

1. Tap the **Share button** - This is the square icon with an upward arrow at the bottom of Safari
   - On iPhone X and later: Located at the bottom center of the screen
   - On older iPhones: Located at the bottom toolbar
   - The icon looks like a square with an arrow pointing up out of it

2. The Share menu will appear with various options

### Step 3: Find "Add to Home Screen"

1. Scroll down in the Share menu to find more options
2. Look for the **"Add to Home Screen"** option
   - It may appear as an icon with a plus sign (+)
   - The text says "Add to Home Screen" or "Add to Home"
   - If you don't see it, scroll further down - it's usually near the bottom

3. If "Add to Home Screen" is not visible:
   - Try scrolling up and down in the share menu
   - Check if you're using Safari (not Chrome or other browsers)
   - Ensure you're on an HTTPS URL
   - Make sure the page has fully loaded

### Step 4: Customize the App Icon and Name (Optional)

1. Tap **"Add to Home Screen"**
2. A preview screen will appear showing:
   - **App Icon** - The BidMVP icon (currently a placeholder blue circle with "BM")
   - **App Name** - Defaults to "BidMVP" but you can edit it

3. To change the name:
   - Tap in the text field above the icon
   - Type your preferred name (e.g., "BidMVP", "My Fraternity App")
   - The name will appear under the icon on your home screen

4. You cannot change the icon from this screen (it's set by the app)

### Step 5: Confirm Installation

1. Tap the **"Add"** button in the top-right corner
2. You'll be taken back to your home screen
3. The BidMVP app icon will appear on your home screen
   - The icon should match the one you saw in the preview
   - It will be placed at the end of your current home screen apps

### Step 6: Verify Installation

1. Look for the BidMVP icon on your home screen
2. The icon should be visible and clickable
3. If you don't see it:
   - Check other home screen pages (swipe left/right)
   - Scroll down on your home screen
   - The icon may have been added to a different page

---

## Verification Steps

After installation, verify that everything is working correctly:

### Check 1: App Icon Appearance

- [ ] The BidMVP icon appears on your home screen
- [ ] The icon looks correct (blue circle with "BM" or custom icon if replaced)
- [ ] The app name is displayed under the icon

### Check 2: Launch in Standalone Mode

1. Tap the BidMVP icon on your home screen
2. The app should open in **standalone mode**:
   - No Safari browser UI (no address bar, no toolbar)
   - Full-screen experience
   - Status bar shows your device time, battery, signal

3. If the app opens in Safari instead:
   - You may have opened the website link instead of the installed app
   - Uninstall and reinstall following the installation steps
   - Ensure you tapped the icon from the home screen, not from Safari bookmarks

### Check 3: Standalone Mode Indicators

When the app is running in standalone mode, you should see:
- **No address bar** - The URL bar is hidden
- **No Safari navigation buttons** - No back/forward buttons
- **Full-screen content** - App takes up the entire screen
- **Status bar at top** - Shows time, battery, signal (iOS system bar)
- **Swipe gestures work** - Navigation gestures should function normally

### Check 4: App Functionality

1. Test basic navigation within the app
2. Try logging in or accessing features
3. Verify that buttons and links work correctly
4. Check that the app feels responsive

---

## Using the Installed App

### Launching the App

To open BidMVP after installation:
1. Find the BidMVP icon on your home screen
2. Tap the icon once
3. The app will launch in standalone mode (full-screen, no browser UI)

### Differences Between Browser and Standalone Mode

| Feature | Browser Mode (Safari) | Standalone Mode (PWA) |
|---------|----------------------|----------------------|
| Address Bar | Visible | Hidden |
| Navigation Buttons | Visible | Hidden |
| Screen Space | Reduced (UI takes space) | Full-screen |
| Home Screen Icon | No | Yes |
| Launch Method | Open Safari → Navigate | Tap home screen icon |
| App-like Feel | No | Yes |

### Status Bar Behavior

- The status bar (time, battery, signal) is always visible at the top
- The status bar style matches your iOS settings
- Status bar color is set by the app (default/light content)

### Full-Screen Experience

- App content extends to screen edges
- On devices with notches (iPhone X and later), content respects safe areas
- Navigation uses gestures (swipe, tap) instead of browser buttons

### Switching Between Apps

- Use the home button or swipe up (on newer iPhones) to exit the app
- Use app switcher to return to BidMVP
- The app maintains its state when switching (similar to native apps)

---

## Features Available in PWA Mode

All BidMVP features work the same in PWA mode as they do in a browser. Here are key features:

### Core Features (Always Available)

- ✅ **Authentication** - Sign up, sign in, sign out
- ✅ **Profile Management** - View and edit your profile
- ✅ **Fraternity Management** - Join, create, view fraternities
- ✅ **Friends System** - Add friends, manage friend requests
- ✅ **Navigation** - All pages and routes work normally

### Advanced Features (When Implemented)

- ✅ **QR Code Scanning** (Phase 1.3) - Camera access works in PWA mode
  - Tap to scan QR codes for event check-ins
  - Camera permissions work just like in Safari
  
- ✅ **Geolocation** (Phase 1.3, 4.1) - Location tracking works in PWA mode
  - Share your location for events
  - Location permissions work normally
  
- ✅ **Real-time Updates** (Phase 1.5, 4.1) - WebSockets work in PWA mode
  - Live updates for messages and notifications
  - Real-time event updates

### Offline Functionality

- **Cached Pages** - Previously visited pages may load offline
- **Service Worker** - Automatically caches app resources
- **Limited Functionality** - Most features require internet connection
- **Graceful Degradation** - App shows appropriate messages when offline

### Permissions

PWA mode supports the same permissions as Safari:
- **Camera** - For QR code scanning and photo uploads
- **Location** - For geolocation features
- **Notifications** - Limited support on iOS (improved in iOS 16.4+)
- **Storage** - Local storage and cookies work normally

---

## Troubleshooting Common Issues

### Issue 1: "Add to Home Screen" Option Not Appearing

**Symptoms:**
- The "Add to Home Screen" option doesn't appear in the Safari Share menu
- You've scrolled through all options but can't find it

**Solutions:**

1. **Verify you're using Safari:**
   - Chrome, Firefox, and other browsers on iOS don't support PWA installation
   - Only Safari supports PWAs on iPhone
   - Switch to Safari and try again

2. **Check iOS version:**
   - PWAs require iOS 11.3 or later
   - Go to Settings → General → About → Software Version
   - Update iOS if your version is too old

3. **Verify HTTPS connection:**
   - PWAs only work over HTTPS
   - Check that the URL starts with `https://` (not `http://`)
   - If testing locally, you'll need to use a tool like ngrok for HTTPS

4. **Clear Safari cache:**
   - Go to Settings → Safari → Clear History and Website Data
   - Reload the page and try again

5. **Check if page fully loaded:**
   - Wait for the page to completely load before accessing Share menu
   - Refresh the page if it seems stuck loading

6. **Try private browsing mode:**
   - Sometimes Safari extensions interfere
   - Open a new Private tab and try installing from there

### Issue 2: App Opens in Safari Instead of Standalone Mode

**Symptoms:**
- After installation, tapping the icon opens Safari with the website
- Browser UI (address bar, buttons) is visible instead of full-screen

**Solutions:**

1. **Verify you tapped the home screen icon:**
   - Make sure you're tapping the icon from your home screen
   - Don't tap links from Safari bookmarks or favorites
   - The installed app icon should be separate from Safari bookmarks

2. **Reinstall the app:**
   - Delete the current home screen icon (long press → Remove App)
   - Follow the installation steps again from scratch
   - Ensure "Add to Home Screen" was used (not "Add Bookmark")

3. **Check app manifest:**
   - This is usually a developer-side issue
   - Verify the manifest.json is accessible and valid
   - Check that `display: "standalone"` is set in manifest

### Issue 3: Icons Not Displaying Correctly

**Symptoms:**
- App icon shows as a blank or generic icon
- Icon doesn't match expected design
- Icon appears blurry or pixelated

**Solutions:**

1. **Clear Safari cache:**
   - Settings → Safari → Clear History and Website Data
   - Reinstall the app to refresh cached icons

2. **Check icon files:**
   - Developer should verify all icon sizes exist in `/public/icons/`
   - Icons should be PNG format
   - Ensure icons are accessible at the paths specified in manifest.json

3. **Wait for icon cache to update:**
   - iOS caches app icons
   - After updating icons, it may take time for changes to appear
   - Try removing and reinstalling the app

4. **Verify icon dimensions:**
   - Icons should be square (same width and height)
   - Recommended sizes are 192x192 and 512x512 pixels
   - Icons are automatically scaled by iOS

### Issue 4: Service Worker Not Registering

**Symptoms:**
- Offline functionality doesn't work
- App doesn't cache resources
- Console shows service worker errors

**Solutions:**

1. **Check HTTPS requirement:**
   - Service workers only work over HTTPS
   - Verify the URL uses `https://`
   - If testing locally, use ngrok or similar for HTTPS

2. **Clear service worker cache:**
   - Settings → Safari → Advanced → Website Data
   - Find your app URL and clear its data
   - Reload the page to re-register service worker

3. **Check browser console:**
   - Open Safari Web Inspector (Settings → Safari → Advanced → Web Inspector)
   - Connect to your Mac and check console for errors
   - Look for service worker registration messages

4. **Verify service worker file:**
   - Developer should check that `/sw.js` exists in public folder
   - Service worker should be generated during build
   - Check that service worker is accessible at `/sw.js` path

### Issue 5: Offline Mode Not Working

**Symptoms:**
- App doesn't load when internet is disconnected
- Previously visited pages don't work offline
- Error messages appear when offline

**Solutions:**

1. **Verify service worker is active:**
   - Service worker must be registered for offline support
   - See "Service Worker Not Registering" troubleshooting above

2. **Check what's cached:**
   - Only visited pages may be cached
   - Navigate through the app while online first
   - Service worker caches pages as you visit them

3. **Understand offline limitations:**
   - Most features require internet (authentication, API calls)
   - Only static content and previously visited pages work offline
   - This is expected behavior for most web apps

4. **Test offline functionality:**
   - Turn on Airplane Mode to test offline behavior
   - Some features may show error messages (this is normal)
   - Cached pages should still load

### Issue 6: App Not Updating

**Symptoms:**
- Changes to the app don't appear after deployment
- Old version continues to run
- Updates don't seem to apply

**Solutions:**

1. **Force refresh:**
   - Close the app completely (swipe up to app switcher, swipe up on app)
   - Reopen the app
   - Service worker checks for updates on launch

2. **Clear app data:**
   - Settings → Safari → Advanced → Website Data
   - Find your app URL and clear its data
   - This forces a fresh download on next launch

3. **Reinstall the app:**
   - Remove the app from home screen
   - Follow installation steps again
   - This ensures you get the latest version

4. **Check service worker update strategy:**
   - Updates are handled automatically by the service worker
   - It may take a few app launches for updates to apply
   - Service worker checks for updates in the background

### Issue 7: Can't Find Installed App Icon

**Symptoms:**
- You installed the app but can't find the icon
- Icon isn't where you expected it

**Solutions:**

1. **Check all home screen pages:**
   - Swipe left and right on home screen
   - Icon may have been added to a different page
   - Check the last page (furthest right)

2. **Use Spotlight search:**
   - Swipe down on home screen
   - Search for "BidMVP"
   - Tap the result to open and see its location

3. **Check if installation completed:**
   - Verify you tapped "Add" in the installation preview
   - If installation was cancelled, the icon won't be created
   - Try the installation process again

---

## Updating the App

### Automatic Updates

BidMVP PWA updates automatically:

1. **Service Worker Updates:**
   - The service worker checks for updates when the app launches
   - New versions are downloaded in the background
   - Updates apply on the next app launch (after closing and reopening)

2. **How Updates Work:**
   - You don't need to do anything - updates happen automatically
   - Changes may take a few app launches to appear
   - Old cached content is replaced with new versions

### Manual Update Process

If you want to force an update:

1. **Close the app completely:**
   - Open app switcher (swipe up from bottom, then swipe up)
   - Swipe up on the BidMVP app to close it
   - Wait a few seconds

2. **Reopen the app:**
   - Tap the BidMVP icon again
   - The service worker will check for updates
   - New version should load

3. **If update doesn't appear:**
   - Clear app data: Settings → Safari → Advanced → Website Data
   - Find your app URL and tap "Remove All Website Data"
   - Reopen the app to get fresh version

### Version Checking

To check if you have the latest version:

1. Look at the app's behavior and features
2. Compare with what's described in release notes
3. If features are missing, try manual update process above
4. Contact support if you continue to see outdated versions

### Cache Clearing

If you experience issues after an update:

1. **Clear Safari cache for the app:**
   - Settings → Safari → Advanced → Website Data
   - Find your BidMVP URL
   - Tap "Remove All Website Data" for that site
   - Reopen the app

2. **Complete reinstallation:**
   - Remove app from home screen (long press → Remove App)
   - Reinstall following installation instructions
   - This ensures clean install of latest version

---

## Uninstallation

### Removing the App from Home Screen

To uninstall BidMVP PWA:

1. **Long press the BidMVP icon** on your home screen
2. A menu will appear with options
3. Tap **"Remove App"** or the "X" button that appears
4. Confirm removal when prompted

**Note:** Uninstalling removes the home screen icon but does NOT delete:
- Your account data (still stored in the cloud)
- Your login sessions (may remain in Safari)
- Website data cached by Safari

### What Happens to Your Data

After uninstalling:

- **Account data:** Still exists - you can log in again from Safari
- **Local storage:** May be cleared or retained (depending on Safari settings)
- **Cookies:** May persist in Safari
- **Cached content:** Service worker cache may remain until Safari clears it

### Reinstalling After Removal

You can reinstall the app anytime:

1. Open Safari
2. Navigate to your BidMVP URL
3. Follow the installation instructions again
4. Your account and data will still be available after logging in

### Complete Data Removal

To completely remove all app data:

1. Uninstall the app (remove from home screen)
2. Go to Settings → Safari → Advanced → Website Data
3. Find your BidMVP URL
4. Tap "Remove All Website Data"
5. This clears all cached content, cookies, and local storage

---

## Developer Testing Tips

### Testing on Physical Device vs Simulator

**Physical Device (Recommended):**
- Most accurate testing experience
- Real iOS behavior and performance
- Actual network conditions
- Real device limitations

**iOS Simulator:**
- Faster for initial testing
- Can test multiple iOS versions
- But PWA features may behave differently
- Some features (camera, location) need special setup

**Recommendation:** Always test PWA installation on a real iPhone before release.

### Using Vercel Preview URLs

When testing deployments:

1. **Deploy to Vercel:**
   - Each commit gets a preview URL
   - Preview URLs use HTTPS automatically
   - Perfect for testing PWA installation

2. **Test Installation:**
   - Open preview URL in Safari on iPhone
   - Follow installation steps
   - Verify standalone mode works

3. **Test Updates:**
   - Install app from preview URL
   - Deploy new changes
   - Verify updates apply correctly

### Clearing Service Worker for Testing

To test service worker behavior:

1. **Clear service worker cache:**
   ```javascript
   // In Safari Web Inspector console:
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister())
   })
   ```

2. **Clear Safari data:**
   - Settings → Safari → Advanced → Website Data
   - Remove data for your test URL
   - Reload page to re-register service worker

3. **Test installation from scratch:**
   - Remove installed app
   - Clear all website data
   - Reinstall and test installation flow

### Checking Console Logs

To debug PWA issues:

1. **Enable Web Inspector:**
   - Settings → Safari → Advanced → Web Inspector (enable)

2. **Connect to Mac:**
   - Connect iPhone to Mac via USB
   - Open Safari on Mac
   - Safari → Develop → [Your iPhone] → [Your App URL]

3. **Check console for:**
   - Service worker registration messages
   - Manifest loading errors
   - Icon loading errors
   - PWA-related warnings

4. **Check Network tab:**
   - Verify manifest.json loads (status 200)
   - Verify service worker loads (status 200)
   - Verify icon files load correctly

### Testing Offline Functionality

1. **Enable Airplane Mode:**
   - This simulates offline conditions
   - Test what still works
   - Verify error messages appear appropriately

2. **Test service worker cache:**
   - Visit pages while online
   - Enable Airplane Mode
   - Verify cached pages still load
   - Check that API calls fail gracefully

### Testing Installation Flow

1. **Test on clean device:**
   - Use device that hasn't installed the app
   - Clear Safari cache first
   - Test full installation process

2. **Test update flow:**
   - Install app
   - Make changes to app
   - Redeploy
   - Verify updates apply

3. **Test error scenarios:**
   - Try installing from non-HTTPS URL
   - Try installing from Chrome (shouldn't work)
   - Test with iOS version below 11.3

---

## Frequently Asked Questions (FAQ)

### Can I use Chrome on iPhone?

**No.** PWAs on iPhone only work in Safari. Chrome, Firefox, and other browsers on iOS do not support PWA installation. You must use Safari to install and use the PWA.

### Will it work on iPad?

**Yes!** The same installation process works on iPad. Open Safari on your iPad, navigate to the BidMVP URL, and follow the same installation steps. The app will work in full-screen mode on iPad as well.

### Do I need to be online to use the app?

**For most features, yes.** While some pages may be cached and work offline, most features require an internet connection:
- Authentication (login/signup)
- Loading data from the server
- Real-time updates
- API calls

Only previously visited static pages may work offline.

### How do I share the app with others?

You can share the app URL with others:
1. Open the installed app
2. If you need to share the URL, open it in Safari (copy URL from address bar)
3. Share the URL via text, email, etc.
4. Recipients can install it following the same installation steps

**Note:** Each person needs to install it on their own device - you can't directly share the installed app.

### What about Android?

Android has a different PWA installation process. Android users will see an install prompt automatically when they visit the site in Chrome. A separate Android guide would cover those instructions.

### Will the app work if I delete Safari?

**No.** The PWA depends on Safari's WebKit engine. Even if you install it to your home screen, it still uses Safari's rendering engine. You cannot delete Safari on iOS anyway - it's a core system app.

### Can I use the app on multiple iPhones?

**Yes.** Install the app on each iPhone separately:
1. Open Safari on each device
2. Navigate to the BidMVP URL
3. Follow installation steps on each device
4. Your account data will sync across devices when you log in

### Does the app use storage on my iPhone?

**Yes, but minimal.** The app caches:
- Previously visited pages
- App resources (images, scripts)
- Some local data

This is usually only a few megabytes. You can clear it anytime via Settings → Safari → Advanced → Website Data.

### Will the app work if the website goes down?

**Partially.** Cached pages may still load, but:
- You won't be able to log in
- You can't access new data
- API calls will fail
- Real-time features won't work

The offline functionality is limited to previously cached content.

### Can I add the app to a folder on my home screen?

**Yes!** After installation:
1. Long press the BidMVP icon
2. Drag it onto another app icon to create a folder
3. Or drag it into an existing folder
4. The app will work the same way from within a folder

### Will I get notifications from the app?

**Limited support on iOS.** iOS has limited push notification support for PWAs:
- iOS 16.4+ has improved PWA notification support
- Older iOS versions have very limited or no notification support
- Notifications work better on Android PWAs

This is an iOS limitation, not an app limitation.

### Can I use Face ID or Touch ID with the app?

**Yes, if the app implements it.** Face ID/Touch ID work through Safari's Web Authentication API. If the app uses biometric authentication, it will work in PWA mode the same way it works in Safari.

### What happens if I update iOS?

**Nothing special needed.** The PWA will continue to work after iOS updates. In fact, newer iOS versions often have improved PWA support, so you may see better functionality after updating.

### Can I use the app in landscape mode?

**Yes, if the app supports it.** The app's manifest specifies portrait mode as primary, but the app may still rotate if iOS rotation lock is off. The app's design determines if landscape layout is supported.

---

## Summary

Installing BidMVP as a PWA on iPhone provides a native app-like experience:
- ✅ Install to home screen with one tap
- ✅ Full-screen standalone mode
- ✅ Works offline (limited)
- ✅ All features work the same as in browser
- ✅ Automatic updates
- ✅ Camera and location access supported

**Key Requirements:**
- iOS 11.3+ (iOS 16.4+ recommended)
- Safari browser (required)
- HTTPS connection (automatic on Vercel)

**Installation:** Safari → Share → Add to Home Screen → Add

**Support:** If you encounter issues, refer to the Troubleshooting section above or contact support.

---

*Last Updated: [Current Date]*
*App Version: [Version Number]*

