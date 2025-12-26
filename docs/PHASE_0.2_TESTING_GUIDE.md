# Phase 0.2 Integration Testing Guide

## Prerequisites

Before testing, ensure:

1. **Storage Migration**: Run `lib/supabase/migrations/005_storage_setup.sql` in your Supabase SQL Editor
2. **Environment Variables**: `.env.local` has correct Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. **User Table**: Verify User table has columns: `name`, `year`, `gender`, `profile_pic`, `phone`
4. **Development Server**: Run `npm run dev` to start the app

## Test Cases

### Test 1: Complete Signup Flow ✅

**Objective**: Verify the entire signup process works end-to-end

**Steps**:
1. Navigate to `http://localhost:3000`
2. Click "Sign Up" button
3. Enter a `.edu` email address (e.g., `test@university.edu`)
4. Enter a password (minimum 6 characters)
5. Click "Continue"
6. **Phone Verification**:
   - Enter phone number in E.164 format (e.g., `+1234567890`)
   - Click "Send Verification Code"
   - **Note**: If SMS provider is not configured, this will fail. You can skip phone verification for MVP testing by temporarily commenting out the phone step in AuthModal
   - Enter the 6-digit code received
   - Click "Verify Code"
7. **Profile Setup**:
   - Enter your name
   - Select year (1-5)
   - Select gender (M/F/X)
   - Upload a profile photo:
     - Click the upload area
     - Select a JPEG, PNG, or WebP image (<5MB)
     - Wait for upload to complete
     - Verify preview appears
   - (Optional) Add social links:
     - Instagram username
     - Snapchat username
     - VSCO username
     - TikTok username
   - Click "Complete Profile"

**Expected Results**:
- ✅ Email signup succeeds
- ✅ Phone verification modal appears (or skip if not configured)
- ✅ Profile form appears after phone verification
- ✅ Photo uploads successfully and preview shows
- ✅ Profile is created in database
- ✅ Success message appears
- ✅ Modal closes or redirects

**How to Verify in Database**:
1. Go to Supabase Dashboard → Table Editor → `User`
2. Find your user record
3. Verify:
   - `name` field has your name
   - `year` field has selected year
   - `gender` field has selected gender
   - `profile_pic` field has a URL
4. Go to Supabase Dashboard → Storage → `profile-photos`
5. Verify your photo file exists in the bucket
6. Go to Supabase Dashboard → Table Editor → `social_links`
7. Verify social link records exist if you added any

---

### Test 2: Profile Completion Check ✅

**Objective**: Verify the onboarding page correctly checks profile completion

**Steps**:
1. Log in with an existing user account
2. Navigate to `http://localhost:3000/onboarding`
3. Observe the behavior

**Expected Results**:

**Scenario A - Incomplete Profile**:
- ✅ Loading spinner appears briefly
- ✅ Profile setup form is displayed
- ✅ Form has all required fields

**Scenario B - Complete Profile**:
- ✅ Loading spinner appears briefly
- ✅ Success message: "Profile complete!"
- ✅ Redirects to home page after 1 second

**How to Test Both Scenarios**:
- **Incomplete**: Create a user account but don't complete profile
- **Complete**: Complete the signup flow from Test 1

---

### Test 3: Photo Upload ✅

**Objective**: Verify photo upload functionality works correctly

**Steps**:
1. Start the signup flow or go to `/onboarding`
2. Click on the photo upload area
3. Test different scenarios:

**Test 3a - Valid Upload**:
- Select a valid image (JPEG, PNG, or WebP)
- File size < 5MB
- **Expected**: Preview appears, upload succeeds, no errors

**Test 3b - Invalid File Type**:
- Try to upload a PDF or text file
- **Expected**: Error message "Invalid file type. Please upload a JPEG, PNG, or WebP image."

**Test 3c - File Too Large**:
- Try to upload an image > 5MB
- **Expected**: Error message "File size too large. Maximum size is 5MB."

**Test 3d - Remove Photo**:
- Upload a photo
- Click the × button to remove
- **Expected**: Preview disappears, photo is removed

**How to Verify**:
- Check browser console for any errors
- Verify photo appears in Supabase Storage bucket
- Verify `profile_pic` URL in User table is valid

---

### Test 4: Phone Verification ⚠️

**Objective**: Verify phone verification works (if SMS provider configured)

**Note**: This test requires SMS provider configuration in Supabase. If not configured, skip this test.

**Steps**:
1. Start signup flow
2. After email signup, phone verification modal appears
3. Enter phone number in E.164 format: `+1234567890`
4. Click "Send Verification Code"
5. Wait for SMS (may take a few seconds)
6. Enter the 6-digit code
7. Click "Verify Code"

**Expected Results**:
- ✅ Code is sent successfully
- ✅ Success message appears
- ✅ Code input step appears
- ✅ Code verification succeeds
- ✅ Flow continues to profile setup

**Error Scenarios**:
- Invalid phone format → Error message displayed
- Wrong code → Error message displayed
- Resend code → New code sent after 60 seconds

---

### Test 5: Error Handling ✅

**Objective**: Verify error handling works correctly

**Test Scenarios**:

**5a - Invalid Email**:
- Try to sign up with non-.edu email
- **Expected**: Error "Only .edu email addresses are allowed to sign up"

**5b - Missing Required Fields**:
- Try to submit profile form without filling required fields
- **Expected**: 
  - Form validation prevents submission
  - Error messages appear for missing fields

**5c - Invalid Year**:
- Try to submit with invalid year (though dropdown prevents this)
- **Expected**: Form validation prevents invalid submission

**5d - Network Error**:
- Disconnect internet
- Try to submit profile
- **Expected**: Error message displayed, form doesn't crash

**5e - Database Error**:
- If user already exists, try to create profile again
- **Expected**: Appropriate error message displayed

---

### Test 6: Login Flow ✅

**Objective**: Verify existing users can log in

**Steps**:
1. Navigate to home page
2. Click "Log In"
3. Enter existing user's email and password
4. Click "Log In"

**Expected Results**:
- ✅ Login succeeds
- ✅ Modal closes
- ✅ Welcome message appears with user email
- ✅ Sign Out button appears

---

## Manual Testing Checklist

Use this checklist to track your testing progress:

### Integration Tests
- [ ] PhotoUpload component uses real upload function
- [ ] PhoneVerificationModal uses real phone functions
- [ ] AuthModal uses real createUserProfile function
- [ ] Onboarding page uses real checkProfileComplete function
- [ ] All mock imports have been replaced

### Functional Tests
- [ ] Complete signup flow works end-to-end
- [ ] Profile data is saved to database
- [ ] Photo uploads to Supabase Storage
- [ ] Photo URL is stored in User table
- [ ] Social links are saved correctly
- [ ] Profile completion check works
- [ ] Onboarding redirects correctly
- [ ] Login flow works

### Error Handling Tests
- [ ] Invalid email format shows error
- [ ] Missing required fields shows errors
- [ ] Invalid file type shows error
- [ ] File too large shows error
- [ ] Invalid phone format shows error
- [ ] Network errors are handled gracefully

### UI/UX Tests
- [ ] Loading states display correctly
- [ ] Error messages are clear and helpful
- [ ] Success messages appear
- [ ] Form validation works
- [ ] Photo preview works
- [ ] Progress indicators work (signup steps)

### Database Verification
- [ ] User record exists in `User` table
- [ ] All profile fields are populated correctly
- [ ] `social_links` records exist (if added)
- [ ] Photo exists in `profile-photos` storage bucket
- [ ] Photo URL in `User.profile_pic` is valid and accessible

---

## Troubleshooting

### Issue: Photo upload fails
**Possible Causes**:
- Storage bucket not created → Run migration 005
- RLS policies not set → Check storage policies
- File too large → Use smaller image
- Invalid file type → Use JPEG, PNG, or WebP

**Solution**: Check Supabase Storage settings and RLS policies

### Issue: Phone verification fails
**Possible Causes**:
- SMS provider not configured → Configure in Supabase Dashboard
- Invalid phone format → Use E.164 format (+1234567890)
- Rate limiting → Wait before retrying

**Solution**: Configure SMS provider or skip phone verification for MVP

### Issue: Profile creation fails
**Possible Causes**:
- User table missing columns → Check database schema
- RLS policies blocking → Check RLS policies
- Invalid data format → Check form validation

**Solution**: Verify database schema and RLS policies

### Issue: Profile completion check fails
**Possible Causes**:
- User not authenticated → Check auth state
- Database connection issue → Check Supabase connection
- RLS policies blocking → Check RLS policies

**Solution**: Verify authentication and database connection

---

## Next Steps After Testing

Once all tests pass:

1. **Document any issues** found during testing
2. **Fix any bugs** discovered
3. **Update documentation** if needed
4. **Proceed to Phase 0.3** (Campus Detection)

---

## Quick Test Script

For quick verification, run through this minimal test:

1. ✅ Start dev server: `npm run dev`
2. ✅ Sign up with new account
3. ✅ Upload photo
4. ✅ Complete profile
5. ✅ Check database for user record
6. ✅ Check storage for photo
7. ✅ Log out and log back in
8. ✅ Navigate to `/onboarding` (should redirect if complete)

If all steps work, integration is successful! 🎉

