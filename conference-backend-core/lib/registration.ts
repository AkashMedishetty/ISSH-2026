export type RegistrationTier = "Early Bird" | "Regular" | "Late / Spot"

export interface RegistrationWindows {
	earlyBirdEnd: Date
	regularStart: Date
	regularEnd: Date
	lateStart: Date
}

// Centralized registration windows sourced from provided pricing table
export const registrationWindows: RegistrationWindows = {
	earlyBirdEnd: new Date("2025-11-30T23:59:59"),
	regularStart: new Date("2025-12-01T00:00:00"),
	regularEnd: new Date("2026-01-25T23:59:59"),
	lateStart: new Date("2026-01-26T00:00:00"),
}

export function getCurrentTier(date: Date = new Date()): RegistrationTier {
	if (date <= registrationWindows.earlyBirdEnd) return "Early Bird"
	if (date <= registrationWindows.regularEnd) return "Regular"
	return "Late / Spot"
}

export function getTierByDate(date: Date): RegistrationTier {
	return getCurrentTier(date)
}

export const registrationLabels = {
	earlyBird: "Early Bird till 30/11/2025",
	regular: "Regular 01/12/2025–25/01/2026",
	late: "Late/Spot from 26/01/2026",
}

export function getTierSummary(now: Date = new Date()): string {
	return `${registrationLabels.earlyBird} · ${registrationLabels.regular} · ${registrationLabels.late}`
}

// Pricing per tier - configured via admin panel
export type RegistrationCategory = "resident" | "delegate"

export interface TierPricing {
	[category: string]: { amount: number; currency: "INR"; label?: string }
}

const PRICING_BY_TIER: Record<RegistrationTier, TierPricing> = {
	"Early Bird": {
		"resident": { amount: 4000, currency: "INR", label: "Resident (Postgraduate)" },
		"delegate": { amount: 5500, currency: "INR", label: "Delegate" },
		"accompanying": { amount: 3500, currency: "INR", label: "Accompanying Person" },
	},
	"Regular": {
		"resident": { amount: 5000, currency: "INR", label: "Resident (Postgraduate)" },
		"delegate": { amount: 6500, currency: "INR", label: "Delegate" },
		"accompanying": { amount: 4500, currency: "INR", label: "Accompanying Person" },
	},
	"Late / Spot": {
		"resident": { amount: 6000, currency: "INR", label: "Resident (Postgraduate)" },
		"delegate": { amount: 8000, currency: "INR", label: "Delegate" },
		"accompanying": { amount: 5000, currency: "INR", label: "Accompanying Person" },
	},
}

export function getTierPricing(tier: RegistrationTier = getCurrentTier()): TierPricing {
	return PRICING_BY_TIER[tier]
}
