# Phase 1.3: QR Code Check-In System - Testing Plan

## Overview

This document outlines testing strategies for the QR code check-in system during development, especially when developing on a computer without a fully set up PWA. The plan covers multiple testing approaches to validate QR code generation, scanning, and the complete check-in flow.

## Testing Phases

### Phase 1: Basic QR Code Validation (Early Development)

**Goal:** Verify QR code generation and format without needing the full scanner component.

**Method: Phone Native Camera App**

1. **Setup:**
   - Display QR code on computer screen (user QR display page)
   - Open phone's native camera app or QR scanner app

2. **Test Steps:**
   - Navigate to `/events/[id]/qr` page on computer
   - Generate and display QR code
   - Scan QR code with phone's native camera app
   - Verify scanned string matches format: `user-${userId}-${eventId}`

3. **What This Tests:**
   - ✅ QR code generation works correctly
   - ✅ QR code format is valid (`user-${userId}-${eventId}`)
   - ✅ QR code is readable/scannable
   - ✅ QR code image quality is sufficient

4. **What This Doesn't Test:**
   - ❌ Your scanner component
   - ❌ Camera permissions in your app
   - ❌ Scanner UI/UX
   - ❌ Integration with check-in flow

**When to Use:**
- Early development to verify QR code generation
- Quick format validation
- Testing QR code image quality
- No setup required - works immediately

---

### Phase 2: Scanner Component Testing (Before PWA)

**Goal:** Test the actual scanner component and full check-in flow.

**Method: Phone Browser + Your Scanner Component**

1. **Setup Options:**

   **Option A: Local Network Access**
   ```bash
   # Find your computer's IP address
   # macOS/Linux:
   ifconfig | grep "inet "
   
   # Windows:
   ipconfig
   
   # Start Next.js with network access
   next dev -H 0.0.0.0
   
   # On phone, navigate to:
   http://192.168.1.XXX:3000
   # (Replace XXX with your actual IP address)
   ```

   **Option B: ngrok (Recommended)**
   ```bash
   # Install ngrok globally
   npm install -g ngrok
   
   # Create tunnel to your Next.js dev server
   ngrok http 3000
   
   # Use the provided HTTPS URL on your phone
   # Example: https://abc123.ngrok.io
   ```

   **Option C: localtunnel (Alternative)**
   ```bash
   # Install localtunnel
   npm install -g localtunnel
   
   # Create tunnel
   lt --port 3000
   
   # Use the provided URL on your phone
   ```

2. **Test Steps:**
   - Access your dev server on phone browser
   - Navigate to scanner page: `/events/[id]/checkin`
   - Grant camera permission when prompted
   - Display QR code on computer screen (from `/events/[id]/qr`)
   - Use your app's scanner component to scan the QR code
   - Verify check-in flow works end-to-end

3. **What This Tests:**
   - ✅ Your scanner component works
   - ✅ Camera permissions handling
   - ✅ Scanner UI/UX
   - ✅ Full check-in flow integration
   - ✅ Real-time updates
   - ✅ Error handling

**When to Use:**
- Testing the actual scanner component
- End-to-end flow testing
- Before PWA deployment
- Testing camera permissions

---

### Phase 3: Manual Input Testing (Rapid Development)

**Goal:** Rapid iteration on validation logic and check-in flow without camera setup.

**Method: Development Mode with Manual Input**

1. **Implementation:**
   Add a development-only manual input field to the scanner component:

   ```javascript
   // In components/QRScanner.js
   const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

   // Show manual input in dev mode
   {DEV_MODE && (
     <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
       <p className="text-sm text-yellow-800 mb-2">Dev Mode: Manual QR Input</p>
       <Input
         placeholder="Enter QR code: user-{userId}-{eventId}"
         onChange={(e) => {
           const value = e.target.value.trim()
           if (value.startsWith('user-') && value.split('-').length === 4) {
             onScan(value)
           }
         }}
       />
     </div>
   )}
   ```

2. **Test Steps:**
   - Enable dev mode: `NEXT_PUBLIC_DEV_MODE=true`
   - Open scanner page on computer
   - Manually enter QR code string: `user-{userId}-{eventId}`
   - Test validation logic
   - Test check-in flow

3. **What This Tests:**
   - ✅ QR code validation logic
   - ✅ Check-in flow (without camera)
   - ✅ Error handling
   - ✅ Rapid iteration on backend logic

**When to Use:**
- Rapid development iteration
- Testing validation logic quickly
- Testing check-in flow without camera
- Debugging backend functions

---

## Complete Testing Checklist

### QR Code Generation Testing

- [ ] QR code displays correctly on computer screen
- [ ] QR code format is correct: `user-${userId}-${eventId}`
- [ ] QR code is scannable with phone camera app
- [ ] QR code image is clear and readable (300x300px minimum)
- [ ] QR code updates when event or user changes
- [ ] QR code shows correct check-in status

### QR Code Scanning Testing

- [ ] Computer webcam works for scanning (if available)
- [ ] Phone can scan QR codes displayed on computer
- [ ] Scanner component handles camera permissions correctly
- [ ] Scanner correctly extracts userId and eventId from QR string
- [ ] Error handling works for invalid QR codes
- [ ] Scanner shows success/error feedback
- [ ] Scanner stops after successful scan

### Check-In Flow Testing

- [ ] Generate QR code on computer (user view)
- [ ] Scan QR code with phone camera (host view)
- [ ] Verify check-in works correctly
- [ ] Test with multiple devices simultaneously
- [ ] Test real-time updates across devices
- [ ] Test error cases (invalid QR, not approved, already checked in)

### Geolocation Testing

- [ ] Location permission request works
- [ ] Location tracking starts after check-in
- [ ] Location updates periodically (every 30-60 seconds)
- [ ] Radius checking works correctly
- [ ] Automatic check-out works when user leaves radius
- [ ] Time threshold (5 minutes) works correctly
- [ ] Manual check-out works as fallback

### Integration Testing

- [ ] End-to-end check-in flow works
- [ ] User can display QR code
- [ ] Host can scan and check in user
- [ ] Check-in list updates immediately
- [ ] Check-out removes user from list
- [ ] Real-time updates work across multiple devices
- [ ] Geolocation auto check-out works correctly

---

## Testing Tools & Setup

### Required Tools

1. **QR Code Scanner Apps:**
   - Phone native camera app (iOS/Android)
   - QR Code Reader apps (optional)

2. **Network Access Tools:**
   - ngrok (recommended for HTTPS)
   - localtunnel (alternative)
   - Local network access (simplest)

3. **Development Tools:**
   - Browser DevTools (for debugging)
   - Network tab (for API calls)
   - Console logs (for debugging)

### Environment Variables

Add to `.env.local` for development:

```bash
# Enable dev mode for manual QR input
NEXT_PUBLIC_DEV_MODE=true

# Optional: Mock geolocation for testing
NEXT_PUBLIC_MOCK_GEOLOCATION=true
```

---

## Test Scenarios

### Scenario 1: Basic QR Code Generation

**Setup:**
- User logged in
- Event created with location
- User has approved event request

**Steps:**
1. Navigate to `/events/[id]/qr` on computer
2. Verify QR code displays
3. Scan with phone camera app
4. Verify format: `user-{userId}-{eventId}`

**Expected Result:**
- QR code displays correctly
- Scanned string matches expected format

---

### Scenario 2: Scanner Component with Phone

**Setup:**
- Dev server accessible on phone (via ngrok or local network)
- Host logged in on phone
- User QR code displayed on computer

**Steps:**
1. Open `/events/[id]/checkin` on phone browser
2. Grant camera permission
3. Scan QR code displayed on computer
4. Verify check-in succeeds

**Expected Result:**
- Scanner opens camera
- QR code scans successfully
- Check-in completes
- User appears in check-in list

---

### Scenario 3: Manual Input Testing

**Setup:**
- Dev mode enabled
- Scanner page open on computer

**Steps:**
1. Enter valid QR code: `user-abc123-def456`
2. Verify check-in succeeds
3. Enter invalid QR code: `invalid-format`
4. Verify error message

**Expected Result:**
- Valid QR codes trigger check-in
- Invalid QR codes show error
- Validation logic works correctly

---

### Scenario 4: Geolocation Auto Check-Out

**Setup:**
- User checked in
- Location permission granted
- Event location set

**Steps:**
1. User checks in (via QR scan)
2. Location tracking starts
3. Simulate user leaving radius (move phone away or mock location)
4. Wait 5+ minutes
5. Verify automatic check-out

**Expected Result:**
- Location tracking starts after check-in
- User automatically checked out after leaving radius for 5+ minutes
- Check-in list updates in real-time

---

## Troubleshooting

### Camera Not Working

**Issue:** Camera doesn't open on computer/phone

**Solutions:**
- Check browser permissions (Settings > Privacy > Camera)
- Try different browser (Chrome recommended)
- Check if camera is being used by another app
- Use manual input mode for testing

### QR Code Not Scanning

**Issue:** QR code doesn't scan or scans incorrectly

**Solutions:**
- Increase QR code size (minimum 300x300px)
- Improve lighting
- Check QR code format matches: `user-{userId}-{eventId}`
- Verify QR code image quality
- Try different QR code library settings

### Network Access Issues

**Issue:** Can't access dev server on phone

**Solutions:**
- Check computer and phone are on same network
- Verify firewall allows port 3000
- Use ngrok for HTTPS access
- Check IP address is correct
- Try localtunnel as alternative

### Geolocation Not Working

**Issue:** Location tracking doesn't start

**Solutions:**
- Check location permission granted
- Verify event has location set
- Check browser supports geolocation API
- Use mock location for testing
- Check console for errors

---

## Quick Test Commands

### Generate Test QR Code

```javascript
// In browser console on /events/[id]/qr page
const testQR = `user-${userId}-${eventId}`
console.log('Test QR Code:', testQR)
```

### Test QR Validation

```javascript
// In browser console
const validateQR = (qr, eventId, userId) => {
  const expected = `user-${userId}-${eventId}`
  return qr === expected
}

validateQR('user-abc123-def456', 'def456', 'abc123') // Should return true
```

### Mock Location for Testing

```javascript
// In browser console (Chrome DevTools)
// Override geolocation for testing
navigator.geolocation.getCurrentPosition = (success) => {
  success({
    coords: {
      latitude: 37.7749,  // Event location
      longitude: -122.4194
    }
  })
}
```

---

## Best Practices

1. **Start Simple:** Use phone native camera for initial validation
2. **Progress Gradually:** Move to scanner component testing once basic validation works
3. **Use Dev Mode:** Manual input for rapid iteration
4. **Test Real Devices:** Use actual phones for realistic testing
5. **Test Edge Cases:** Invalid QR codes, permission denied, network errors
6. **Document Issues:** Keep track of bugs and solutions
7. **Test Across Browsers:** Chrome, Safari, Firefox
8. **Test Network Conditions:** Slow network, offline mode

---

## Next Steps

1. Set up ngrok or local network access
2. Enable dev mode for manual input
3. Test QR code generation with phone camera
4. Test scanner component on phone browser
5. Test geolocation tracking
6. Test end-to-end flow
7. Document any issues or improvements needed

---

## Additional Resources

- [html5-qrcode Documentation](https://github.com/mebjas/html5-qrcode)
- [jsQR Documentation](https://github.com/cozmo/jsQR)
- [ngrok Documentation](https://ngrok.com/docs)
- [Geolocation API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

