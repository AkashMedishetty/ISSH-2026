const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (key && !process.env[key]) {
        process.env[key] = value
      }
    }
  })
  console.log('✅ Loaded environment variables from .env.local')
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neurovascon2026'
console.log('📡 Connecting to MongoDB...')

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db()
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('\n🗑️  Clearing existing data...')
    await db.collection('users').deleteMany({})
    await db.collection('payment_config').deleteMany({})
    await db.collection('pricing_tiers').deleteMany({})
    
    // 1. Seed Admin User
    console.log('\n👤 Seeding Admin User...')
    const adminPassword = await bcrypt.hash('1234567890', 12)
    await db.collection('users').insertOne({
      email: 'hello@purplehatevents.in',
      password: adminPassword,
      role: 'admin',
      profile: {
        firstName: 'PurpleHat',
        lastName: 'Events',
        title: 'Mr.',
        phone: '9999999999'
      },
      activeSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: true,
      isActive: true
    })
    console.log('✅ Admin user created: hello@purplehatevents.in / 1234567890')
    
    // 2. Seed Reviewer User
    console.log('\n👤 Seeding Reviewer User...')
    const reviewerPassword = await bcrypt.hash('1234567890', 12)
    await db.collection('users').insertOne({
      email: 'reviewer@purplehatevents.in',
      password: reviewerPassword,
      role: 'reviewer',
      profile: {
        firstName: 'Reviewer',
        lastName: 'User',
        title: 'Dr.',
        phone: '8888888888'
      },
      activeSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: true,
      isActive: true
    })
    console.log('✅ Reviewer user created: reviewer@purplehatevents.in / 1234567890')
    
    // 3. Seed Registration Types (stored in config file, not database)
    console.log('\n📋 Registration Types: Stored in conference.config.ts (can be managed via admin panel)')
    
    // 4. Workshops - Skipped (configure via admin panel at /admin/settings/registration)
    console.log('\n📚 Workshops: Skipped (configure via admin panel)')
    
    // 5. Seed Payment Configuration
    console.log('\n💳 Seeding Payment Configuration...')
    await db.collection('payment_config').insertOne({
      type: 'main',
      config: {
        bankTransfer: {
          enabled: true,
          accountName: 'NeuroVascon 2026',
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          branch: 'Mumbai Main Branch',
          upiId: 'neurovascon@sbi',
          instructions: 'Please transfer the registration fee to the account mentioned above and enter the UTR number in the registration form. Your registration will be confirmed once the payment is verified.'
        },
        razorpay: {
          enabled: false,
          keyId: '',
          keySecret: ''
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log('✅ Payment configuration created')
    
    // 5. Seed Pricing Tiers (for early bird, etc.)
    console.log('\n💰 Seeding Pricing Tiers...')
    const pricingTiers = [
      {
        name: 'Early Bird',
        code: 'EARLY2026',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-03-31'),
        discount: 20, // 20% discount
        active: true,
        categories: {
          'cvsi-member': 8000,
          'non-member': 12000,
          'international': 300, // USD
          'pg-student': 5000
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Regular',
        code: 'REGULAR2026',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-12-31'),
        discount: 0,
        active: true,
        categories: {
          'cvsi-member': 10000,
          'non-member': 15000,
          'international': 400, // USD
          'pg-student': 6000
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    await db.collection('pricing_tiers').insertMany(pricingTiers)
    console.log(`✅ Created ${pricingTiers.length} pricing tiers`)
    
    // 6. Create indexes for better performance
    console.log('\n📊 Creating indexes...')
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('workshops').createIndex({ id: 1 }, { unique: true })
    await db.collection('registrations').createIndex({ 'registration.registrationId': 1 }, { unique: true })
    await db.collection('registrations').createIndex({ email: 1 })
    await db.collection('registrations').createIndex({ 'registration.status': 1 })
    console.log('✅ Indexes created')
    
    console.log('\n✨ Database seeding completed successfully!')
    console.log('\n📝 Summary:')
    console.log('   - Admin: hello@purplehatevents.in / 1234567890')
    console.log('   - Reviewer: reviewer@purplehatevents.in / 1234567890')
    console.log('   - Workshops: Configure via admin panel at /admin/settings/registration')
    console.log(`   - Pricing Tiers: ${pricingTiers.length}`)
    console.log('   - Payment Config: Configured')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await client.close()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('\n✅ Seeding process completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seeding process failed:', error)
    process.exit(1)
  })
