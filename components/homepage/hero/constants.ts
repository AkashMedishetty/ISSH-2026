// Hero Section Constants

export const PARTICLE_COUNT = 80000;
export const PARTICLE_COUNT_MOBILE = 35000;
export const MODEL_URL = '/Models/Spline 2 hands.glb';
export const PRECOMPUTED_URL = '/data/hero-hands.json';
export const WELCOME_MODEL_URL = '/Models/welcome message model.glb';
export const WELCOME_PRECOMPUTED_URL = '/data/welcome-gesture.json';

export const CONFERENCE_LOGO = '/logos/1.png';
export const ASSOCIATION_LOGOS = ['/logos/3.png', '/logos/4.png', '/logos/5.png', '/logos/2.png'];

export const NAV_ITEMS = [
  { label: 'Committee', href: '/about' },
  { label: 'Program', href: '/program-schedule' },
  { label: 'Abstracts', href: '/abstracts' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Venue', href: '/venue' },
  { label: 'Contact', href: '/contact' },
];

// Hand configuration for hero section - DESKTOP
export const HERO_CONFIG = {
  rotationX: 0.208,
  rotationY: -0.102,
  rotationZ: 0.000,
  positionX: -0.60,
  positionY: 0.00,
  scale: 2.10,
  particleSize: 0.038,
  cameraZ: 16.5,
};

// Hand configuration for hero section - MOBILE
export const HERO_CONFIG_MOBILE = {
  rotationX: 0.208,
  rotationY: -0.102,
  rotationZ: 0.000,
  positionX: -0.10,
  positionY: 3.50,
  scale: 0.80,
  particleSize: 0.038,
  cameraZ: 16.5,
};

// Welcome gesture configuration - DESKTOP
export const WELCOME_CONFIG = {
  rotationX: -0.012,
  rotationY: -1.122,
  rotationZ: -0.092,
  positionX: -5.00,
  positionY: 0.20,
  scale: 0.90,
};

// Welcome gesture configuration - MOBILE
export const WELCOME_CONFIG_MOBILE = {
  rotationX: -0.012,
  rotationY: -1.122,
  rotationZ: -0.092,
  positionX: 0.20,
  positionY: 2.40,
  scale: 0.70,
};

// Charminar model for Explore Hyderabad section
export const CHARMINAR_MODEL_URL = '/Models/object_0 (1).glb';
export const CHARMINAR_PRECOMPUTED_URL = '/data/charminar-positions.json';

// Charminar configuration - DESKTOP
export const CHARMINAR_CONFIG = {
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  positionX: 0,
  positionY: 0,
  scale: 0.5,
};

// Charminar configuration - MOBILE
export const CHARMINAR_CONFIG_MOBILE = {
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  positionX: 0,
  positionY: 2.5,
  scale: 0.36, // Increased by 20% from 0.30
};

// Committee text scale - MOBILE (smaller to fit screen width)
export const COMMITTEE_SCALE_MOBILE = 0.055;
export const COMMITTEE_SCALE_DESKTOP = 0.13;

// Committee Y position for mobile (higher up on screen)
export const COMMITTEE_Y_MOBILE = 2.8;
export const COMMITTEE_Y_DESKTOP = 2.5;
