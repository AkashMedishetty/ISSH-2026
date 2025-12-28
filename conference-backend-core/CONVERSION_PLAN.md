# 🔄 Conversion Plan: Existing → Reusable

## Strategy
Copy existing OSSAPCON pages and convert them to use:
1. Theme system (`useConferenceTheme()`)
2. Configuration (`conferenceConfig`)
3. Reusable paths

## Pages to Convert

### ✅ Critical Pages (Do First)
1. **RegisterPage** - Complete registration form
   - Source: `app/register/page.tsx` (1865 lines)
   - Convert: Replace hardcoded OSSAPCON → theme system
   - Add: Theme colors, config-driven text

2. **AbstractsPage** - Abstract submission
   - Source: `app/abstracts/page.tsx` (836 lines)
   - Convert: Use theme, add session auth

3. **Admin Pages** - Copy entire admin folder
   - Source: `app/admin/**/*.tsx`
   - Convert: All to use theme

4. **Dashboard Components** - All dashboard features
   - Source: `components/dashboard/*.tsx`
   - Convert: Theme-aware

### 📋 Conversion Checklist Per File

For each file:
- [ ] Replace `"OSSAPCON 2026"` → `theme.config.name`
- [ ] Replace hardcoded colors → `theme.primary`, etc.
- [ ] Replace `import from '@/lib'` → `import from '@/conference-backend-core/lib'`
- [ ] Add `useConferenceTheme()` hook
- [ ] Test mobile responsiveness
- [ ] Verify all features work

## Batch Conversion Commands

```bash
# Copy all admin pages
cp -r app/admin/* conference-backend-core/pages/admin/

# Copy all dashboard pages
cp -r app/dashboard/* conference-backend-core/pages/dashboard/

# Copy components
cp -r components/dashboard/* conference-backend-core/components/dashboard/
cp -r components/admin/* conference-backend-core/components/admin/
cp -r components/auth/* conference-backend-core/components/auth/
```

Then convert each to use theme system!

## Starting NOW with Register Page...
