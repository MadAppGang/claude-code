/**
 * Simple fuzzy search utility for filtering lists
 * Uses a scoring algorithm that rewards:
 * - Consecutive character matches
 * - Matches at word boundaries
 * - Matches at start of string
 */

export interface FuzzyMatch<T> {
	item: T;
	score: number;
	matches: number[]; // indices of matched characters
}

/**
 * Calculate fuzzy match score for a query against a target string
 * Returns null if no match, otherwise returns score and match indices
 */
export function fuzzyMatch(
	query: string,
	target: string,
): { score: number; matches: number[] } | null {
	if (!query) return { score: 1, matches: [] };

	const queryLower = query.toLowerCase();
	const targetLower = target.toLowerCase();

	let queryIdx = 0;
	let score = 0;
	const matches: number[] = [];
	let prevMatchIdx = -1;

	for (let i = 0; i < targetLower.length && queryIdx < queryLower.length; i++) {
		if (targetLower[i] === queryLower[queryIdx]) {
			matches.push(i);

			// Bonus for consecutive matches
			if (prevMatchIdx === i - 1) {
				score += 5;
			}

			// Bonus for matching at word boundary
			if (i === 0 || /[\s\-_.]/.test(target[i - 1])) {
				score += 10;
			}

			// Bonus for matching at start
			if (i === 0) {
				score += 15;
			}

			// Base score for each match
			score += 1;

			prevMatchIdx = i;
			queryIdx++;
		}
	}

	// All query characters must be found
	if (queryIdx !== queryLower.length) {
		return null;
	}

	// Penalty for longer strings (prefer shorter, more precise matches)
	score -= Math.floor(target.length / 10);

	return { score, matches };
}

/**
 * Filter and sort items by fuzzy match score
 */
export function fuzzyFilter<T>(
	items: T[],
	query: string,
	getText: (item: T) => string,
): FuzzyMatch<T>[] {
	if (!query.trim()) {
		return items.map((item) => ({ item, score: 1, matches: [] }));
	}

	const results: FuzzyMatch<T>[] = [];

	for (const item of items) {
		const text = getText(item);
		const match = fuzzyMatch(query, text);

		if (match) {
			results.push({
				item,
				score: match.score,
				matches: match.matches,
			});
		}
	}

	// Sort by score descending
	return results.sort((a, b) => b.score - a.score);
}

/**
 * Highlight matched characters in a string
 * Returns array of { text, highlighted } segments
 */
export function highlightMatches(
	text: string,
	matches: number[],
): Array<{ text: string; highlighted: boolean }> {
	if (matches.length === 0) {
		return [{ text, highlighted: false }];
	}

	const matchSet = new Set(matches);
	const segments: Array<{ text: string; highlighted: boolean }> = [];
	let currentSegment = "";
	let isHighlighted = matchSet.has(0);

	for (let i = 0; i < text.length; i++) {
		const shouldHighlight = matchSet.has(i);

		if (shouldHighlight !== isHighlighted) {
			if (currentSegment) {
				segments.push({ text: currentSegment, highlighted: isHighlighted });
			}
			currentSegment = text[i];
			isHighlighted = shouldHighlight;
		} else {
			currentSegment += text[i];
		}
	}

	if (currentSegment) {
		segments.push({ text: currentSegment, highlighted: isHighlighted });
	}

	return segments;
}
