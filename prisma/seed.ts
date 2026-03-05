import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Mid TN Volleyball database…');

  // ── Org ────────────────────────────────────────────────────────────────────
  const org = await db.org.upsert({
    where: { slug: 'midtnvball' },
    update: {},
    create: {
      name: 'Mid TN Volleyball',
      slug: 'midtnvball',
    },
  });
  console.log(`  ✓ Org: ${org.name}`);

  // ── Users ──────────────────────────────────────────────────────────────────
  const hashPassword = (pw: string) => bcrypt.hashSync(pw, 12);

  const admin = await db.user.upsert({
    where: { email: 'admin@midtnvball.com' },
    update: {},
    create: {
      email: 'admin@midtnvball.com',
      name: 'Alex Admin',
      hashedPassword: hashPassword('admin123!'),
      role: Role.ADMIN,
      orgId: org.id,
    },
  });

  const coach1 = await db.user.upsert({
    where: { email: 'coach@midtnvball.com' },
    update: {},
    create: {
      email: 'coach@midtnvball.com',
      name: 'Coach Rivera',
      hashedPassword: hashPassword('coach123!'),
      role: Role.COACH,
      orgId: org.id,
    },
  });

  const coach2 = await db.user.upsert({
    where: { email: 'coach2@midtnvball.com' },
    update: {},
    create: {
      email: 'coach2@midtnvball.com',
      name: 'Coach Thompson',
      hashedPassword: hashPassword('coach123!'),
      role: Role.COACH,
      orgId: org.id,
    },
  });

  const parent1 = await db.user.upsert({
    where: { email: 'parent@midtnvball.com' },
    update: {},
    create: {
      email: 'parent@midtnvball.com',
      name: 'Jordan Parent',
      hashedPassword: hashPassword('parent123!'),
      role: Role.PARENT,
      orgId: org.id,
    },
  });

  const parent2 = await db.user.upsert({
    where: { email: 'parent2@midtnvball.com' },
    update: {},
    create: {
      email: 'parent2@midtnvball.com',
      name: 'Morgan Smith',
      hashedPassword: hashPassword('parent123!'),
      role: Role.PARENT,
      orgId: org.id,
    },
  });

  const parent3 = await db.user.upsert({
    where: { email: 'parent3@midtnvball.com' },
    update: {},
    create: {
      email: 'parent3@midtnvball.com',
      name: 'Casey Johnson',
      hashedPassword: hashPassword('parent123!'),
      role: Role.PARENT,
      orgId: org.id,
    },
  });

  console.log(`  ✓ Users: admin, 2 coaches, 3 parents`);

  // ── Teams ──────────────────────────────────────────────────────────────────
  const team17u = await db.team.upsert({
    where: { orgId_slug: { orgId: org.id, slug: '17u-gold' } },
    update: {},
    create: {
      orgId: org.id,
      name: '17U Gold',
      slug: '17u-gold',
      ageGroup: '17U',
      level: 'Gold',
      headCoachId: coach1.id,
    },
  });

  const team16u = await db.team.upsert({
    where: { orgId_slug: { orgId: org.id, slug: '16u-blue' } },
    update: {},
    create: {
      orgId: org.id,
      name: '16U Blue',
      slug: '16u-blue',
      ageGroup: '16U',
      level: 'Blue',
      headCoachId: coach2.id,
    },
  });

  const team18u = await db.team.upsert({
    where: { orgId_slug: { orgId: org.id, slug: '18u-gold' } },
    update: {},
    create: {
      orgId: org.id,
      name: '18U Gold',
      slug: '18u-gold',
      ageGroup: '18U',
      level: 'Gold',
      headCoachId: coach1.id,
    },
  });

  console.log(`  ✓ Teams: 17U Gold, 16U Blue, 18U Gold`);

  // ── Memberships ────────────────────────────────────────────────────────────
  for (const [user, team, teamRole] of [
    [coach1, team17u, 'HEAD_COACH'],
    [coach1, team18u, 'HEAD_COACH'],
    [coach2, team16u, 'HEAD_COACH'],
    [parent1, team17u, 'PARENT'],
    [parent2, team16u, 'PARENT'],
    [parent3, team18u, 'PARENT'],
  ] as const) {
    await db.membership.upsert({
      where: { userId_teamId: { userId: (user as any).id, teamId: (team as any).id } },
      update: {},
      create: {
        userId: (user as any).id,
        teamId: (team as any).id,
        teamRole,
        orgId: org.id,
      },
    });
  }

  // ── Athletes ───────────────────────────────────────────────────────────────
  const athleteData = [
    { firstName: 'Emma', lastName: 'Davis', teamId: team17u.id, jerseyNumber: '1', position: 'Setter' },
    { firstName: 'Olivia', lastName: 'Martinez', teamId: team17u.id, jerseyNumber: '7', position: 'Outside Hitter' },
    { firstName: 'Sophia', lastName: 'Wilson', teamId: team17u.id, jerseyNumber: '12', position: 'Libero' },
    { firstName: 'Ava', lastName: 'Brown', teamId: team17u.id, jerseyNumber: '5', position: 'Middle Blocker' },
    { firstName: 'Isabella', lastName: 'Taylor', teamId: team16u.id, jerseyNumber: '3', position: 'Setter' },
    { firstName: 'Mia', lastName: 'Anderson', teamId: team16u.id, jerseyNumber: '9', position: 'Outside Hitter' },
    { firstName: 'Charlotte', lastName: 'Thomas', teamId: team16u.id, jerseyNumber: '14', position: 'Right Side' },
    { firstName: 'Amelia', lastName: 'Jackson', teamId: team18u.id, jerseyNumber: '2', position: 'Setter' },
    { firstName: 'Harper', lastName: 'White', teamId: team18u.id, jerseyNumber: '8', position: 'Outside Hitter' },
    { firstName: 'Evelyn', lastName: 'Harris', teamId: team18u.id, jerseyNumber: '11', position: 'Libero' },
  ];

  for (const a of athleteData) {
    await db.athlete.upsert({
      where: { teamId_jerseyNumber: { teamId: a.teamId, jerseyNumber: a.jerseyNumber } },
      update: {},
      create: {
        orgId: org.id,
        teamId: a.teamId,
        firstName: a.firstName,
        lastName: a.lastName,
        jerseyNumber: a.jerseyNumber,
        position: a.position,
        waiverSigned: Math.random() > 0.2,
        medicalFormComplete: Math.random() > 0.3,
      },
    });
  }
  console.log(`  ✓ Athletes: ${athleteData.length} athletes across 3 teams`);

  // ── Tournaments ────────────────────────────────────────────────────────────
  const now = new Date();
  const t1Date = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks out
  const t2Date = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // 6 weeks out

  const tournament1 = await db.tournament.upsert({
    where: { orgId_slug: { orgId: org.id, slug: 'spring-classic-2025' } },
    update: {},
    create: {
      orgId: org.id,
      name: 'Spring Classic 2025',
      slug: 'spring-classic-2025',
      venue: 'Nashville Convention Center',
      city: 'Nashville',
      state: 'TN',
      startDate: t1Date,
      endDate: new Date(t1Date.getTime() + 2 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(t1Date.getTime() - 7 * 24 * 60 * 60 * 1000),
      hotelDeadline: new Date(t1Date.getTime() - 5 * 24 * 60 * 60 * 1000),
      notes: 'Annual spring tournament. Hotel block at Marriott downtown.',
    },
  });

  const tournament2 = await db.tournament.upsert({
    where: { orgId_slug: { orgId: org.id, slug: 'summer-slam-2025' } },
    update: {},
    create: {
      orgId: org.id,
      name: 'Summer Slam 2025',
      slug: 'summer-slam-2025',
      venue: 'Music City Sports Complex',
      city: 'Murfreesboro',
      state: 'TN',
      startDate: t2Date,
      endDate: new Date(t2Date.getTime() + 1 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(t2Date.getTime() - 14 * 24 * 60 * 60 * 1000),
      hotelDeadline: new Date(t2Date.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`  ✓ Tournaments: Spring Classic (${Math.round((t1Date.getTime() - now.getTime()) / 86400000)}d), Summer Slam (${Math.round((t2Date.getTime() - now.getTime()) / 86400000)}d)`);

  // ── TeamTournaments + ChecklistItems ───────────────────────────────────────
  const CHECKLIST_COLUMNS = [
    'REGISTRATION', 'ROSTER', 'HOTEL', 'CALENDAR', 'WORKPLAY', 'RIDESHARE', 'SPONSOR',
  ] as const;

  for (const [team, tournament] of [
    [team17u, tournament1],
    [team16u, tournament1],
    [team18u, tournament1],
    [team17u, tournament2],
    [team16u, tournament2],
  ]) {
    const tt = await db.teamTournament.upsert({
      where: { teamId_tournamentId: { teamId: team.id, tournamentId: tournament.id } },
      update: {},
      create: {
        teamId: team.id,
        tournamentId: tournament.id,
      },
    });

    for (const col of CHECKLIST_COLUMNS) {
      const existing = await db.checklistItem.findFirst({
        where: { teamTournamentId: tt.id, column: col },
      });
      if (!existing) {
        const isDone = Math.random() > 0.5;
        await db.checklistItem.create({
          data: {
            teamTournamentId: tt.id,
            column: col,
            status: isDone ? 'DONE' : (Math.random() > 0.6 ? 'IN_PROGRESS' : 'TODO'),
            completedById: isDone ? admin.id : null,
            completedAt: isDone ? new Date() : null,
          },
        });
      }
    }
  }
  console.log(`  ✓ TeamTournaments + Checklist items seeded`);

  // ── WorkPlay Jobs ──────────────────────────────────────────────────────────
  const jobsData = [
    {
      title: 'Tournament Check-In Volunteer',
      description: 'Help with athlete and team check-in at the tournament entrance. Manage wristbands and direct families.',
      category: 'EVENT',
      pointValue: 1,
      teamId: null,
      tournamentId: tournament1.id,
      slots: 4,
    },
    {
      title: 'Scoreboard Operator',
      description: 'Operate the scoreboard for 17U Gold matches. Training provided on-site.',
      category: 'EVENT',
      pointValue: 1,
      teamId: team17u.id,
      tournamentId: tournament1.id,
      slots: 2,
    },
    {
      title: 'Live Stream Camera Operator',
      description: 'Run one of the sideline cameras for our YouTube livestream. Coordinate with production lead.',
      category: 'MEDIA',
      pointValue: 1,
      teamId: null,
      tournamentId: tournament1.id,
      slots: 3,
    },
    {
      title: 'Concessions Booth — Saturday',
      description: 'Work the club concessions stand Saturday 8am–2pm. Keep count of inventory.',
      category: 'FUNDRAISING',
      pointValue: 1,
      teamId: null,
      tournamentId: tournament1.id,
      slots: 3,
    },
    {
      title: 'Concessions Booth — Sunday',
      description: 'Work the club concessions stand Sunday 8am–2pm.',
      category: 'FUNDRAISING',
      pointValue: 1,
      teamId: null,
      tournamentId: tournament1.id,
      slots: 3,
    },
    {
      title: 'Team Photographer',
      description: 'Capture action shots and team photos for social media. Share a Google Drive folder with the coordinator.',
      category: 'MEDIA',
      pointValue: 1,
      teamId: team18u.id,
      tournamentId: tournament1.id,
      slots: 1,
    },
    {
      title: 'Rideshare Coordinator',
      description: 'Organize carpool logistics for Summer Slam. Collect driver info and share a group sheet.',
      category: 'LOGISTICS',
      pointValue: 1,
      teamId: null,
      tournamentId: tournament2.id,
      slots: 2,
    },
  ];

  for (const job of jobsData) {
    const existing = await db.workPlayJob.findFirst({ where: { title: job.title, orgId: org.id } });
    if (!existing) {
      const created = await db.workPlayJob.create({
        data: {
          orgId: org.id,
          teamId: job.teamId,
          tournamentId: job.tournamentId,
          title: job.title,
          description: job.description,
          category: job.category,
          pointValue: job.pointValue,
          createdById: coach1.id,
        },
      });
      // Create slots
      for (let i = 0; i < job.slots; i++) {
        await db.jobSlot.create({
          data: {
            jobId: created.id,
            label: `Slot ${i + 1}`,
          },
        });
      }
    }
  }
  console.log(`  ✓ WorkPlay Jobs: ${jobsData.length} jobs with slots`);

  // ── Sample claims ──────────────────────────────────────────────────────────
  const checkInJob = await db.workPlayJob.findFirst({ where: { title: 'Tournament Check-In Volunteer', orgId: org.id } });
  if (checkInJob) {
    const slot = await db.jobSlot.findFirst({ where: { jobId: checkInJob.id, claimedById: null } });
    if (slot) {
      await db.jobSlot.update({
        where: { id: slot.id },
        data: { claimedById: parent1.id, claimedAt: new Date() },
      });
      await db.jobClaim.upsert({
        where: { userId_slotId: { userId: parent1.id, slotId: slot.id } },
        update: {},
        create: {
          userId: parent1.id,
          slotId: slot.id,
          orgId: org.id,
        },
      });
    }
  }

  const scoreboardJob = await db.workPlayJob.findFirst({ where: { title: 'Scoreboard Operator', orgId: org.id } });
  if (scoreboardJob) {
    const slot = await db.jobSlot.findFirst({ where: { jobId: scoreboardJob.id, claimedById: null } });
    if (slot) {
      await db.jobSlot.update({
        where: { id: slot.id },
        data: { claimedById: parent2.id, claimedAt: new Date() },
      });
      await db.jobClaim.upsert({
        where: { userId_slotId: { userId: parent2.id, slotId: slot.id } },
        update: {},
        create: {
          userId: parent2.id,
          slotId: slot.id,
          orgId: org.id,
        },
      });
    }
  }
  console.log(`  ✓ Sample job claims seeded`);

  // ── Credit Ledger ──────────────────────────────────────────────────────────
  // Give parent3 a completed credit as sample
  await db.creditLedgerEntry.upsert({
    where: { id: 'seed-credit-1' },
    update: {},
    create: {
      id: 'seed-credit-1',
      userId: parent3.id,
      amount: 1.0,
      reason: 'Completed: Concessions Booth (prior season)',
      adminGrantedById: admin.id,
    },
  });
  console.log(`  ✓ Sample credit ledger entry`);

  // ── Knowledge Articles ─────────────────────────────────────────────────────
  const articles = [
    {
      title: 'Tournament Day Checklist',
      category: 'OPERATIONS',
      content: `# Tournament Day Checklist

## Before Leaving Home
- Jersey + shorts (extra set recommended)
- Knee pads and ankle braces
- Water bottles (2 minimum)
- Snacks for between matches
- Team schedule printed or saved offline
- Waivers and medical forms in Google Drive

## At the Venue
- Check in at the club table — get your wristband
- Find your assigned court(s) on the gym map
- Warm-up begins 30 minutes before first match
- Coaches take attendance and verify roster

## Parent Volunteers
- Report to the WorkPlay coordinator at the entrance
- Wear your volunteer badge at all times
- Concessions volunteers: read inventory sheet before your shift

## After the Tournament
- Help break down any club equipment
- Complete your WorkPlay hours in the app
- Submit any incident reports to the club coordinator`,
      tags: ['tournament', 'operations', 'checklist'],
    },
    {
      title: 'Hotel Block Booking Guide',
      category: 'TRAVEL',
      content: `# Hotel Block Booking Guide

Mid TN Volleyball reserves a hotel block for each multi-day tournament. Follow these steps:

## How to Book
1. Open the tournament detail page in this dashboard
2. Find the "Hotel Block" checklist item — click it to see the booking link and code
3. Use the **group code** provided by your coach to receive the discounted rate
4. Book before the **hotel deadline** shown on the tournament page

## Important Notes
- The hotel block **releases** on the deadline date. After that, you book at full price.
- Families are responsible for their own reservations.
- Room sharing with other families is encouraged — coordinate in the team group chat.

## Questions?
Contact the club travel coordinator via the Comms page.`,
      tags: ['hotel', 'travel', 'booking'],
    },
    {
      title: 'WorkPlay & DIBs System Explained',
      category: 'WORKPLAY',
      content: `# WorkPlay & DIBs Fairness System

## What is WorkPlay?
WorkPlay is our volunteer job board. Each tournament has a set of volunteer slots that parents and guardians fill. Credits earned through WorkPlay help offset club costs.

## How Credits Work
- Each completed volunteer slot = **1 credit**
- Credits are recorded in an immutable ledger — they never expire
- View your credit balance and history on the WorkPlay page

## DIBs Rules (Fairness Engine)
To ensure fair distribution of volunteer opportunities:
- **Max 2 claims per week** per family
- **24-hour cooldown** between claims
- Once you claim a slot, it is reserved for you
- If you cannot fulfill a slot, release it as early as possible so another family can claim it

## Admin Overrides
Coaches and admins can bypass DIBs rules in exceptional circumstances (e.g., last-minute slot coverage).`,
      tags: ['workplay', 'credits', 'dibs', 'volunteer'],
    },
    {
      title: 'Roster Compliance Requirements',
      category: 'COMPLIANCE',
      content: `# Roster Compliance Requirements

All athletes must meet the following requirements before they can appear on a tournament roster:

## Required (Hard Blocks)
1. **Signed Waiver** — Parent/guardian must sign the liability waiver in the portal
2. **Medical Form** — Emergency medical information form must be on file

## Required (Warnings Only)
- Jersey number assigned
- Athlete photo uploaded
- GPA on file (for scholarship tracking)

## How to Fix Issues
1. Go to **Teams → [Your Team] → Roster** tab
2. Athletes with red flags have missing requirements
3. Click the flag icon for instructions to resolve each issue

## Deadlines
All compliance items must be complete **48 hours before** tournament registration closes.`,
      tags: ['roster', 'compliance', 'waiver', 'medical'],
    },
    {
      title: 'Coach Onboarding Guide',
      category: 'ONBOARDING',
      content: `# Coach Onboarding Guide

Welcome to Mid TN Volleyball! Here's how to get started with the ops dashboard.

## First Steps
1. Log in at the dashboard URL with your credentials (see your welcome email)
2. Your account has the **COACH** role — you can view and edit all teams you are assigned to
3. Familiarize yourself with the **Command Center** (home page)

## Your Key Responsibilities in the Dashboard
- **Tournament HQ**: Keep checklist items up to date for each tournament
- **Teams**: Monitor roster compliance flags
- **WorkPlay**: Create volunteer jobs and mark slots complete after the tournament
- **Comms**: Post announcements to your teams
- **Knowledge Base**: Add articles relevant to your teams

## Getting Help
- Use the AI Chat button on the Knowledge Base page
- Contact the admin (admin@midtnvball.com) for account issues`,
      tags: ['onboarding', 'coach', 'guide'],
    },
  ];

  for (const a of articles) {
    const existing = await db.knowledgeArticle.findFirst({ where: { title: a.title, orgId: org.id } });
    if (!existing) {
      await db.knowledgeArticle.create({
        data: {
          orgId: org.id,
          title: a.title,
          category: a.category,
          content: a.content,
          tags: a.tags,
          published: true,
          authorId: coach1.id,
        },
      });
    }
  }
  console.log(`  ✓ Knowledge Articles: ${articles.length} articles`);

  // ── Sponsors ───────────────────────────────────────────────────────────────
  const sponsorsData = [
    { name: 'Tennessee Sports Authority', tierName: 'Platinum', amount: 10000, status: 'ACTIVE', contactName: 'Bill Foster', contactEmail: 'bill@tnsports.org' },
    { name: 'Nashville Athletic Gear', tierName: 'Gold', amount: 5000, status: 'ACTIVE', contactName: 'Sara Kim', contactEmail: 'sara@nashgear.com' },
    { name: 'Murfreesboro PT & Sports Medicine', tierName: 'Silver', amount: 2500, status: 'ACTIVE', contactName: 'Dr. Patel', contactEmail: 'dpatel@mrfboro-pt.com' },
    { name: 'Music City Volleyball Supply', tierName: 'Bronze', amount: 1000, status: 'PROSPECT', contactName: 'Tommy Lee' },
  ];

  for (const s of sponsorsData) {
    const existing = await db.sponsor.findFirst({ where: { name: s.name, orgId: org.id } });
    if (!existing) {
      await db.sponsor.create({
        data: {
          orgId: org.id,
          ...s,
        },
      });
    }
  }
  console.log(`  ✓ Sponsors: ${sponsorsData.length} sponsors`);

  // ── Announcements ──────────────────────────────────────────────────────────
  const announcementsData = [
    {
      title: 'Spring Classic — Hotel Deadline in 7 Days',
      body: 'Reminder: the hotel block for Spring Classic closes in 7 days. Please book your rooms now using the group code on the tournament page.',
      pinned: true,
      authorId: admin.id,
    },
    {
      title: 'WorkPlay Slots Now Open for Spring Classic',
      body: 'Volunteer slots for Spring Classic are now available on the WorkPlay page. Each family is expected to fill at least 2 slots. The DIBs system limits claims to 2 per week.',
      pinned: false,
      authorId: coach1.id,
    },
    {
      title: 'Welcome to the New Ops Dashboard!',
      body: 'We have launched our new club operations dashboard. Use the Knowledge Base for help, and reach out to admin with any questions.',
      pinned: false,
      authorId: admin.id,
    },
  ];

  for (const ann of announcementsData) {
    const existing = await db.announcement.findFirst({ where: { title: ann.title, orgId: org.id } });
    if (!existing) {
      await db.announcement.create({
        data: { orgId: org.id, ...ann },
      });
    }
  }
  console.log(`  ✓ Announcements: ${announcementsData.length}`);

  console.log('\n✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  admin@midtnvball.com  / admin123!');
  console.log('  coach@midtnvball.com  / coach123!');
  console.log('  parent@midtnvball.com / parent123!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
