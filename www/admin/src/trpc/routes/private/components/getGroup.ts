import { z } from "zod";
import type { ComponentDefinitionGroup, Prisma } from "@prisma/client";
import { prisma } from "@admin/prisma/client";
import { privateProcedure } from "@admin/src/trpc";
import { TRPCError } from "@trpc/server";
import type { Breadcrumb } from "@admin/src/components/DataTable";
import type { DefaultArgs } from "@prisma/client/runtime/library";

export const getGroup = privateProcedure
	.input(
		z
			.object({
				id: z.string().cuid(),
			})
			.nullish(),
	)
	.query(async ({ input }) => {
		const include = {
			groups: true,
			component_definitions: {
				include: {
					components: true,
					field_definitions: {
						orderBy: {
							order: "asc",
						},
					},
				},
			},
		} satisfies Prisma.ComponentDefinitionGroupInclude<DefaultArgs>;

		// Get root group if no input is provided
		if (!input) {
			const group = await prisma.componentDefinitionGroup.findFirstOrThrow({
				where: {
					parent_group_id: null,
				},
				include,
			});

			return {
				group,
				breadcrumbs: [],
			};
		}

		const group = await prisma.componentDefinitionGroup.findUnique({
			where: {
				id: input.id,
			},
			include,
		});
		if (!group) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}

		const breadcrumbs = await getBreadcrumbs(group);
		return {
			group,
			breadcrumbs,
		};
	});

async function getBreadcrumbs(group: ComponentDefinitionGroup): Promise<Breadcrumb[]> {
	const breadcrumbs = await prisma.$queryRaw<Breadcrumb[]>`
		WITH RECURSIVE breadcrumbs AS (
  	  	  SELECT
    		id,
    		name,
    		parent_group_id
  	  	  FROM
    		frontend.component_definition_group
  	  	  WHERE
    		id = ${group.id}
  	  	  UNION
  	  	  SELECT
    		cdg.id,
    		cdg.name,
    		cdg.parent_group_id
  	  	  FROM
    		frontend.component_definition_group cdg
  	  	  INNER JOIN
    		breadcrumbs bc
  	  	  ON
    		cdg.id = bc.parent_group_id
  	  	  WHERE cdg.parent_group_id IS NOT NULL
		)
		SELECT
  	  	  id,
  	  	  name
		FROM
  	  	  breadcrumbs;
`;

	return breadcrumbs.reverse();
}