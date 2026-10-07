import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  BranchType,
  EventType,
  FamilyPersonMembershipType,
  GenderType,
  GravePersonRole,
  MediaOwnerType,
  MediaType,
  PrismaClient,
  RelationshipType,
} from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const IDS = {
  founder: '10000000-0000-4000-8000-000000000001',
  son: '10000000-0000-4000-8000-000000000002',
  daughter: '10000000-0000-4000-8000-000000000003',
  externalChild: '10000000-0000-4000-8000-000000000004',
  externalGrandchild: '10000000-0000-4000-8000-000000000005',
  son2: '10000000-0000-4000-8000-000000000006',
  polyPerson: '10000000-0000-4000-8000-000000000010',
  spouseB: '10000000-0000-4000-8000-000000000011',
  spouseC: '10000000-0000-4000-8000-000000000012',
  chi2Root: '10000000-0000-4000-8000-000000000020',
  chi3Root: '10000000-0000-4000-8000-000000000021',
  chi4Root: '10000000-0000-4000-8000-000000000022',
};

async function main() {
  await prisma.eventParticipant.deleteMany();
  await prisma.familyEvent.deleteMany();
  await prisma.personGrave.deleteMany();
  await prisma.media.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.familyPerson.deleteMany();
  await prisma.family.deleteMany();
  await prisma.grave.deleteMany();
  await prisma.person.deleteMany();

  await prisma.person.createMany({
    data: [
      {
        id: IDS.founder,
        fullName: 'Hoàng Đình Thủy Tổ',
        gender: GenderType.MALE,
        birthDate: new Date('1850-01-01'),
      },
      {
        id: IDS.son,
        fullName: 'Hoàng Đình Chi Một — Con',
        gender: GenderType.MALE,
        birthDate: new Date('1875-01-01'),
      },
      {
        id: IDS.daughter,
        fullName: 'Hoàng Thị Con Gái',
        gender: GenderType.FEMALE,
        birthDate: new Date('1900-01-01'),
      },
      {
        id: IDS.externalChild,
        fullName: 'Nguyễn Văn Ngoại Tộc',
        gender: GenderType.MALE,
        birthDate: new Date('1925-01-01'),
      },
      {
        id: IDS.externalGrandchild,
        fullName: 'Nguyễn Văn Cháu Ngoại',
        gender: GenderType.MALE,
        birthDate: new Date('1950-01-01'),
      },
      {
        id: IDS.son2,
        fullName: 'Hoàng Đình Con Trai Hai',
        gender: GenderType.MALE,
        birthDate: new Date('1902-01-01'),
      },
      {
        id: IDS.polyPerson,
        fullName: 'Hoàng Đình Đa Thê',
        gender: GenderType.MALE,
      },
      { id: IDS.spouseB, fullName: 'Vợ B', gender: GenderType.FEMALE },
      { id: IDS.spouseC, fullName: 'Vợ C', gender: GenderType.FEMALE },
      {
        id: IDS.chi2Root,
        fullName: 'Hoàng Đình Chi Hai',
        gender: GenderType.MALE,
      },
      {
        id: IDS.chi3Root,
        fullName: 'Hoàng Đình Chi Ba',
        gender: GenderType.MALE,
      },
      {
        id: IDS.chi4Root,
        fullName: 'Hoàng Đình Chi Tư',
        gender: GenderType.MALE,
      },
    ],
  });

  const family = await prisma.family.create({
    data: {
      name: 'Dòng họ Hoàng Đình',
      description: 'Seed deterministic — 20260811',
      founderPersonId: IDS.founder,
    },
  });

  const familyId = family.id;

  await prisma.familyPerson.createMany({
    data: [
      {
        familyId,
        personId: IDS.founder,
        membershipType: FamilyPersonMembershipType.LINEAGE,
        generation: 1,
      },
      {
        familyId,
        personId: IDS.son,
        membershipType: FamilyPersonMembershipType.LINEAGE,
        generation: 2,
      },
      {
        familyId,
        personId: IDS.daughter,
        membershipType: FamilyPersonMembershipType.LINEAGE,
        generation: 3,
      },
      {
        familyId,
        personId: IDS.externalChild,
        membershipType: FamilyPersonMembershipType.NON_LINEAGE,
        generation: null,
      },
      {
        familyId,
        personId: IDS.externalGrandchild,
        membershipType: FamilyPersonMembershipType.NON_LINEAGE,
        generation: null,
      },
      {
        familyId,
        personId: IDS.son2,
        membershipType: FamilyPersonMembershipType.LINEAGE,
        generation: 3,
      },
      {
        familyId,
        personId: IDS.polyPerson,
        membershipType: FamilyPersonMembershipType.LINEAGE,
        generation: 2,
      },
      {
        familyId,
        personId: IDS.spouseB,
        membershipType: FamilyPersonMembershipType.NON_LINEAGE,
        generation: null,
      },
      {
        familyId,
        personId: IDS.spouseC,
        membershipType: FamilyPersonMembershipType.NON_LINEAGE,
        generation: null,
      },
      {
        familyId,
        personId: IDS.chi2Root,
        membershipType: FamilyPersonMembershipType.LINEAGE,
        generation: 2,
      },
      {
        familyId,
        personId: IDS.chi3Root,
        membershipType: FamilyPersonMembershipType.LINEAGE,
        generation: 2,
      },
      {
        familyId,
        personId: IDS.chi4Root,
        membershipType: FamilyPersonMembershipType.LINEAGE,
        generation: 2,
      },
    ],
  });

  await prisma.relationship.createMany({
    data: [
      {
        sourcePersonId: IDS.founder,
        targetPersonId: IDS.son,
        relationshipType: RelationshipType.PARENT_CHILD,
      },
      {
        sourcePersonId: IDS.founder,
        targetPersonId: IDS.chi2Root,
        relationshipType: RelationshipType.PARENT_CHILD,
      },
      {
        sourcePersonId: IDS.founder,
        targetPersonId: IDS.chi3Root,
        relationshipType: RelationshipType.PARENT_CHILD,
      },
      {
        sourcePersonId: IDS.founder,
        targetPersonId: IDS.chi4Root,
        relationshipType: RelationshipType.PARENT_CHILD,
      },
      {
        sourcePersonId: IDS.son,
        targetPersonId: IDS.daughter,
        relationshipType: RelationshipType.PARENT_CHILD,
      },
      {
        sourcePersonId: IDS.son,
        targetPersonId: IDS.son2,
        relationshipType: RelationshipType.PARENT_CHILD,
      },
      {
        sourcePersonId: IDS.daughter,
        targetPersonId: IDS.externalChild,
        relationshipType: RelationshipType.PARENT_CHILD,
      },
      {
        sourcePersonId: IDS.externalChild,
        targetPersonId: IDS.externalGrandchild,
        relationshipType: RelationshipType.PARENT_CHILD,
      },
      {
        sourcePersonId: IDS.polyPerson,
        targetPersonId: IDS.spouseB,
        relationshipType: RelationshipType.SPOUSE,
      },
      {
        sourcePersonId: IDS.polyPerson,
        targetPersonId: IDS.spouseC,
        relationshipType: RelationshipType.SPOUSE,
      },
    ],
  });

  await prisma.branch.createMany({
    data: [
      {
        familyId,
        rootPersonId: IDS.son,
        branchType: BranchType.PRIMARY,
        branchCode: 'CHI_1',
        branchName: 'Chi 1',
        generation: 2,
      },
      {
        familyId,
        rootPersonId: IDS.chi2Root,
        branchType: BranchType.SECONDARY,
        branchCode: 'CHI_2',
        branchName: 'Chi 2',
        generation: 2,
      },
      {
        familyId,
        rootPersonId: IDS.chi3Root,
        branchType: BranchType.SECONDARY,
        branchCode: 'CHI_3',
        branchName: 'Chi 3',
        generation: 2,
      },
      {
        familyId,
        rootPersonId: IDS.chi4Root,
        branchType: BranchType.SECONDARY,
        branchCode: 'CHI_4',
        branchName: 'Chi 4',
        generation: 2,
      },
    ],
  });

  const grave = await prisma.grave.create({
    data: {
      name: 'Mộ Thủy Tổ',
      cemetery: 'Nghĩa trang Hoàng Đình',
      locationDescription: 'Hà Nội',
    },
  });

  await prisma.personGrave.create({
    data: {
      personId: IDS.founder,
      graveId: grave.id,
      role: GravePersonRole.OWNER,
    },
  });

  const meeting = await prisma.familyEvent.create({
    data: {
      familyId,
      name: 'Họp dòng họ 2026',
      eventType: EventType.FAMILY_MEETING,
      eventDate: new Date('2026-08-11'),
      location: 'Nhà văn hóa',
    },
  });

  await prisma.eventParticipant.createMany({
    data: [
      { eventId: meeting.id, personId: IDS.founder, role: 'honoree' },
      { eventId: meeting.id, personId: IDS.son, role: 'attendee' },
    ],
  });

  await prisma.familyEvent.createMany({
    data: [
      {
        familyId,
        name: 'Giỗ Thủy Tổ',
        eventType: EventType.MEMORIAL,
        eventDate: new Date('2026-03-01'),
      },
      {
        familyId,
        name: 'Viếng mộ',
        eventType: EventType.GRAVE_VISIT,
        eventDate: new Date('2026-04-15'),
      },
    ],
  });

  await prisma.media.create({
    data: {
      ownerType: MediaOwnerType.PERSON,
      ownerId: IDS.founder,
      mediaType: MediaType.PROFILE_PHOTO,
      fileUrl: 'https://example.com/founder.jpg',
      fileName: 'founder.jpg',
    },
  });

  console.log('Seed completed. Family id:', familyId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
