import { useState, useEffect, useCallback } from "react";
import type { AsyncData } from "../state/types.js";

interface UseAsyncDataOptions<T> {
	/** Function that fetches data */
	fetcher: () => Promise<T>;
	/** Dependencies that trigger refetch when changed */
	deps?: unknown[];
	/** Whether to fetch immediately on mount */
	immediate?: boolean;
}

interface UseAsyncDataResult<T> {
	/** Current async data state */
	data: AsyncData<T>;
	/** Whether data is currently loading */
	isLoading: boolean;
	/** Whether data has been successfully loaded */
	isSuccess: boolean;
	/** Whether there was an error loading data */
	isError: boolean;
	/** Error if any */
	error: Error | null;
	/** Trigger a manual refetch */
	refetch: () => Promise<void>;
	/** Raw data if available */
	value: T | null;
}

/**
 * Hook for fetching async data with loading/error states
 */
export function useAsyncData<T>({
	fetcher,
	deps = [],
	immediate = true,
}: UseAsyncDataOptions<T>): UseAsyncDataResult<T> {
	const [data, setData] = useState<AsyncData<T>>({ status: "idle" });

	const refetch = useCallback(async () => {
		setData({ status: "loading" });
		try {
			const result = await fetcher();
			setData({ status: "success", data: result });
		} catch (err) {
			setData({
				status: "error",
				error: err instanceof Error ? err : new Error(String(err)),
			});
		}
	}, [fetcher]);

	useEffect(() => {
		if (immediate) {
			refetch();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	return {
		data,
		isLoading: data.status === "loading",
		isSuccess: data.status === "success",
		isError: data.status === "error",
		error: data.status === "error" ? data.error : null,
		refetch,
		value: data.status === "success" ? data.data : null,
	};
}

/**
 * Hook for fetching async data with debounced query
 */
export function useDebouncedAsyncData<T>({
	fetcher,
	query,
	debounceMs = 300,
	minQueryLength = 1,
}: {
	fetcher: (query: string) => Promise<T>;
	query: string;
	debounceMs?: number;
	minQueryLength?: number;
}): UseAsyncDataResult<T> {
	const [data, setData] = useState<AsyncData<T>>({ status: "idle" });

	const refetch = useCallback(async () => {
		if (query.length < minQueryLength) {
			setData({ status: "idle" });
			return;
		}

		setData({ status: "loading" });
		try {
			const result = await fetcher(query);
			setData({ status: "success", data: result });
		} catch (err) {
			setData({
				status: "error",
				error: err instanceof Error ? err : new Error(String(err)),
			});
		}
	}, [fetcher, query, minQueryLength]);

	useEffect(() => {
		if (query.length < minQueryLength) {
			setData({ status: "idle" });
			return;
		}

		const timeoutId = setTimeout(() => {
			refetch();
		}, debounceMs);

		return () => clearTimeout(timeoutId);
	}, [query, debounceMs, minQueryLength, refetch]);

	return {
		data,
		isLoading: data.status === "loading",
		isSuccess: data.status === "success",
		isError: data.status === "error",
		error: data.status === "error" ? data.error : null,
		refetch,
		value: data.status === "success" ? data.data : null,
	};
}
