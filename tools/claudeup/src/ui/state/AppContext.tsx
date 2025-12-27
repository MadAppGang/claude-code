import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import { appReducer, initialState } from './reducer.js';
import type { AppState, AppAction, Route, ModalState, ProgressState } from './types.js';

// ============================================================================
// Context Type
// ============================================================================

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// ============================================================================
// Context
// ============================================================================

const AppContext = createContext<AppContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
  initialProjectPath?: string;
}

export function AppProvider({ children, initialProjectPath }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    projectPath: initialProjectPath || process.cwd(),
  });

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

// ============================================================================
// Hook: useApp
// ============================================================================

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// ============================================================================
// Hook: useNavigation
// ============================================================================

export function useNavigation() {
  const { state, dispatch } = useApp();

  return {
    currentRoute: state.currentRoute,
    currentScreen: state.currentRoute.screen,

    navigateTo: (route: Route) => {
      dispatch({ type: 'NAVIGATE', route });
    },

    navigateToScreen: (screen: Route['screen']) => {
      dispatch({ type: 'NAVIGATE', route: { screen } as Route });
    },
  };
}

// ============================================================================
// Hook: useModal
// ============================================================================

export function useModal() {
  const { dispatch } = useApp();

  return {
    showModal: (modal: ModalState) => {
      dispatch({ type: 'SHOW_MODAL', modal });
    },

    hideModal: () => {
      dispatch({ type: 'HIDE_MODAL' });
    },

    confirm: (title: string, message: string): Promise<boolean> => {
      return new Promise((resolve) => {
        dispatch({
          type: 'SHOW_MODAL',
          modal: {
            type: 'confirm',
            title,
            message,
            onConfirm: () => {
              dispatch({ type: 'HIDE_MODAL' });
              resolve(true);
            },
            onCancel: () => {
              dispatch({ type: 'HIDE_MODAL' });
              resolve(false);
            },
          },
        });
      });
    },

    input: (title: string, label: string, defaultValue?: string): Promise<string | null> => {
      return new Promise((resolve) => {
        dispatch({
          type: 'SHOW_MODAL',
          modal: {
            type: 'input',
            title,
            label,
            defaultValue,
            onSubmit: (value: string) => {
              dispatch({ type: 'HIDE_MODAL' });
              resolve(value);
            },
            onCancel: () => {
              dispatch({ type: 'HIDE_MODAL' });
              resolve(null);
            },
          },
        });
      });
    },

    select: (
      title: string,
      message: string,
      options: { label: string; value: string; description?: string }[]
    ): Promise<string | null> => {
      return new Promise((resolve) => {
        dispatch({
          type: 'SHOW_MODAL',
          modal: {
            type: 'select',
            title,
            message,
            options,
            onSelect: (value: string) => {
              dispatch({ type: 'HIDE_MODAL' });
              resolve(value);
            },
            onCancel: () => {
              dispatch({ type: 'HIDE_MODAL' });
              resolve(null);
            },
          },
        });
      });
    },

    message: (
      title: string,
      message: string,
      variant: 'info' | 'success' | 'error' = 'info'
    ): Promise<void> => {
      return new Promise((resolve) => {
        dispatch({
          type: 'SHOW_MODAL',
          modal: {
            type: 'message',
            title,
            message,
            variant,
            onDismiss: () => {
              dispatch({ type: 'HIDE_MODAL' });
              resolve();
            },
          },
        });
      });
    },

    loading: (message: string) => {
      dispatch({
        type: 'SHOW_MODAL',
        modal: {
          type: 'loading',
          message,
        },
      });
    },
  };
}

// ============================================================================
// Hook: useProgress
// ============================================================================

export function useProgress() {
  const { state, dispatch } = useApp();

  return {
    progress: state.progress,
    isVisible: state.progress !== null,

    show: (message: string, current?: number, total?: number) => {
      dispatch({ type: 'SHOW_PROGRESS', state: { message, current, total } });
    },

    update: (state: ProgressState) => {
      dispatch({ type: 'UPDATE_PROGRESS', state });
    },

    hide: () => {
      dispatch({ type: 'HIDE_PROGRESS' });
    },
  };
}
