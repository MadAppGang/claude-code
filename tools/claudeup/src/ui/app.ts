import blessed from 'neo-blessed';
import type { Screen } from '../types/index.js';
import { createMainMenu } from './screens/main-menu.js';
import { createMcpScreen } from './screens/mcp-setup.js';
import { createMarketplaceScreen } from './screens/marketplace.js';
import { createPluginsScreen } from './screens/plugins.js';
import { createStatusLineScreen } from './screens/statusline.js';

export interface AppState {
  screen: blessed.Screen;
  currentScreen: Screen;
  projectPath: string;
  isSearching: boolean;
}

// Claude Code color palette
export const colors = {
  primary: 'cyan',
  secondary: 'magenta',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  muted: 'gray',
  bg: 'black',
  fg: 'white',
};

export function createApp(): AppState {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'claudeup',
    fullUnicode: true,
  });

  const state: AppState = {
    screen,
    currentScreen: 'plugins', // Default to plugins screen
    projectPath: process.cwd(),
    isSearching: false,
  };

  // Global key bindings - check isSearching to prevent conflicts
  screen.key(['escape', 'q', 'C-c'], () => {
    if (state.isSearching) return; // Let search handler handle escape
    if (state.currentScreen === 'plugins') {
      process.exit(0);
    } else {
      navigateTo(state, 'plugins');
    }
  });

  screen.key(['?'], () => {
    if (state.isSearching) return;
    showHelp(state);
  });

  // Quick navigation keys - disabled during search or in sub-screens
  const isTopLevelScreen = (screen: Screen): boolean => {
    return ['plugins', 'marketplace', 'mcp', 'statusline'].includes(screen);
  };

  screen.key(['1'], () => {
    if (state.isSearching || !isTopLevelScreen(state.currentScreen)) return;
    navigateTo(state, 'plugins');
  });
  screen.key(['2'], () => {
    if (state.isSearching || !isTopLevelScreen(state.currentScreen)) return;
    navigateTo(state, 'marketplace');
  });
  screen.key(['3'], () => {
    if (state.isSearching || !isTopLevelScreen(state.currentScreen)) return;
    navigateTo(state, 'mcp');
  });
  screen.key(['4'], () => {
    if (state.isSearching || !isTopLevelScreen(state.currentScreen)) return;
    navigateTo(state, 'statusline');
  });

  return state;
}

export async function navigateTo(state: AppState, screen: Screen): Promise<void> {
  // Clear current screen content - destroy all children
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children = [...state.screen.children] as any[];
  for (const child of children) {
    if (child.type !== 'screen') {
      child.detach();
      child.destroy();
    }
  }

  // Remove all global screen key bindings to prevent cross-screen contamination
  // This removes keys like 'r' for refresh that were set by plugins screen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scr = state.screen as any;
  if (scr.unkey && typeof scr.unkey === 'function') {
    // Remove common global keys that might have been set
    try {
      scr.unkey(['r']);
      scr.unkey(['u']);
      scr.unkey(['d']);
      scr.unkey(['a']);
    } catch (e) {
      // Ignore errors if keys weren't bound
    }
  }

  // Force clear and redraw the screen
  if (scr.clearRegion) {
    scr.clearRegion(0, scr.width, 0, scr.height);
  }
  if (scr.realloc) {
    scr.realloc();
  }

  state.currentScreen = screen;

  switch (screen) {
    case 'main':
      createMainMenu(state);
      break;
    case 'mcp':
      await createMcpScreen(state);
      break;
    case 'mcp-registry':
      const { createMcpRegistryScreen } = await import('./screens/mcp-registry.js');
      await createMcpRegistryScreen(state);
      break;
    case 'marketplace':
      await createMarketplaceScreen(state);
      break;
    case 'plugins':
      await createPluginsScreen(state);
      break;
    case 'statusline':
      await createStatusLineScreen(state);
      break;
  }

  state.screen.render();
}

export function showHelp(state: AppState): void {
  const helpBox = blessed.box({
    parent: state.screen,
    top: 'center',
    left: 'center',
    width: 60,
    height: 20,
    content: `
{center}{bold}{cyan-fg}claudeup{/cyan-fg} Help{/bold}{/center}

{bold}Navigation{/bold}
  {cyan-fg}↑/↓{/cyan-fg} {gray-fg}or{/gray-fg} {cyan-fg}j/k{/cyan-fg}    Move selection
  {cyan-fg}Enter{/cyan-fg}          Select / Toggle
  {cyan-fg}Escape{/cyan-fg} {gray-fg}or{/gray-fg} {cyan-fg}q{/cyan-fg}   Back / Quit
  {cyan-fg}?{/cyan-fg}              This help

{bold}Quick Navigation{/bold}
  {cyan-fg}1{/cyan-fg}  Plugins       {cyan-fg}3{/cyan-fg}  MCP Servers
  {cyan-fg}2{/cyan-fg}  Marketplaces  {cyan-fg}4{/cyan-fg}  Status Line

{bold}Plugin Actions{/bold}
  {cyan-fg}u{/cyan-fg}  Update        {cyan-fg}d{/cyan-fg}  Uninstall
  {cyan-fg}a{/cyan-fg}  Update All    {cyan-fg}r{/cyan-fg}  Refresh

{bold}MCP Servers{/bold}
  {cyan-fg}/{/cyan-fg}  Search local + remote
  {cyan-fg}r{/cyan-fg}  Browse PulseMCP registry
    `.trim(),
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: 'cyan',
      },
    },
  });

  helpBox.key(['escape', 'q', 'enter', '?'], () => {
    helpBox.destroy();
    state.screen.render();
  });

  helpBox.focus();
  state.screen.render();
}

export function showMessage(
  state: AppState,
  title: string,
  message: string,
  type: 'info' | 'success' | 'error' = 'info'
): Promise<void> {
  return new Promise((resolve) => {
    const borderColors = {
      info: 'cyan',
      success: 'green',
      error: 'red',
    };

    const icons = {
      info: 'ℹ',
      success: '✓',
      error: '✗',
    };

    const msgBox = blessed.box({
      parent: state.screen,
      top: 'center',
      left: 'center',
      width: 'shrink',
      height: 'shrink',
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      content: `{center}{bold}${icons[type]} ${title}{/bold}{/center}\n\n${message}\n\n{center}{gray-fg}Enter to continue{/gray-fg}{/center}`,
      tags: true,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: borderColors[type],
        },
      },
    });

    msgBox.key(['escape', 'q', 'enter'], () => {
      msgBox.destroy();
      state.screen.render();
      resolve();
    });

    msgBox.focus();
    state.screen.render();
  });
}

export function showConfirm(
  state: AppState,
  title: string,
  message: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const confirmBox = blessed.box({
      parent: state.screen,
      top: 'center',
      left: 'center',
      width: 'shrink',
      height: 'shrink',
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      content: `{center}{bold}${title}{/bold}{/center}\n\n${message}\n\n{center}{green-fg}[Y]{/green-fg}es  {red-fg}[N]{/red-fg}o{/center}`,
      tags: true,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'yellow',
        },
      },
    });

    confirmBox.key(['y', 'Y'], () => {
      confirmBox.destroy();
      state.screen.render();
      resolve(true);
    });

    confirmBox.key(['n', 'N', 'escape', 'q'], () => {
      confirmBox.destroy();
      state.screen.render();
      resolve(false);
    });

    confirmBox.focus();
    state.screen.render();
  });
}

export function showInput(
  state: AppState,
  title: string,
  label: string,
  defaultValue?: string
): Promise<string | null> {
  return new Promise((resolve) => {
    let value = defaultValue || '';
    let resolved = false;

    // Block global key handlers while input is active
    state.isSearching = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const form = blessed.box({
      parent: state.screen,
      top: 'center',
      left: 'center',
      width: 60,
      height: 10,
      keys: true,
      inputOnFocus: true,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'cyan',
        },
      },
    } as any);

    blessed.text({
      parent: form,
      top: 0,
      left: 1,
      content: `{bold}${title}{/bold}`,
      tags: true,
    });

    blessed.text({
      parent: form,
      top: 2,
      left: 1,
      content: label,
    });

    const inputBox = blessed.box({
      parent: form,
      top: 3,
      left: 1,
      width: 56,
      height: 3,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'green',
        },
      },
    });

    const inputText = blessed.box({
      parent: inputBox,
      top: 0,
      left: 0,
      width: '100%-2',
      height: 1,
      content: value + '{inverse} {/inverse}',
      tags: true,
    });

    blessed.text({
      parent: form,
      top: 7,
      left: 1,
      content: '{gray-fg}Enter to confirm • Escape to cancel{/gray-fg}',
      tags: true,
    });

    const updateInput = (): void => {
      inputText.setContent(value + '{inverse} {/inverse}');
      state.screen.render();
    };

    const cleanup = (): void => {
      state.isSearching = false;
      form.destroy();
      state.screen.render();
    };

    // Handle keyboard input on the form element directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formAny = form as any;

    formAny.on('keypress', (ch: string, key: { name: string; full: string }) => {
      if (resolved) return;

      if (key.name === 'escape') {
        resolved = true;
        cleanup();
        resolve(null);
      } else if (key.name === 'enter' || key.name === 'return') {
        resolved = true;
        cleanup();
        resolve(value);
      } else if (key.name === 'backspace') {
        value = value.slice(0, -1);
        updateInput();
      } else if (ch && ch.length === 1 && !key.full.startsWith('C-')) {
        value += ch;
        updateInput();
      }
    });

    form.focus();
    state.screen.render();
  });
}

export function createBackground(state: AppState): blessed.BoxElement {
  return blessed.box({
    parent: state.screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    style: {
      bg: 'black',
    },
  });
}

export function createHeader(state: AppState, _title: string): blessed.BoxElement {
  // Always create background first to clear the screen
  createBackground(state);

  // Navigation tabs
  const tabs = [
    { key: '1', label: 'Plugins', screen: 'plugins' as Screen },
    { key: '2', label: 'Marketplaces', screen: 'marketplace' as Screen },
    { key: '3', label: 'MCP', screen: 'mcp' as Screen },
    { key: '4', label: 'Status', screen: 'statusline' as Screen },
  ];

  const tabContent = tabs
    .map((tab) => {
      const isActive = state.currentScreen === tab.screen;
      if (isActive) {
        return `{cyan-fg}{bold}[${tab.key}] ${tab.label}{/bold}{/cyan-fg}`;
      }
      return `{gray-fg}[${tab.key}] ${tab.label}{/gray-fg}`;
    })
    .join('  ');

  return blessed.box({
    parent: state.screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: `{bold}{cyan-fg}◆ claudeup{/cyan-fg}{/bold}  ${tabContent}\n{gray-fg}${'─'.repeat(80)}{/gray-fg}`,
    tags: true,
    style: {
      fg: 'white',
    },
  });
}

export function createFooter(state: AppState, hints: string): blessed.BoxElement {
  return blessed.box({
    parent: state.screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: `{gray-fg}${hints}{/gray-fg}`,
    tags: true,
  });
}
