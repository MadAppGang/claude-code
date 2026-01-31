import React, {
	createContext,
	useContext,
	useState,
	type ReactNode,
} from "react";

// ============================================================================
// Context Type
// ============================================================================

interface Timeline {
	id: string;
	// Timeline instance from useTimeline hook
	instance: any;
}

interface AnimationContextValue {
	timelines: Map<string, any>;
	registerTimeline: (id: string, timeline: any) => void;
	unregisterTimeline: (id: string) => void;
}

// ============================================================================
// Context
// ============================================================================

const AnimationContext = createContext<AnimationContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface AnimationProviderProps {
	children: ReactNode;
}

export function AnimationProvider({ children }: AnimationProviderProps) {
	const [timelines, setTimelines] = useState<Map<string, any>>(new Map());

	const registerTimeline = (id: string, timeline: any) => {
		setTimelines((prev) => {
			const next = new Map(prev);
			next.set(id, timeline);
			return next;
		});
	};

	const unregisterTimeline = (id: string) => {
		setTimelines((prev) => {
			const next = new Map(prev);
			next.delete(id);
			return next;
		});
	};

	return (
		<AnimationContext.Provider
			value={{ timelines, registerTimeline, unregisterTimeline }}
		>
			{children}
		</AnimationContext.Provider>
	);
}

// ============================================================================
// Hook: useAnimation
// ============================================================================

export function useAnimation(): AnimationContextValue {
	const context = useContext(AnimationContext);
	if (!context) {
		throw new Error("useAnimation must be used within an AnimationProvider");
	}
	return context;
}
