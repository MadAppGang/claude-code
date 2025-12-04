import blessed from 'neo-blessed';
import type { AppState } from '../app.js';
import { createHeader, createFooter, showMessage, showConfirm } from '../app.js';
import { defaultMarketplaces } from '../../data/marketplaces.js';
import {
  addMarketplace,
  removeMarketplace,
  getConfiguredMarketplaces,
} from '../../services/claude-settings.js';

export async function createMarketplaceScreen(state: AppState): Promise<void> {
  createHeader(state, 'Plugin Marketplaces');

  const configuredMarketplaces = await getConfiguredMarketplaces(state.projectPath);

  // Build list items
  const listItems: {
    label: string;
    marketplace: (typeof defaultMarketplaces)[0];
    installed: boolean;
  }[] = [];

  for (const marketplace of defaultMarketplaces) {
    const isInstalled = configuredMarketplaces[marketplace.name] !== undefined;

    const status = isInstalled ? '{green-fg}✓{/green-fg}' : '  ';
    const officialBadge = marketplace.official ? ' {cyan-fg}[Official]{/cyan-fg}' : '';

    listItems.push({
      label: `${status} ${marketplace.displayName}${officialBadge}`,
      marketplace,
      installed: isInstalled,
    });
  }

  // Info box
  blessed.box({
    parent: state.screen,
    top: 3,
    left: 2,
    width: '100%-4',
    height: 4,
    content: `Marketplaces provide plugins for Claude Code.
Add marketplaces to access their plugins in the Plugins screen.

{gray-fg}Note: Changes are saved to .claude/settings.json (shared with team){/gray-fg}`,
    tags: true,
  });

  const list = blessed.list({
    parent: state.screen,
    top: 8,
    left: 2,
    width: '100%-4',
    height: listItems.length + 2,
    items: listItems.map((item) => item.label),
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      selected: {
        bg: 'blue',
        fg: 'white',
      },
      border: {
        fg: 'cyan',
      },
    },
  });

  // Description box
  const descBox = blessed.box({
    parent: state.screen,
    top: 10 + listItems.length + 2,
    left: 2,
    width: '100%-4',
    height: 4,
    content: '',
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: 'gray',
      },
    },
  });

  // Update description on selection change
  const updateDescription = (): void => {
    const selected = list.selected as number;
    const item = listItems[selected];
    if (item) {
      const mp = item.marketplace;
      descBox.setContent(
        `{bold}${mp.displayName}{/bold}\n` +
          `${mp.description}\n` +
          `{gray-fg}Source: github.com/${mp.source.repo}{/gray-fg}`
      );
      state.screen.render();
    }
  };

  list.on('select item', updateDescription);
  updateDescription();

  // Handle selection
  list.on('select', async (_item: unknown, index: number) => {
    const selected = listItems[index];
    if (!selected) return;

    if (selected.installed) {
      // Remove marketplace
      const remove = await showConfirm(
        state,
        `Remove ${selected.marketplace.displayName}?`,
        'This will remove the marketplace from your settings.\nPlugins from this marketplace will no longer be available.'
      );

      if (remove) {
        await removeMarketplace(selected.marketplace.name, state.projectPath);
        await showMessage(
          state,
          'Removed',
          `${selected.marketplace.displayName} has been removed.`,
          'success'
        );
        createMarketplaceScreen(state);
      }
    } else {
      // Add marketplace
      await addMarketplace(selected.marketplace, state.projectPath);
      await showMessage(
        state,
        'Added',
        `${selected.marketplace.displayName} has been added.\n\nYou can now install plugins from this marketplace.`,
        'success'
      );
      createMarketplaceScreen(state);
    }
  });

  // Quick add all - disabled during search
  state.screen.key(['a'], async () => {
    if (state.isSearching) return;
    const notInstalled = listItems.filter((item) => !item.installed);
    if (notInstalled.length === 0) {
      await showMessage(state, 'Info', 'All marketplaces are already added.', 'info');
      return;
    }

    const confirm = await showConfirm(
      state,
      'Add All Marketplaces?',
      `This will add ${notInstalled.length} marketplace(s) to your settings.`
    );

    if (confirm) {
      for (const item of notInstalled) {
        await addMarketplace(item.marketplace, state.projectPath);
      }
      await showMessage(
        state,
        'Added',
        `Added ${notInstalled.length} marketplace(s).`,
        'success'
      );
      createMarketplaceScreen(state);
    }
  });

  createFooter(
    state,
    '↑↓ Navigate | Enter Toggle | a Add All | Esc Back | ? Help'
  );

  list.focus();
  state.screen.render();
}
