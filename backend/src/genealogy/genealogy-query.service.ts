import { Injectable } from '@nestjs/common';
import { Prisma, RelationshipType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type PersonGraphNode = {
  id: string;
  depth: number;
};

@Injectable()
export class GenealogyQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async isDescendantOf(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    if (ancestorId === descendantId) {
      return false;
    }
    const rows = await this.prisma.$queryRaw<{ exists: boolean }[]>(
      Prisma.sql`
        WITH RECURSIVE descendants AS (
          SELECT p.id, ARRAY[p.id]::uuid[] AS path, 0 AS depth
          FROM person p
          WHERE p.id = ${ancestorId}::uuid
          UNION ALL
          SELECT child.id, d.path || child.id, d.depth + 1
          FROM descendants d
          JOIN relationship r
            ON r.source_person_id = d.id
           AND r.relationship_type = 'PARENT_CHILD'::"RelationshipType"
          JOIN person child ON child.id = r.target_person_id
          WHERE NOT (child.id = ANY(d.path))
        )
        SELECT EXISTS(
          SELECT 1 FROM descendants
          WHERE id = ${descendantId}::uuid AND depth > 0
        ) AS exists
      `,
    );
    return rows[0]?.exists ?? false;
  }

  async findDescendants(
    rootId: string,
    maxDepth?: number,
  ): Promise<PersonGraphNode[]> {
    const depthFilter =
      maxDepth !== undefined
        ? Prisma.sql`AND d.depth < ${maxDepth}`
        : Prisma.empty;

    return this.prisma.$queryRaw<PersonGraphNode[]>(
      Prisma.sql`
        WITH RECURSIVE descendants AS (
          SELECT p.id, ARRAY[p.id]::uuid[] AS path, 0 AS depth
          FROM person p
          WHERE p.id = ${rootId}::uuid AND p.deleted_at IS NULL
          UNION ALL
          SELECT child.id, d.path || child.id, d.depth + 1
          FROM descendants d
          JOIN relationship r
            ON r.source_person_id = d.id
           AND r.relationship_type = 'PARENT_CHILD'::"RelationshipType"
          JOIN person child ON child.id = r.target_person_id
          WHERE NOT (child.id = ANY(d.path))
            AND child.deleted_at IS NULL
            ${depthFilter}
        )
        SELECT id, depth FROM descendants WHERE depth > 0 ORDER BY depth, id
      `,
    );
  }

  async findAncestors(
    personId: string,
    maxDepth?: number,
  ): Promise<PersonGraphNode[]> {
    const depthFilter =
      maxDepth !== undefined
        ? Prisma.sql`AND a.depth < ${maxDepth}`
        : Prisma.empty;

    return this.prisma.$queryRaw<PersonGraphNode[]>(
      Prisma.sql`
        WITH RECURSIVE ancestors AS (
          SELECT p.id, ARRAY[p.id]::uuid[] AS path, 0 AS depth
          FROM person p
          WHERE p.id = ${personId}::uuid AND p.deleted_at IS NULL
          UNION ALL
          SELECT parent.id, a.path || parent.id, a.depth + 1
          FROM ancestors a
          JOIN relationship r
            ON r.target_person_id = a.id
           AND r.relationship_type = 'PARENT_CHILD'::"RelationshipType"
          JOIN person parent ON parent.id = r.source_person_id
          WHERE NOT (parent.id = ANY(a.path))
            AND parent.deleted_at IS NULL
            ${depthFilter}
        )
        SELECT id, depth FROM ancestors WHERE depth > 0 ORDER BY depth, id
      `,
    );
  }

  async findChildren(personId: string): Promise<string[]> {
    const rows = await this.prisma.relationship.findMany({
      where: {
        sourcePersonId: personId,
        relationshipType: RelationshipType.PARENT_CHILD,
        targetPerson: { deletedAt: null },
      },
      select: { targetPersonId: true },
    });
    return rows.map((r) => r.targetPersonId);
  }

  async findParents(personId: string): Promise<string[]> {
    const rows = await this.prisma.relationship.findMany({
      where: {
        targetPersonId: personId,
        relationshipType: RelationshipType.PARENT_CHILD,
        sourcePerson: { deletedAt: null },
      },
      select: { sourcePersonId: true },
    });
    return rows.map((r) => r.sourcePersonId);
  }

  async findSpouses(personId: string): Promise<string[]> {
    const rows = await this.prisma.relationship.findMany({
      where: {
        relationshipType: RelationshipType.SPOUSE,
        OR: [{ sourcePersonId: personId }, { targetPersonId: personId }],
      },
    });
    return rows.map((r) =>
      r.sourcePersonId === personId ? r.targetPersonId : r.sourcePersonId,
    );
  }
}
