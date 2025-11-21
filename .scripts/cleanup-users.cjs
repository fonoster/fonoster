#!/usr/bin/env node

/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const { PrismaClient } = require('../mods/identity/src/generated/@prisma/client');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Handle command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

// Parse database URL from command line
let dbUrl = null;
const dbUrlIndex = args.findIndex(arg => arg === '--db-url');
if (dbUrlIndex !== -1 && dbUrlIndex + 1 < args.length) {
  dbUrl = args[dbUrlIndex + 1];
  console.log('🔗 Using custom database URL from command line');
}

// Create Prisma client with optional custom database URL
const prisma = new PrismaClient({
  datasources: dbUrl ? {
    db: {
      url: dbUrl
    }
  } : undefined
});

async function cleanupUsers() {
  try {
    console.log('🔍 Starting user cleanup process...');
    
    // Calculate the cutoff time (24 hours ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log(`📅 Cutoff time: ${cutoffTime.toISOString()}`);
    
    // Find users that meet the cleanup criteria
    const usersToCleanup = await prisma.user.findMany({
      where: {
        phoneNumberVerified: false,
        createdAt: {
          lt: cutoffTime
        }
      },
      select: {
        ref: true,
        email: true,
        name: true,
        createdAt: true,
        phoneNumber: true,
        phoneNumberVerified: true,
        emailVerified: true
      }
    });
    
    console.log(`📊 Found ${usersToCleanup.length} users eligible for cleanup`);
    
    if (usersToCleanup.length === 0) {
      console.log('✅ No users to cleanup. Database is clean!');
      return;
    }
    
    // Display users that will be deleted (for verification)
    console.log('\n📋 Users to be deleted:');
    usersToCleanup.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - Created: ${user.createdAt.toISOString()}`);
    });
    
    // Handle dry-run mode
    if (isDryRun) {
      console.log('\n🔍 DRY RUN MODE: No users were actually deleted');
      console.log(`📊 Would have deleted ${usersToCleanup.length} users`);
      return;
    }
    
    // Ask for confirmation (only if running interactively and not force mode)
    if (process.stdin.isTTY && !isForce) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('\n❓ Do you want to proceed with deletion? (yes/no): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('❌ Cleanup cancelled by user');
        return;
      }
    }
    
    // Delete users
    console.log('\n🗑️  Deleting users...');
    const deletePromises = usersToCleanup.map(user => 
      prisma.user.delete({
        where: { ref: user.ref }
      })
    );
    
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted ${usersToCleanup.length} users`);
    
    // Verify cleanup
    const remainingUsers = await prisma.user.findMany({
      where: {
        phoneNumberVerified: false,
        emailVerified: false,
        createdAt: {
          lt: cutoffTime
        }
      }
    });
    
    console.log(`🔍 Verification: ${remainingUsers.length} users still meet cleanup criteria`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node cleanup-users.cjs [options]

Options:
  --dry-run              Show what would be deleted without actually deleting
  --force                Skip confirmation prompt
  --db-url <url>         Override database URL (optional)
  --help, -h             Show this help message

Examples:
  node cleanup-users.cjs --dry-run                                    # Preview what would be deleted
  node cleanup-users.cjs --force                                      # Delete without confirmation
  node cleanup-users.cjs --db-url "postgresql://user:pass@host:5432/db"  # Use custom database
  node cleanup-users.cjs                                              # Delete with confirmation prompt
`);
  process.exit(0);
}

// Run the cleanup
cleanupUsers()
  .then(() => {
    console.log('🎉 Cleanup process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
