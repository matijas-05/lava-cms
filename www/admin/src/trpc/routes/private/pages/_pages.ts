import { router } from "@/src/trpc";
import { addPage } from "./addPage";
import { checkConflict } from "./checkConflict";
import { deletePage } from "./deletePage";
import { duplicatePage } from "./duplicatePage";
import { editPage } from "./editPage";
import { editPageComponents } from "./editPageComponents";
import { getAllGroups } from "./getAllGroups";
import { getGroup } from "./getGroup";
import { getGroupContents } from "./getGroupContents";
import { getPageByUrl } from "./getPageByUrl";
import { getPageComponents } from "./getPageComponents";
import { movePage } from "./movePage";

export const pagesRouter = router({
	addPage,
	checkConflict,
	deletePage,
	duplicatePage,
	getPageByUrl,
	editPage,
	/** @returns A map describing the change from frontend id to backend id */
	editPageComponents,
	getPageComponents,
	getAllGroups,
	getGroup,
	getGroupContents,
	movePage,
});
