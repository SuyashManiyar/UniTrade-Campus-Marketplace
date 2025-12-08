import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const profileUpdates = [
  {
    email: 'njarpla@umass.edu',
    pronouns: 'He/Him',
    major: 'Computer Science',
    location: 'Southwest',
    bio: 'CS major passionate about software development and technology. Always looking for good deals on tech gadgets and textbooks!'
  },
  {
    email: 'snarayana@umass.edu',
    pronouns: 'She/Her',
    major: 'Information Technology',
    location: 'Central',
    bio: 'IT student who loves organizing and finding great deals. Selling items I no longer need to help fellow students save money!'
  },
  {
    email: 'smanayar@umass.edu',
    pronouns: 'He/Him',
    major: 'Data Science',
    location: 'Northeast',
    bio: 'Data science enthusiast and cycling lover. Check out my listings for bikes and tech equipment!'
  },
  {
    email: 'rtumati@umass.edu',
    pronouns: 'He/Him',
    major: 'Computer Engineering',
    location: 'Orchard Hill',
    bio: 'Engineering student with a passion for electronics and fitness. Selling quality items at fair prices.'
  },
  {
    email: 'cmadadi@umass.edu',
    pronouns: 'He/Him',
    major: 'Software Engineering',
    location: 'Sylvan',
    bio: 'Software engineering major and music enthusiast. Reliable seller with quick responses!'
  }
];

async function updateProfiles() {
  console.log('🔄 Updating user profiles...');

  for (const profile of profileUpdates) {
    try {
      const user = await prisma.user.update({
        where: { email: profile.email },
        data: {
          pronouns: profile.pronouns,
          major: profile.major,
          location: profile.location,
          bio: profile.bio
        }
      });
      console.log(`   ✓ Updated profile for ${user.name} (${user.email})`);
    } catch (error: any) {
      console.error(`   ✗ Failed to update ${profile.email}:`, error.message);
    }
  }

  console.log('✅ Profile updates completed!');
}

updateProfiles()
  .catch((e) => {
    console.error('❌ Error updating profiles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
