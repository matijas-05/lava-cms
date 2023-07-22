import * as React from "react";
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table";
import { setCookie } from "cookies-next";
import type { SearchParams } from "@admin/app/dashboard/pages/page";
import {
	getJsonCookie,
	permanentCookieOptions,
	type CookieName,
	type TableCookie,
} from "@admin/src/utils/cookies";
import { useSearchParams } from "./useSearchParams";
import { Input } from "../components/ui/client";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface Options<T> {
	data: T[];
	columns: ColumnDef<T>[];
	cookie: {
		name: CookieName;
		contents: TableCookie | null;
		default: TableCookie;
	};
	pagination: SearchParams;
}

/** A hook that provides data for a table with sorting, filtering, and pagination, all saved to a cookie. **/
export function useTable<T>(options: Options<T>) {
	const parsedCookie = React.useMemo(
		() =>
			getJsonCookie<TableCookie>(
				options.cookie.name,
				options.cookie.contents ?? options.cookie.default,
			),
		[options.cookie],
	);

	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = React.useState<SortingState>(() => [
		{ id: parsedCookie.id, desc: parsedCookie.desc },
	]);

	const [pagination, setPagination] = React.useState<PaginationState>(() => ({
		pageIndex: options.pagination?.pageIndex ?? 0,
		pageSize: parsedCookie.pageSize ?? 10,
	}));
	const { setSearchParams } = useSearchParams({
		onChanged: (searchParams) => {
			setPagination((pagination) => ({
				...pagination,
				pageIndex: parseInt(searchParams.get("pageIndex") ?? "0"),
			}));
		},
	});

	React.useEffect(() => {
		setSearchParams({
			pageIndex: pagination.pageIndex === 0 ? undefined : pagination.pageIndex,
		} satisfies SearchParams);
	}, [pagination.pageIndex, setSearchParams]);
	React.useEffect(() => {
		setCookie(
			options.cookie.name,
			JSON.stringify({ ...sorting[0], pageSize: pagination.pageSize } as TableCookie),
			permanentCookieOptions,
		);
	}, [options.cookie, pagination, sorting]);

	const table = useReactTable({
		data: options.data,
		columns: options.columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		autoResetPageIndex: false,
		onColumnFiltersChange: setColumnFilters,
		onSortingChange: (value) => {
			setSorting(value);
			setCookie(
				options.cookie.name,
				// @ts-expect-error `value` type is weird
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				JSON.stringify({ ...value()[0], pageSize: pagination.pageSize } as TableCookie),
				permanentCookieOptions,
			);
		},
		onPaginationChange: setPagination,
		state: {
			columnFilters,
			sorting,
			pagination,
		},
	});

	const searchElement = (
		<Input
			type="search"
			className="mr-auto w-auto"
			value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
			onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
			icon={<MagnifyingGlassIcon className="w-4" />}
		/>
	);

	return {
		table,
		searchElement,
	};
}