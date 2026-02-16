export type RegistrationTier = "Early Bird" | "Regular" | "Spot Registration"

export interface RegistrationWindows {
	earlyBirdEnd: Date
	regularStart: Date
	regularEnd: Date
	spotStart: Date
}

// ISSH 2026 registration windows
export const registrationWindows: RegistrationWindows = {
	earlyBirdEnd: new Date("2026-03-15T23:59:59"),
	regularStart: new Date("2026-03-16T00:00:00"),
	regularEnd: new Date("2026-04-24T23:59:59"),
	spotStart: new Date("2026-04-25T00:00:00"),
}

export function getCurrentTier(date: Date = new Date()): RegistrationTier {
	if (date <= registrationWindows.earlyBirdEnd) return "Early Bird"
	if (date <= registrationWindows.regularEnd) return "Regular"
	return "Spot Registration"
}

export function getTierByDate(date: Date): RegistrationTier {
	return getCurrentTier(date)
}

export const registrationLabels = {
	earlyBird: "Early Bird upto 15/03/2026",
	regular: "Regular 16/03/2026–24/04/2026",
	spot: "Spot at the Conference",
}

export function getTierSummary(now: Date = new Date()): string {
	return `${registrationLabels.earlyBird} · ${registrationLabels.regular} · ${registrationLabels.spot}`
}

// Pricing per tier - fallback values (primary source is database)
export type RegistrationCategory = "issh-member" | "non-issh-member" | "postgraduate"

export interface TierPricing {
	[category: string]: { amount: number; currency: "INR"; label?: string }
}

const PRICING_BY_TIER: Record<RegistrationTier, TierPricing> = {
	"Early Bird": {
		"issh-member":     { amount: 5000, currency: "INR", label: "ISSH Member" },
		"non-issh-member": { amount: 6000, currency: "INR", label: "Non ISSH Member" },
		"postgraduate":    { amount: 2500, currency: "INR", label: "Postgraduate" },
		"accompanying":    { amount: 3000, currency: "INR", label: "Accompanying Person/Spouse" },
	},
	"Regular": {
		"issh-member":     { amount: 6000, currency: "INR", label: "ISSH Member" },
		"non-issh-member": { amount: 7000, currency: "INR", label: "Non ISSH Member" },
		"postgraduate":    { amount: 3000, currency: "INR", label: "Postgraduate" },
		"accompanying":    { amount: 3500, currency: "INR", label: "Accompanying Person/Spouse" },
	},
	"Spot Registration": {
		"issh-member":     { amount: 7000, currency: "INR", label: "ISSH Member" },
		"non-issh-member": { amount: 8000, currency: "INR", label: "Non ISSH Member" },
		"postgraduate":    { amount: 3500, currency: "INR", label: "Postgraduate" },
		"accompanying":    { amount: 4000, currency: "INR", label: "Accompanying Person/Spouse" },
	},
}

export function getTierPricing(tier: RegistrationTier = getCurrentTier()): TierPricing {
	return PRICING_BY_TIER[tier]
}
