const { PrismaClient } = require('@prisma/client');
const { PrismaD1 } = require('@prisma/adapter-d1');

let prisma;

function getPrisma(d1Binding) {
  if (prisma) return prisma;
  
  if (d1Binding) {
    const adapter = new PrismaD1(d1Binding);
    prisma = new PrismaClient({ adapter });
  } else {
    // Fallback for local development
    prisma = new PrismaClient();
  }
  
  return prisma;
}

module.exports = { getPrisma };
