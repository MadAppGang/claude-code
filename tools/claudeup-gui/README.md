# claudeup

Cross-platform desktop application for managing Claude Code plugins, MCP servers, and configuration.

## Stack

- **Framework**: Tauri 2.x
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: TanStack Query v5
- **Styling**: Tailwind CSS
- **Backend**: Rust + Node.js sidecar (stdio JSON-RPC)

## Architecture

See `ai-docs/sessions/dev-feature-claudeup-gui-20260113-100231-476d96a5/architecture-v2.md` for complete architecture documentation.

### Key Features

- **Stdio JSON-RPC**: Process-isolated communication (no ports, no auth needed)
- **Standalone Sidecar**: Compiled Node.js binary (no runtime dependency)
- **OS Keychain**: Secure secret storage
- **Auto-updater**: Built-in update system
- **System Tray**: Background operation support

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run tauri:dev

# Type check
npm run typecheck

# Build for production
npm run tauri:build
```

## Project Structure

```
claudeup-gui/
├── src/                    # React frontend
│   ├── lib/                # Utilities
│   │   └── queryClient.ts  # TanStack Query config
│   ├── main.tsx            # Entry point
│   ├── App.tsx             # Root component
│   └── index.css           # Global styles
├── src-tauri/              # Rust backend
│   ├── src/
│   │   └── main.rs         # Tauri app entry
│   ├── capabilities/       # Tauri 2.x permissions
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Tauri configuration
│   └── build.rs            # Build script
├── package.json            # Node dependencies
├── vite.config.ts          # Vite configuration
└── tsconfig.json           # TypeScript configuration
```

## Phase 0 Implementation

This is the initial scaffold following Phase 0 (Pre-Implementation) of the architecture:

- Basic Tauri 2.x project structure
- React frontend with TanStack Query
- Placeholder Rust command handlers
- Path alias support (`@/*`)
- TanStack Query with cache bounds (maxSize: 100)

## Next Steps

1. **Phase 1**: Extract `claudeup-core` shared package
2. **Phase 3**: Implement Node.js sidecar with stdio JSON-RPC
3. **Phase 4**: Implement Rust sidecar manager with lifecycle management
4. **Phase 5**: Create TanStack Query hooks for data operations
5. **Phase 6+**: Implement UI screens

## License

MIT
