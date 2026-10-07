import { FamilyPerson, Person } from '@prisma/client';

export type PersonWithMembership = Person & {
  familyPerson?: FamilyPerson | null;
};

export function toPersonResponse(person: PersonWithMembership) {
  return {
    id: person.id,
    fullName: person.fullName,
    gender: person.gender,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    birthPlace: person.birthPlace,
    hometown: person.hometown,
    occupation: person.occupation,
    biography: person.biography,
    note: person.note,
    deletedAt: person.deletedAt,
    membership: person.familyPerson
      ? {
          familyId: person.familyPerson.familyId,
          type: person.familyPerson.membershipType,
          generation: person.familyPerson.generation,
        }
      : null,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
  };
}
