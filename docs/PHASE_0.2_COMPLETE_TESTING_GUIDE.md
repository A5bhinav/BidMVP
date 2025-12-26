# Phase 0.2 Complete Testing Guide

## Overview

This guide provides comprehensive testing instructions for all Phase 0.2 features that have been integrated. Follow this guide step-by-step to verify that the complete profile setup flow works correctly.

---

## Prerequisites

Before starting testing, ensure you have completed these setup steps:

### 1. Database Setup
- [ ] Run `lib/supabase/migrations/005_storage_setup.sql` in your Supabase SQL Editor
- [ ] Verify the `profile-photos` storage bucket exists in Supabase Dashboard → Storage
- [ ] Verify RLS policies are set for the storage bucket

### 2. Environment Configuration
- [ ] Create `.env.local` file in project root (if not exists)
- [ ] Add your Supabase credentials:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```
- [ ] Verify credentials are correct (no typos, no extra spaces)

### 3. Development Server
- [ ] Start the development server: `npm run dev`
- [ ] Verify server starts without errors
- [ ] Open `http://localhost:3000` in your browser

### 4. Database Schema Verification
- [ ] Verify `User` table has these columns: `id`, `name`, `year`, `gender`, `profile_pic`, `phone`
- [ ] Verify `social_links` table exists with columns: `id`, `user_id`, `platform`, `username`

---

## Test Suite 1: Complete Signup Flow

**Objective**: Test the entire user signup and profile creation process end-to-end.

### Test 1.1: Email Signup

**Steps**:
1. Navigate to `http://localhost:3000`
2. Click the **"Sign Up"** button (black button at bottom)
3. In the modal, enter:
   - **Email**: `test@university.edu` (must be `.edu` domain)
   - **Password**: `testpassword123` (minimum 6 characters)
4. Click **"Continue"**

**Expected Results**:
- ✅ Modal shows "Step 1 of 3" progress indicator
- ✅ No error messages appear
- ✅ Modal transitions to phone verification step
- ✅ Progress bar shows "Step 2 of 3"

**If Error Occurs**:
- **"Only .edu email addresses are allowed"**: Email must end with `.edu`
- **"Password should be at least 6 characters"**: Use longer password
- **"User already registered"**: Use a different email or check Supabase auth users

---

### Test 1.2: Phone Verification

**Steps**:
1. After email signup, phone verification modal should appear automatically
2. Enter phone number in E.164 format: `+1234567890` (include country code)
3. Click **"Send Verification Code"**

**Expected Results**:
- ✅ Loading state shows "Sending..."
- ✅ Success message appears: "Verification code sent to +1234567890"
- ✅ Modal transitions to code input step
- ✅ 60-second countdown timer starts for resend

**Note**: If SMS provider is not configured in Supabase:
- Phone verification will fail with an error
- For MVP testing, you can temporarily skip this step by modifying AuthModal
- Or configure SMS provider in Supabase Dashboard → Authentication → Providers

**Steps (if SMS configured)**:
4. Check your phone for SMS with 6-digit code
5. Enter the 6-digit code in the input field
6. Click **"Verify Code"**

**Expected Results**:
- ✅ Code is accepted
- ✅ Modal closes
- ✅ Profile setup form appears
- ✅ Progress shows "Step 3 of 3"

**Error Scenarios to Test**:
- **Invalid phone format**: Try `1234567890` (no +) → Should show error
- **Wrong code**: Enter `000000` → Should show "Invalid verification code"
- **Resend code**: Click "Resend code" after 60 seconds → New code should be sent

---

### Test 1.3: Profile Photo Upload

**Steps**:
1. In the profile setup form, scroll to "Profile Photo" section
2. Click the upload area (dashed border box)
3. Select a valid image file:
   - **Format**: JPEG, PNG, or WebP
   - **Size**: Less than 5MB
   - **Example**: Use a photo from your computer

**Expected Results**:
- ✅ File picker opens
- ✅ After selecting file, preview appears immediately
- ✅ Upload progress shows "Uploading..." with spinner
- ✅ After upload completes, preview shows the uploaded image
- ✅ No error messages

**Error Scenarios to Test**:

**Test 1.3a - Invalid File Type**:
- Try uploading a PDF or text file
- **Expected**: Error message "Invalid file type. Please upload a JPEG, PNG, or WebP image."

**Test 1.3b - File Too Large**:
- Try uploading an image larger than 5MB
- **Expected**: Error message "File size too large. Maximum size is 5MB."

**Test 1.3c - Remove Photo**:
- After uploading, click the × button on the preview
- **Expected**: Preview disappears, photo is removed

**Database Verification**:
- After successful upload, check Supabase Dashboard → Storage → `profile-photos`
- Verify file exists in bucket with path: `{userId}/{timestamp}-{filename}`
- Verify file is accessible (click to view)

---

### Test 1.4: Complete Profile Form

**Steps**:
1. Fill in all required fields:
   - **Name**: Enter your name (e.g., "John Doe")
   - **Year**: Select from dropdown (1-5)
   - **Gender**: Select from dropdown (M/F/X)
   - **Profile Photo**: Upload photo (from Test 1.3)

2. (Optional) Add social links:
   - **Instagram**: `@johndoe`
   - **Snapchat**: `johndoe`
   - **VSCO**: `johndoe`
   - **TikTok**: `@johndoe`

3. Click **"Complete Profile"** button

**Expected Results**:
- ✅ Loading state shows "Saving..."
- ✅ Success message appears: "Profile created successfully! Redirecting..."
- ✅ Modal closes after 2 seconds
- ✅ User is authenticated and logged in
- ✅ Home page shows welcome message with user email

**Error Scenarios to Test**:

**Test 1.4a - Missing Required Fields**:
- Try submitting without filling all required fields
- **Expected**: 
  - Form validation prevents submission
  - Error messages appear for missing fields
  - Red borders appear on invalid fields

**Test 1.4b - Invalid Year**:
- Year dropdown should only allow 1-5 (this is enforced by dropdown, but test anyway)

---

### Test 1.5: Database Verification

**After completing signup, verify data in Supabase**:

1. **Check User Table**:
   - Go to Supabase Dashboard → Table Editor → `User`
   - Find your user record (search by email)
   - Verify:
     - ✅ `id` matches auth user ID
     - ✅ `name` is correct
     - ✅ `year` is correct
     - ✅ `gender` is correct
     - ✅ `profile_pic` contains a valid URL
     - ✅ `phone` is set (if phone verification completed)

2. **Check Social Links Table**:
   - Go to Supabase Dashboard → Table Editor → `social_links`
   - Filter by your `user_id`
   - Verify:
     - ✅ Records exist for each social platform you added
     - ✅ `platform` values are correct (instagram, snapchat, vsco, tiktok)
     - ✅ `username` values are correct

3. **Check Storage**:
   - Go to Supabase Dashboard → Storage → `profile-photos`
   - Verify:
     - ✅ Your photo file exists
     - ✅ File path follows pattern: `{userId}/{timestamp}-{filename}`
     - ✅ File is accessible (click to view)

---

## Test Suite 2: Profile Completion Check

**Objective**: Verify the onboarding page correctly checks profile completion status.

### Test 2.1: Incomplete Profile Check

**Setup**:
1. Create a new user account (sign up with new email)
2. **Do NOT** complete the profile setup
3. Log out

**Steps**:
1. Log in with the incomplete profile user
2. Navigate to `http://localhost:3000/onboarding`

**Expected Results**:
- ✅ Loading spinner appears briefly
- ✅ Profile setup form is displayed
- ✅ Form shows all required fields
- ✅ No redirect occurs

---

### Test 2.2: Complete Profile Check

**Setup**:
1. Use a user account with completed profile (from Test Suite 1)

**Steps**:
1. Log in with complete profile user
2. Navigate to `http://localhost:3000/onboarding`

**Expected Results**:
- ✅ Loading spinner appears briefly
- ✅ Success message: "Profile complete!"
- ✅ Redirects to home page (`/`) after 1 second
- ✅ Home page shows welcome message

---

## Test Suite 3: Login Flow

**Objective**: Verify existing users can log in correctly.

### Test 3.1: Successful Login

**Steps**:
1. Navigate to `http://localhost:3000`
2. Click **"Log In"** button (white button with border)
3. Enter credentials:
   - **Email**: Use an existing user's email
   - **Password**: Use the correct password
4. Click **"Log In"**

**Expected Results**:
- ✅ Modal closes immediately
- ✅ Welcome message appears with user email
- ✅ "Sign Out" button appears
- ✅ Login/signup buttons disappear

---

### Test 3.2: Failed Login

**Test Scenarios**:

**Test 3.2a - Wrong Password**:
- Enter correct email, wrong password
- **Expected**: Error message "Invalid login credentials"

**Test 3.2b - Non-existent User**:
- Enter email that doesn't exist
- **Expected**: Error message "Invalid login credentials"

**Test 3.2c - Empty Fields**:
- Try to submit with empty email or password
- **Expected**: Browser validation prevents submission (required attribute)

---

## Test Suite 4: Error Handling

**Objective**: Verify all error scenarios are handled gracefully.

### Test 4.1: Form Validation Errors

**Test Scenarios**:

1. **Empty Name Field**:
   - Try to submit profile form without name
   - **Expected**: Red border on name field, error message "Name is required"

2. **No Year Selected**:
   - Try to submit without selecting year
   - **Expected**: Red border on year field, error message "Year is required"

3. **No Gender Selected**:
   - Try to submit without selecting gender
   - **Expected**: Red border on gender field, error message "Gender is required"

4. **No Photo Uploaded**:
   - Try to submit without uploading photo
   - **Expected**: Red border on photo upload area, error message "Profile photo is required"

---

### Test 4.2: Network Error Handling

**Test Scenarios**:

1. **Disconnect Internet**:
   - Start profile submission
   - Disconnect internet mid-request
   - **Expected**: Error message displayed, form doesn't crash

2. **Slow Network**:
   - Use browser DevTools → Network → Throttling
   - Set to "Slow 3G"
   - Try uploading photo
   - **Expected**: Loading state shows, upload completes eventually

---

### Test 4.3: Database Error Handling

**Test Scenarios**:

1. **Duplicate Profile Creation**:
   - Try to create profile for user that already has one
   - **Expected**: Appropriate error message (may vary based on RLS policies)

2. **Invalid Data**:
   - Try to submit with invalid data format
   - **Expected**: Validation prevents submission or shows error

---

## Test Suite 5: UI/UX Testing

**Objective**: Verify user interface and user experience elements work correctly.

### Test 5.1: Loading States

**Verify loading states appear for**:
- ✅ Photo upload: Shows spinner and "Uploading..." text
- ✅ Profile submission: Button shows "Saving..." and is disabled
- ✅ Phone verification: Button shows "Sending..." or "Verifying..."
- ✅ Profile check: Shows spinner on onboarding page

---

### Test 5.2: Progress Indicators

**Verify progress indicators**:
- ✅ Signup flow shows "Step 1 of 3", "Step 2 of 3", "Step 3 of 3"
- ✅ Progress bar fills correctly (33%, 66%, 100%)
- ✅ Current step is highlighted

---

### Test 5.3: Error Messages

**Verify error messages**:
- ✅ Are clear and helpful
- ✅ Appear in red/error styling
- ✅ Don't break layout
- ✅ Can be dismissed or cleared when user fixes issue

---

### Test 5.4: Success Messages

**Verify success messages**:
- ✅ Appear in green/success styling
- ✅ Are clear and informative
- ✅ Auto-dismiss or redirect appropriately

---

## Test Suite 6: Component Integration

**Objective**: Verify all components work together correctly.

### Test 6.1: Component Props Flow

**Verify userId prop is passed correctly**:
- ✅ AuthModal passes `userId` to ProfileSetupForm
- ✅ ProfileSetupForm passes `userId` to PhotoUpload
- ✅ Onboarding page passes `userId` to ProfileSetupForm

**How to Verify**:
- Check browser console for any prop warnings
- Verify photo upload works (requires userId)
- Check that all components receive necessary props

---

### Test 6.2: Function Call Chain

**Verify function call sequence**:
1. User submits profile form
2. ProfileSetupForm calls `onSubmit(profileData)`
3. AuthModal/Onboarding calls `createProfile(userId, profileData)`
4. Server Action calls `createUserProfile(userId, profileData)`
5. Database is updated
6. Success response flows back

**How to Verify**:
- Check browser Network tab for API calls
- Verify data appears in database
- Check for any console errors

---

## Test Suite 7: Edge Cases

**Objective**: Test unusual scenarios and edge cases.

### Test 7.1: Special Characters

**Test with special characters in**:
- Name field: `John O'Brien`, `José García`, `李小明`
- Social links: `@user_name`, `user-name`, `user.name`

**Expected**: All special characters are handled correctly and saved to database

---

### Test 7.2: Long Inputs

**Test with very long inputs**:
- Very long name (100+ characters)
- Very long social media usernames

**Expected**: 
- Form validation may limit length (check if limits exist)
- Database accepts within column limits
- UI doesn't break with long text

---

### Test 7.3: Rapid Actions

**Test rapid user actions**:
- Click submit button multiple times rapidly
- Upload multiple photos in quick succession
- Navigate away during upload

**Expected**:
- Duplicate submissions are prevented
- Only one request is sent
- No errors or crashes occur

---

## Test Suite 8: Database Integrity

**Objective**: Verify data integrity and relationships.

### Test 8.1: Foreign Key Relationships

**Verify**:
- ✅ `social_links.user_id` correctly references `User.id`
- ✅ Deleting a user (if possible) cascades to social_links
- ✅ All foreign key constraints are enforced

---

### Test 8.2: Data Types

**Verify data types are correct**:
- ✅ `year` is stored as INTEGER (1-5)
- ✅ `gender` is stored as TEXT
- ✅ `profile_pic` is stored as TEXT (URL)
- ✅ `phone` is stored as TEXT

---

### Test 8.3: Unique Constraints

**Verify**:
- ✅ `social_links` has unique constraint on `(user_id, platform)`
- ✅ User cannot have duplicate social links for same platform

---

## Quick Test Checklist

Use this checklist for quick verification:

### Setup
- [ ] Storage migration run
- [ ] Environment variables configured
- [ ] Dev server running
- [ ] Database schema verified

### Core Functionality
- [ ] Email signup works
- [ ] Phone verification works (or skips if not configured)
- [ ] Photo upload works
- [ ] Profile creation works
- [ ] Profile completion check works
- [ ] Login works
- [ ] Logout works

### Error Handling
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] Invalid inputs are rejected
- [ ] Network errors are handled

### Database
- [ ] User data saved correctly
- [ ] Social links saved correctly
- [ ] Photo stored in storage bucket
- [ ] Photo URL stored in User table

### UI/UX
- [ ] Loading states work
- [ ] Progress indicators work
- [ ] Success messages appear
- [ ] Error messages are clear

---

## Troubleshooting Guide

### Issue: Photo Upload Fails

**Possible Causes**:
- Storage bucket not created → Run migration 005
- RLS policies not set → Check storage policies in Supabase
- File too large → Use smaller image (<5MB)
- Invalid file type → Use JPEG, PNG, or WebP
- User ID not passed → Check component props

**Solution**:
1. Check Supabase Dashboard → Storage → Verify bucket exists
2. Check RLS policies on storage bucket
3. Verify `userId` prop is being passed to PhotoUpload
4. Check browser console for specific error messages

---

### Issue: Phone Verification Fails

**Possible Causes**:
- SMS provider not configured → Configure in Supabase Dashboard
- Invalid phone format → Use E.164 format (+1234567890)
- Rate limiting → Wait before retrying

**Solution**:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Phone provider
3. Configure SMS provider (Twilio, MessageBird, etc.)
4. Or skip phone verification for MVP testing

---

### Issue: Profile Creation Fails

**Possible Causes**:
- User table missing columns → Check database schema
- RLS policies blocking → Check RLS policies
- Invalid data format → Check form validation
- User not authenticated → Check auth state

**Solution**:
1. Verify User table has all required columns
2. Check RLS policies allow user to insert/update own profile
3. Check browser console for specific error
4. Verify user is authenticated (`user.id` exists)

---

### Issue: Profile Completion Check Fails

**Possible Causes**:
- User not authenticated → Check auth state
- Database connection issue → Check Supabase connection
- RLS policies blocking → Check RLS policies

**Solution**:
1. Verify user is logged in
2. Check Supabase connection in browser console
3. Verify RLS policies allow user to read own profile
4. Check browser Network tab for failed requests

---

## Testing Best Practices

1. **Test in Incognito Mode**: Use incognito/private browsing to avoid cached data
2. **Clear Browser Cache**: Clear cache between major test runs
3. **Check Console**: Always check browser console for errors
4. **Check Network Tab**: Monitor network requests in DevTools
5. **Test on Different Browsers**: Test on Chrome, Firefox, Safari if possible
6. **Test on Mobile**: Test responsive design on mobile devices
7. **Document Issues**: Write down any issues you find for fixing

---

## Success Criteria

Integration is successful if:

✅ All test suites pass
✅ No console errors
✅ Data is correctly saved to database
✅ All error scenarios are handled gracefully
✅ UI/UX elements work as expected
✅ No mock functions are being used
✅ All components are properly integrated

---

## Next Steps After Testing

1. **Document Issues**: Write down any bugs or issues found
2. **Fix Critical Bugs**: Address any blocking issues
3. **Update Documentation**: Update docs if needed based on findings
4. **Proceed to Phase 0.3**: Once Phase 0.2 is fully tested and working

---

## Support

If you encounter issues not covered in this guide:

1. Check browser console for error messages
2. Check Supabase Dashboard for database errors
3. Check Network tab for failed API requests
4. Review the integration code for any issues
5. Check that all prerequisites are met

---

**Good luck with testing! 🚀**

