/**
 * Kemotown v2 Development Seed Script
 * Creates test data for v2 development
 *
 * Run with: npx ts-node prisma/seed-v2.ts
 * Or: npx prisma db seed (if configured in package.json)
 */

import { PrismaClient, ActivityType, ActorType, ObjectType } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

// =============================================================================
// Test Users
// =============================================================================

const TEST_USERS = [
  {
    id: 'user_admin_' + nanoid(10),
    username: 'kemo_admin',
    email: 'admin@kemo.town',
    displayName: '케모타운 관리자',
    bio: '케모타운을 운영하는 관리자입니다.',
    species: 'Fox',
    avatarUrl: null,
    interests: ['Community', 'Events', 'Art'],
    isPublic: true,
    locale: 'ko',
  },
  {
    id: 'user_furry1_' + nanoid(10),
    username: 'blue_wolf',
    email: 'bluewolf@example.com',
    displayName: 'Blue Wolf',
    bio: '푸른 늑대입니다! 퍼밋에서 만나요~',
    species: 'Wolf',
    avatarUrl: null,
    interests: ['Fursuiting', 'Photography', 'Dance'],
    isPublic: true,
    locale: 'ko',
  },
  {
    id: 'user_furry2_' + nanoid(10),
    username: 'pink_cat',
    email: 'pinkcat@example.com',
    displayName: '핑크캣',
    bio: '핑크색을 좋아하는 고양이입니다!',
    species: 'Cat',
    avatarUrl: null,
    interests: ['Art', 'Crafts', 'Sewing'],
    isPublic: true,
    locale: 'ko',
  },
  {
    id: 'user_furry3_' + nanoid(10),
    username: 'happy_husky',
    email: 'happyhusky@example.com',
    displayName: 'Happy Husky',
    bio: 'Always happy, always husky!',
    species: 'Husky',
    avatarUrl: null,
    interests: ['Running', 'Snow', 'Hugs'],
    isPublic: true,
    locale: 'en',
  },
  {
    id: 'user_furry4_' + nanoid(10),
    username: 'secret_fox',
    email: 'secretfox@example.com',
    displayName: '비밀여우',
    bio: '비공개 계정입니다.',
    species: 'Fox',
    avatarUrl: null,
    interests: ['Privacy', 'Art'],
    isPublic: false,
    requiresFollowApproval: true,
    locale: 'ko',
  },
];

// =============================================================================
// Test Activities
// =============================================================================

function createTestActivities(users: typeof TEST_USERS) {
  const activities = [];

  // Public posts
  activities.push({
    id: 'act_' + nanoid(12),
    type: ActivityType.CREATE,
    actorId: users[0].id,
    actorType: ActorType.USER,
    objectType: ObjectType.NOTE,
    object: {
      content: '케모타운 v2에 오신 것을 환영합니다! 타임라인 중심의 새로운 경험을 즐겨보세요.',
    },
    to: ['public'],
    cc: [],
    published: new Date(),
  });

  activities.push({
    id: 'act_' + nanoid(12),
    type: ActivityType.CREATE,
    actorId: users[1].id,
    actorType: ActorType.USER,
    objectType: ObjectType.NOTE,
    object: {
      content: '오늘 날씨 좋네요! 퍼슈팅하러 가고 싶다 🐺',
    },
    to: ['public'],
    cc: [],
    published: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  });

  activities.push({
    id: 'act_' + nanoid(12),
    type: ActivityType.CREATE,
    actorId: users[2].id,
    actorType: ActorType.USER,
    objectType: ObjectType.NOTE,
    object: {
      content: '새 그림 작업 중입니다 ✨ 핑크색 고양이를 그리고 있어요!',
    },
    to: ['public'],
    cc: [],
    published: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  });

  // Followers-only post
  activities.push({
    id: 'act_' + nanoid(12),
    type: ActivityType.CREATE,
    actorId: users[3].id,
    actorType: ActorType.USER,
    objectType: ObjectType.NOTE,
    object: {
      content: 'This post is only for my followers!',
    },
    to: ['followers'],
    cc: [],
    published: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
  });

  return activities;
}

// =============================================================================
// Test Follows
// =============================================================================

function createTestFollows(users: typeof TEST_USERS) {
  return [
    // user1 follows admin
    {
      id: 'follow_' + nanoid(12),
      followerId: users[1].id,
      followingId: users[0].id,
      status: 'ACCEPTED' as const,
      createdAt: new Date(),
      acceptedAt: new Date(),
    },
    // user2 follows admin
    {
      id: 'follow_' + nanoid(12),
      followerId: users[2].id,
      followingId: users[0].id,
      status: 'ACCEPTED' as const,
      createdAt: new Date(),
      acceptedAt: new Date(),
    },
    // user1 follows user2
    {
      id: 'follow_' + nanoid(12),
      followerId: users[1].id,
      followingId: users[2].id,
      status: 'ACCEPTED' as const,
      createdAt: new Date(),
      acceptedAt: new Date(),
    },
    // user3 follows user1
    {
      id: 'follow_' + nanoid(12),
      followerId: users[3].id,
      followingId: users[1].id,
      status: 'ACCEPTED' as const,
      createdAt: new Date(),
      acceptedAt: new Date(),
    },
    // Pending follow request to private user
    {
      id: 'follow_' + nanoid(12),
      followerId: users[1].id,
      followingId: users[4].id,
      status: 'PENDING' as const,
      createdAt: new Date(),
      acceptedAt: null,
    },
  ];
}

// =============================================================================
// Main Seed Function
// =============================================================================

async function main() {
  console.log('🌱 Seeding v2 development data...\n');

  // Check if seed data already exists
  const existingUser = await prisma.user.findFirst({
    where: { username: 'kemo_admin' },
  });

  if (existingUser) {
    console.log('⚠️  Seed data already exists. Skipping seed.\n');
    console.log('To re-seed, first delete the existing test users:\n');
    console.log('  npx prisma db push --force-reset\n');
    return;
  }

  // Create users
  console.log('Creating test users...');
  for (const user of TEST_USERS) {
    await prisma.user.create({
      data: {
        ...user,
        updatedAt: new Date(),
      },
    });
    console.log(`  ✓ Created user: ${user.username}`);
  }

  // Create activities
  console.log('\nCreating test activities...');
  const activities = createTestActivities(TEST_USERS);
  for (const activity of activities) {
    await prisma.activity.create({
      data: activity,
    });
    console.log(`  ✓ Created activity: ${activity.id}`);
  }

  // Create follows
  console.log('\nCreating test follows...');
  const follows = createTestFollows(TEST_USERS);
  for (const follow of follows) {
    await prisma.follow.create({
      data: follow,
    });
    console.log(`  ✓ Created follow: ${follow.followerId} -> ${follow.followingId}`);
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Test accounts created:');
  for (const user of TEST_USERS) {
    console.log(`  - ${user.username} (${user.displayName})`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
