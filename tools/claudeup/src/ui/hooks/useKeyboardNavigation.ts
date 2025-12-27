import { useInput, useApp as useInkApp } from 'ink';
import { useApp, useNavigation } from '../state/AppContext.js';

interface KeyboardOptions {
  /** Total number of items in the list */
  itemCount: number;
  /** Current selected index */
  selectedIndex: number;
  /** Callback to update selected index */
  onSelect: (index: number) => void;
  /** Callback when Enter is pressed on selected item */
  onEnter?: (index: number) => void;
  /** Callback when Escape/q is pressed */
  onBack?: () => void;
  /** Callback for custom key handlers */
  customKeys?: Record<string, () => void>;
  /** Disabled keyboard input (e.g., during modal) */
  disabled?: boolean;
}

/**
 * Hook for handling keyboard navigation in lists
 * Provides j/k/up/down for navigation, Enter for selection, Escape/q for back
 */
export function useKeyboardNavigation({
  itemCount,
  selectedIndex,
  onSelect,
  onEnter,
  onBack,
  customKeys = {},
  disabled = false,
}: KeyboardOptions): void {
  const { state } = useApp();
  const { exit } = useInkApp();

  useInput(
    (input, key) => {
      // Don't handle input when disabled or modal is open
      if (disabled || state.isSearching) return;

      // Navigation: up/down or j/k
      if (key.upArrow || input === 'k') {
        const newIndex = Math.max(0, selectedIndex - 1);
        if (newIndex !== selectedIndex) {
          onSelect(newIndex);
        }
      } else if (key.downArrow || input === 'j') {
        const newIndex = Math.min(itemCount - 1, selectedIndex + 1);
        if (newIndex !== selectedIndex) {
          onSelect(newIndex);
        }
      }

      // Selection: Enter
      else if (key.return && onEnter) {
        onEnter(selectedIndex);
      }

      // Back: Escape or q
      else if ((key.escape || input === 'q') && onBack) {
        onBack();
      }

      // Exit: Ctrl+C
      else if (key.ctrl && input === 'c') {
        exit();
      }

      // Custom keys
      else if (input && customKeys[input]) {
        customKeys[input]();
      }
    },
    { isActive: !disabled }
  );
}

/**
 * Hook for global keyboard shortcuts (screen navigation)
 */
export function useGlobalKeyboard(): void {
  const { state } = useApp();
  const { navigateToScreen, currentScreen } = useNavigation();
  const { exit } = useInkApp();

  useInput(
    (input, key) => {
      // Don't handle input when modal is open
      if (state.isSearching) return;

      // Number keys for quick navigation
      if (input === '1') {
        navigateToScreen('plugins');
      } else if (input === '2') {
        navigateToScreen('mcp');
      } else if (input === '3') {
        navigateToScreen('statusline');
      } else if (input === '4') {
        navigateToScreen('env-vars');
      } else if (input === '5') {
        navigateToScreen('cli-tools');
      }

      // Exit on Ctrl+C
      else if (key.ctrl && input === 'c') {
        exit();
      }

      // Quit on q only from home screen (plugins)
      else if (input === 'q' && currentScreen === 'plugins') {
        exit();
      }
    },
    { isActive: true }
  );
}
