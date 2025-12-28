# 🔄 AUTOMATED CONVERSION SCRIPT

## Files to Convert: ~100+ files

### **Phase 1: Import Path Updates**
```regex
FIND: @/components/
REPLACE: @/conference-backend-core/components/

FIND: @/lib/
REPLACE: @/conference-backend-core/lib/

FIND: @/hooks/
REPLACE: @/conference-backend-core/hooks/

FIND: @/config/
REPLACE: @/conference-backend-core/config/
```

### **Phase 2: Metadata & Title Updates**
```typescript
// OLD
export const metadata: Metadata = {
  title: "Dashboard | OSSAPCON 2026",
  description: "Manage your OSSAPCON 2026 conference registration"
}

// NEW
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

export const metadata: Metadata = {
  title: `Dashboard | ${conferenceConfig.shortName}`,
  description: `Manage your ${conferenceConfig.shortName} conference registration`
}
```

### **Phase 3: Hardcoded Text Replacements**
```regex
OSSAPCON 2026 → {config.shortName}
OSSAPCON → {config.organizationName}
Annual Conference of Orthopaedic Surgeons → {config.name}
Advancing Orthopaedic Excellence → {config.tagline}
OSSAP Member → Use dynamic pricing.config.ts
```

### **Phase 4: Color Theme Replacements**
```regex
bg-blue-600 → bg-theme-primary-600
text-blue-600 → text-theme-primary-600
border-blue-600 → border-theme-primary-600
from-blue-500 to-purple-600 → from-theme-primary-500 to-theme-accent-600
hover:bg-blue-700 → hover:bg-theme-primary-700
```

### **Phase 5: Add useConferenceTheme Hook**
```typescript
// For "use client" components
"use client"
import { useConferenceTheme } from "@/conference-backend-core/hooks/useConferenceTheme"

export default function Component() {
  const { config, theme } = useConferenceTheme()
  
  return (
    <div>
      <h1>{config.shortName}</h1>
      <p style={{ color: theme.primary }}>Theme-aware text</p>
    </div>
  )
}
```

### **Phase 6: Function Replacements**
```typescript
// OLD
import { getCurrentTier } from "@/lib/registration"
const tier = getCurrentTier()

// NEW
import { useRegistrationStatus } from "@/conference-backend-core/hooks/useConferenceTheme"
const { currentTier, tierInfo } = useRegistrationStatus()
```

---

## 🎯 Conversion Priority Order:

1. **High Priority** (Core functionality):
   - `/app/register/page.tsx`
   - `/app/dashboard/page.tsx`
   - `/app/login/page.tsx`
   - `/components/admin/*`
   - `/components/dashboard/*`
   - `/components/payment/*`

2. **Medium Priority** (Secondary pages):
   - `/app/pricing/page.tsx`
   - `/app/abstracts/page.tsx`
   - `/app/contact/page.tsx`
   - `/components/auth/*`
   - `/components/registration/*`

3. **Low Priority** (Static content):
   - `/app/privacy-policy/page.tsx`
   - `/app/terms-conditions/page.tsx`
   - `/app/cookies-policy/page.tsx`

---

## ✅ Success Criteria:

- [ ] No hardcoded "OSSAPCON" anywhere
- [ ] No hardcoded blue/indigo/purple colors
- [ ] All imports point to conference-backend-core
- [ ] All client components use useConferenceTheme()
- [ ] All metadata uses config values
- [ ] Ready to copy-paste to any new conference

