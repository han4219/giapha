import { Injectable } from '@nestjs/common';
import { PersonGraphNode } from '../genealogy/genealogy-query.service';
import { GenealogyQueryService } from '../genealogy/genealogy-query.service';
import { PrismaService } from '../prisma/prisma.service';
import { toPersonResponse } from './person.mapper';
import { PersonService } from './person.service';

@Injectable()
export class PersonContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personService: PersonService,
    private readonly genealogy: GenealogyQueryService,
  ) {}

  async loadRelatedPersons(idsPromise: Promise<string[]>) {
    const ids = await idsPromise;
    if (ids.length === 0) return [];
    const persons = await this.prisma.person.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: { familyPerson: true },
    });
    return persons.map(toPersonResponse);
  }

  async loadGraphNodes(nodes: Promise<PersonGraphNode[]>) {
    const graph = await nodes;
    if (graph.length === 0) return [];
    const ids = graph.map((n) => n.id);
    const persons = await this.prisma.person.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: { familyPerson: true },
    });
    const byId = new Map(persons.map((p) => [p.id, p]));
    return graph
      .filter((n) => byId.has(n.id))
      .map((n) => ({
        depth: n.depth,
        person: toPersonResponse(byId.get(n.id)!),
      }));
  }

  async findSiblings(personId: string) {
    const parentIds = await this.genealogy.findParents(personId);
    if (parentIds.length === 0) return [];
    const siblingIds = new Set<string>();
    for (const parentId of parentIds) {
      const children = await this.genealogy.findChildren(parentId);
      for (const c of children) {
        if (c !== personId) siblingIds.add(c);
      }
    }
    return this.loadRelatedPersons(Promise.resolve([...siblingIds]));
  }

  async buildFamilyContext(
    focusPersonId: string,
    opts: {
      ancestorDepth: number;
      descendantDepth: number;
      includeNonLineage: boolean;
    },
  ) {
    await this.personService.ensureActive(focusPersonId);
    const focus = await this.personService.findById(focusPersonId);

    const ancestors = await this.loadGraphNodes(
      this.genealogy.findAncestors(focusPersonId, opts.ancestorDepth),
    );
    let descendants = await this.loadGraphNodes(
      this.genealogy.findDescendants(focusPersonId, opts.descendantDepth),
    );

    if (!opts.includeNonLineage) {
      descendants = await this.filterLineageOnly(focusPersonId, descendants);
    }

    return {
      focusPerson: focus,
      includeNonLineage: opts.includeNonLineage,
      ancestors,
      descendants,
    };
  }

  private async filterLineageOnly(
    rootId: string,
    descendants: { depth: number; person: ReturnType<typeof toPersonResponse> }[],
  ) {
    const allowed = new Set<string>();
    allowed.add(rootId);
    const queue = [rootId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = await this.genealogy.findChildren(current);
      for (const childId of children) {
        const fp = await this.prisma.familyPerson.findUnique({
          where: { personId: childId },
        });
        if (fp?.membershipType === 'LINEAGE') {
          allowed.add(childId);
          queue.push(childId);
        }
      }
    }

    return descendants.filter((d) => allowed.has(d.person.id));
  }
}
