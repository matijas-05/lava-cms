import { router } from "@/src/trpc";
import { addComponentDefinition } from "./addComponentDefinition";
import { addGroup } from "./addGroup";
import { deleteComponentDefinition } from "./deleteComponentDefinition";
import { deleteGroup } from "./deleteGroup";
import { editComponentDefinition } from "./editComponentDefinition";
import { editGroup } from "./editGroup";
import { getAllGroups } from "./getAllGroups";
import { getComponentDefinition } from "./getComponentDefinition";
import { getGroup } from "./getGroup";

export const componentsRouter = router({
	addComponentDefinition,
	/** @returns A map describing the change from frontend id to backend id */
	editComponentDefinition,
	deleteComponentDefinition,
	addGroup,
	editGroup,
	deleteGroup,
	getAllGroups,
	getComponentDefinition,
	getGroup,
});
