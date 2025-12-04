import blessed from 'neo-blessed';
import type { AppState } from '../app.js';
import { createHeader, createFooter, showMessage, showInput } from '../app.js';
import { statusLineCategories } from '../../data/statuslines.js';
import type { StatusLineConfig } from '../../types/index.js';
import {
  setStatusLine,
  getStatusLine,
  setGlobalStatusLine,
  getGlobalStatusLine,
  getEffectiveStatusLine,
} from '../../services/claude-settings.js';

type Scope = 'project' | 'global';

export async function createStatusLineScreen(state: AppState, initialScope: Scope = 'project'): Promise<void> {
  createHeader(state, 'Status Line Configuration');

  let currentScope: Scope = initialScope;

  const projectStatusLine = await getStatusLine(state.projectPath);
  const globalStatusLine = await getGlobalStatusLine();
  const effective = await getEffectiveStatusLine(state.projectPath);

  const getCurrentStatusLine = (): string | undefined => {
    return currentScope === 'project' ? projectStatusLine : globalStatusLine;
  };

  // Scope indicator
  const scopeBox = blessed.box({
    parent: state.screen,
    top: 3,
    left: 2,
    width: '100%-4',
    height: 3,
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

  const updateScopeBox = (): void => {
    const projectLabel = currentScope === 'project'
      ? '{bold}{cyan-fg}[P] 📁 Project{/cyan-fg}{/bold}'
      : '{gray-fg}[P] 📁 Project{/gray-fg}';
    const globalLabel = currentScope === 'global'
      ? '{bold}{cyan-fg}[G] 🌍 Global{/cyan-fg}{/bold}'
      : '{gray-fg}[G] 🌍 Global{/gray-fg}';

    const projectStatus = projectStatusLine ? '{green-fg}✓{/green-fg}' : '{gray-fg}○{/gray-fg}';
    const globalStatus = globalStatusLine ? '{green-fg}✓{/green-fg}' : '{gray-fg}○{/gray-fg}';

    scopeBox.setContent(
      `  ${projectLabel} ${projectStatus}     ${globalLabel} ${globalStatus}     ` +
      `{gray-fg}│{/gray-fg} Active: {yellow-fg}${effective.source}{/yellow-fg}`
    );
  };

  updateScopeBox();

  // Info box
  blessed.box({
    parent: state.screen,
    top: 6,
    left: 2,
    width: '100%-4',
    height: 2,
    content: `{gray-fg}Current ${currentScope}: {/gray-fg}{bold}${getCurrentStatusLine() || '(not set)'}{/bold}`,
    tags: true,
  });

  // Build list items with category headers
  type ListItem = { label: string; preset?: StatusLineConfig; isCustom?: boolean; isHeader?: boolean };

  const buildListItems = (): ListItem[] => {
    const currentForScope = getCurrentStatusLine();
    const items: ListItem[] = [];

    for (const category of statusLineCategories) {
      // Add category header
      items.push({
        label: `{${category.color}-fg}{bold}${category.name}{/bold}{/${category.color}-fg}`,
        isHeader: true,
      });

      // Add presets in this category
      for (const preset of category.presets) {
        const isActive = currentForScope === preset.template;
        const status = isActive ? '{green-fg}✓{/green-fg}' : ' ';
        items.push({
          label: `  ${status} ${preset.name} {gray-fg}- ${preset.description}{/gray-fg}`,
          preset,
        });
      }
    }

    // Add custom option at the end
    items.push({
      label: '{cyan-fg}{bold}+ Custom Status Line{/bold}{/cyan-fg}',
      isCustom: true,
    });

    return items;
  };

  const listItems = buildListItems();

  const list = blessed.list({
    parent: state.screen,
    top: 9,
    left: 2,
    width: '100%-4',
    height: '50%-6',
    items: listItems.map((item) => item.label),
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    scrollable: true,
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
    scrollbar: {
      ch: '|',
      style: {
        bg: 'gray',
      },
    },
    label: ' 🎨 Themes ',
  });

  // Preview box - positioned at the bottom
  const previewBox = blessed.box({
    parent: state.screen,
    top: '50%+4',
    left: 2,
    width: '100%-4',
    height: '50%-6',
    content: '',
    tags: true,
    border: {
      type: 'line',
    },
    label: ' Preview ',
    style: {
      border: {
        fg: 'gray',
      },
    },
  });

  // Update preview on selection change
  const updatePreview = (): void => {
    const selected = list.selected as number;
    const item = listItems[selected];

    if (item?.isHeader) {
      previewBox.setContent('{gray-fg}Select a preset below{/gray-fg}');
      state.screen.render();
      return;
    }

    if (item?.preset) {
      // Build colorful preview with highlighted values
      const example = item.preset.template
        .replace('{model}', '{green-fg}claude-sonnet-4{/green-fg}')
        .replace('{model_short}', '{green-fg}sonnet{/green-fg}')
        .replace('{cost}', '{yellow-fg}0.42{/yellow-fg}')
        .replace('{cwd}', '{blue-fg}~/myapp{/blue-fg}')
        .replace('{git_branch}', '{magenta-fg}main{/magenta-fg}')
        .replace('{input_tokens}', '{cyan-fg}1.2k{/cyan-fg}')
        .replace('{output_tokens}', '{cyan-fg}850{/cyan-fg}')
        .replace('{session_duration}', '{red-fg}12m{/red-fg}');

      const content =
        `{bold}{cyan-fg}${item.preset.name}{/cyan-fg}{/bold}\n` +
        `{gray-fg}${item.preset.description}{/gray-fg}\n\n` +
        `{yellow-fg}{bold}Preview:{/bold}{/yellow-fg}\n` +
        `{white-fg}${example}{/white-fg}\n\n` +
        `{gray-fg}Template: ${item.preset.template}{/gray-fg}`;

      previewBox.setContent(content);
    } else if (item?.isCustom) {
      previewBox.setContent(
        `{bold}{cyan-fg}+ Custom Status Line{/cyan-fg}{/bold}\n\n` +
        `{white-fg}Create your own unique status line!{/white-fg}\n\n` +
        `{yellow-fg}{bold}Available variables:{/bold}{/yellow-fg}\n\n` +
        `{green-fg}{model}{/green-fg}            Model name\n` +
        `{green-fg}{model_short}{/green-fg}      Short name\n` +
        `{yellow-fg}{cost}{/yellow-fg}             Session cost\n` +
        `{blue-fg}{cwd}{/blue-fg}              Working directory\n` +
        `{magenta-fg}{git_branch}{/magenta-fg}       Git branch\n` +
        `{cyan-fg}{input_tokens}{/cyan-fg}     Input tokens\n` +
        `{cyan-fg}{output_tokens}{/cyan-fg}    Output tokens\n` +
        `{red-fg}{session_duration}{/red-fg}  Session duration`
      );
    }
    state.screen.render();
  };

  list.on('select item', updatePreview);
  updatePreview();

  // Save function based on current scope
  const saveStatusLine = async (template: string): Promise<void> => {
    if (currentScope === 'global') {
      await setGlobalStatusLine(template);
    } else {
      await setStatusLine(template, state.projectPath);
    }
  };

  // Handle selection
  list.on('select', async (_item: unknown, index: number) => {
    const selected = listItems[index];
    if (!selected || selected.isHeader) return;

    const scopeLabel = currentScope === 'global' ? '🌍 Global' : '📁 Project';

    if (selected.isCustom) {
      // Custom status line
      const template = await showInput(
        state,
        `Custom Status Line (${scopeLabel})`,
        'Enter template (use {model}, {cost}, etc.):',
        getCurrentStatusLine() || ''
      );

      if (template !== null) {
        await saveStatusLine(template);
        await showMessage(
          state,
          'Saved',
          `Custom status line saved to ${scopeLabel}.\n\nRestart Claude Code to apply changes.`,
          'success'
        );
        createStatusLineScreen(state, currentScope);
      }
    } else if (selected.preset) {
      // Apply preset
      await saveStatusLine(selected.preset.template);
      await showMessage(
        state,
        'Applied',
        `"${selected.preset.name}" applied to ${scopeLabel}.\n\nRestart Claude Code to apply changes.`,
        'success'
      );
      createStatusLineScreen(state, currentScope);
    }
  });

  // Toggle scope with P and G keys - disabled during search
  state.screen.key(['p'], () => {
    if (state.isSearching) return;
    if (currentScope !== 'project') {
      createStatusLineScreen(state, 'project');
    }
  });

  state.screen.key(['g'], () => {
    if (state.isSearching) return;
    if (currentScope !== 'global') {
      createStatusLineScreen(state, 'global');
    }
  });

  // Reset to default - disabled during search
  state.screen.key(['r'], async () => {
    if (state.isSearching) return;
    const scopeLabel = currentScope === 'global' ? '🌍 Global' : '📁 Project';
    await saveStatusLine('');
    await showMessage(
      state,
      'Reset',
      `${scopeLabel} status line has been cleared.`,
      'success'
    );
    createStatusLineScreen(state, currentScope);
  });

  createFooter(
    state,
    '↑↓ Navigate │ Enter Apply │ P Project │ G Global │ r Reset │ Esc Back'
  );

  list.focus();
  state.screen.render();
}
