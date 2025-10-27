const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    // Get email from command line argument or use default
    const email = process.argv[2] || 'admin@umass.edu';

    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' }
    });

    console.log('✅ User updated to admin:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    if (error.code === 'P2025') {
      console.error('❌ User not found. Make sure the user is registered first.');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();