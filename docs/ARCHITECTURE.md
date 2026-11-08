# dotenvmgr Architecture

This document defines the architectural design of **dotenvmgr** using the deep-module design philosophy outlined in [`codebase-design`](/home/aawej/.gemini/config/skills/codebase-design/SKILL.md).

---

## 1. Core Vocabulary & Design Principles

To ensure consistent mental models across maintainers and autonomous agents, we adhere strictly to the following vocabulary:

- **Module**: Anything with an interface and an implementation (scale-agnostic: function, class, package, or tier-spanning slice).
- **Interface**: Everything a caller must know to use the module correctly (type signatures, invariants, ordering constraints, error modes, configuration, and performance characteristics).
- **Implementation**: The hidden code inside a module that performs the work.
- **Depth**: Leverage at the interface. The amount of capability and behavior a caller or test can exercise per unit of interface they have to learn. Deep modules maximize leverage; shallow pass-through modules are eliminated.
- **Seam**: A place where behavior can be altered without editing the code at that place; the exact location where a module's interface lives.
- **Adapter**: A concrete realization that satisfies an interface at a seam (e.g., Cloudflare D1 adapter vs in-memory SQLite test adapter).
- **Leverage**: The return on investment for callers—one interface pays back across many call sites and tests.
- **Locality**: Change, bugs, security guarantees, and verification concentrate in one place rather than dispersing across callers.

### Core Architectural Rules

1. **Two-Adapter Seam Discipline**: We do not introduce a seam unless at least two concrete adapters exist (specifically: production adapter + local/test adapter). A single-adapter seam is rejected as needless indirection.
2. **Interface as Test Surface**: Tests cross the exact same seams that callers cross. Tests assert on observable outcomes through the interface, not internal implementation details or private state.
3. **The Deletion Test**: If deleting a module would cause its complexity to disperse across $N$ callers, the module is deep and earns its keep. If deleting it removes only boilerplate pass-through calls, it is shallow and should be eliminated.
4. **Accept Dependencies & Return Values**: Modules accept dependencies (or config) at initialization rather than constructing them internally, and return pure results rather than causing hidden side-effects.

---

## 2. System Architecture & Seam Placement

The system is organized into **five deep modules** spanning the web application, storage, cryptography, and developer CLI:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              dotenvmgr CLI                             │
│                         (Module 4: CliClient)                          │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │  [Remote Seam: HTTP / REST]
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge Service                         │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │   Module 3: AuthEngine    │      │    Module 5: DashboardUI    │   │
│   │   (Better Auth + Secrets) │      │     (Fluid State Machine)   │   │
│   └─────────────┬─────────────┘      └──────────────┬──────────────┘   │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                   Module 1: CryptoVault                        │   │
│   │              (AES-256-GCM + Dotenv Grammar)                    │   │
│   └─────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                      │
│                                 ▼                                      │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    Module 2: DataStorage                       │   │
│   │            (Projects, Environments, Secret Store)              │   │
│   └─────────────────────────────┬──────────────────────────────────┘   │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │  [Storage Seam]
                                  ▼
                     ┌───────────────────────────┐
                     │ Cloudflare D1 / In-Memory │
                     └───────────────────────────┘
```

---

## 3. Deep Modules Specification

### Module 1: `CryptoVault` (In-process Deep Module)

- **Role**: Cryptographic engine and POSIX `.env` grammar processor.
- **Interface**:
  ```typescript
  export interface EncryptedPayload {
    ciphertext: string; // base64
    iv: string;         // base64 (96-bit)
    tag: string;        // base64 (128-bit authentication tag)
  }

  export interface CryptoVault {
    encrypt(plaintext: string): Promise<EncryptedPayload>;
    decrypt(payload: EncryptedPayload): Promise<string>;
    parseDotenv(content: string): Record<string, string>;
    formatDotenv(entries: Record<string, string>): string;
    validateKeyName(key: string): boolean;
  }
  ```
- **Depth & Implementation**:
  - Implements authenticated symmetric encryption using **AES-256-GCM** via the Web Crypto API (`crypto.subtle`), compatible with both Cloudflare Workers runtime and Node.js.
  - Generates cryptographically secure 96-bit random initialization vectors (IVs) for every encryption operation; computes 128-bit authentication tags.
  - Implements key derivation using HKDF from `ENCRYPTION_MASTER_KEY`.
  - Implements a resilient POSIX environment parser handling single/double-quote unwrapping, multiline values, escaped newlines, inline comments (`#`), and export prefixes (`export KEY=val`).
  - Implements canonical formatting with automatic escaping of values containing special characters or newlines.
- **Leverage & Locality**:
  - Callers and routes never touch raw cipher modes, byte arrays, IV allocations, or regular expressions for dotenv files.
  - Security guarantees (integrity verification, tamper detection) are fully localized inside this single module.
- **Seam**: In-process. No adapter needed; tested directly through its interface.

---

### Module 2: `DataStorage` (Local-Substitutable Deep Module)

- **Role**: Relational persistence and transactional integrity for projects, environments, encrypted secrets, and CLI authentication tokens.
- **Interface**:
  ```typescript
  export interface Project {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export type EnvironmentMode = 'production' | 'dev' | 'test';

  export interface StoredSecret {
    id: string;
    key: string;
    ciphertext: string;
    iv: string;
    tag: string;
    updatedAt: Date;
  }

  export interface DataStorage {
    // Projects
    createProject(data: { name: string; slug: string; description?: string }): Promise<Project>;
    getProjectBySlug(slug: string): Promise<Project | null>;
    listProjects(): Promise<Project[]>;
    deleteProject(id: string): Promise<void>;

    // Secrets & Environments
    getSecrets(projectId: string, env: EnvironmentMode): Promise<StoredSecret[]>;
    setSecret(projectId: string, env: EnvironmentMode, key: string, payload: EncryptedPayload): Promise<void>;
    bulkSetSecrets(projectId: string, env: EnvironmentMode, items: Array<{ key: string } & EncryptedPayload>): Promise<void>;
    deleteSecret(projectId: string, env: EnvironmentMode, key: string): Promise<void>;

    // CLI Tokens
    createCliToken(data: { tokenHash: string; name: string; expiresAt: Date }): Promise<{ id: string }>;
    validateCliToken(tokenHash: string): Promise<boolean>;
    revokeCliToken(id: string): Promise<void>;
  }
  ```
- **Depth & Implementation**:
  - Coordinates database transactions across projects, predefined environments (`production`, `dev`, `test`), and secret rows.
  - Automatically provisions the required environments upon project creation.
  - Handles optimistic locking, upsert logic for secrets, and cascade deletion.
- **Seam & Adapters (Two-Adapter Real Seam)**:
  1. **`CloudflareD1StorageAdapter`** (Production): Connects to Cloudflare D1 SQLite database via Drizzle ORM edge driver.
  2. **`MemorySqliteStorageAdapter`** (Test / Local): In-memory SQLite instance matching the D1 schema without network latency or external Cloudflare dependencies.
- **Leverage & Locality**:
  - The rest of the application is completely agnostic to whether D1 or SQLite is running. Schema migrations and relational constraints remain in one spot.

---

### Module 3: `AuthEngine` (Deep Module)

- **Role**: Single-tenant administration access control, session life-cycles, and interactive CLI token grants.
- **Interface**:
  ```typescript
  export interface AuthSession {
    token: string;
    username: string;
    expiresAt: Date;
  }

  export interface CliGrant {
    grantCode: string;
    redirectUri: string;
    expiresAt: Date;
  }

  export interface AuthEngine {
    verifyAdminCredentials(credentials: { username: string; password: string }): Promise<boolean>;
    createSession(username: string): Promise<AuthSession>;
    validateSession(token: string): Promise<boolean>;
    createCliGrant(redirectUri: string): Promise<CliGrant>;
    exchangeCliGrant(code: string): Promise<{ accessToken: string; expiresAt: Date }>;
    validateCliToken(bearerToken: string): Promise<boolean>;
  }
  ```
- **Depth & Implementation**:
  - Integrates with Better Auth configured for single-admin static credential validation derived from instance environment variables (`ADMIN_USERNAME` and `ADMIN_PASSWORD`).
  - Generates tamper-proof session tokens using cryptographically secure random bytes.
  - Manages short-lived (60-second) one-time grant codes for CLI browser handshakes.
  - Generates high-entropy personal access tokens for the CLI (`dtm_live_...`), storing only their SHA-256 hash in `DataStorage`.
- **Leverage & Locality**:
  - Authentication rules, token entropy requirements, and timing-safe comparisons are sealed inside. Routes merely query `validateSession` or `validateCliToken`.

---

### Module 4: `CliClient` (Remote-Owned Deep Module)

- **Role**: Command-line developer experience orchestrating local filesystem synchronization, browser authorization, and runtime environment injection.
- **Interface**:
  ```typescript
  export interface CliConfig {
    instanceUrl: string;
    token: string | null;
    defaultProject?: string;
  }

  export interface CliClient {
    login(instanceUrl: string): Promise<void>;
    logout(): Promise<void>;
    pull(options: { project: string; env: EnvironmentMode; file: string }): Promise<{ count: number }>;
    push(options: { project: string; env: EnvironmentMode; file: string; dryRun?: boolean }): Promise<{ updated: number; created: number }>;
    run(options: { project: string; env: EnvironmentMode; command: string; args: string[] }): Promise<number>;
    status(): Promise<{ loggedIn: boolean; instanceUrl?: string; user?: string }>;
  }
  ```
- **Depth & Implementation**:
  - **Interactive OAuth Handshake**: Spawns an ephemeral local HTTP server on a loopback port (e.g. `http://localhost:3456/callback`), launches the system browser to the remote instance authorization URL, receives the grant code, exchanges it for a token, and shuts down the local server cleanly.
  - **Filesystem Synchronization**: Reads and parses local `.env` files, detects diffs against remote secrets, prompts for confirmation when destructive overwrites occur, and writes atomic updates with safe file permissions (`0600`).
  - **In-Memory Injection (`run`)**: Fetches remote secrets, decrypts them via the remote API, and spawns the target command with the environment variables merged into `process.env`. Zero secret data is written to disk during `run`.
- **Seam & Adapters**:
  - Production adapter talks over HTTPS to the remote Cloudflare Worker instance.
  - Test adapter tests command handlers against a local mock HTTP server.

---

### Module 5: `DashboardUI` (Deep Interaction Layer)

- **Role**: Minimal, fluid, animated user interface for secret management.
- **Interface**:
  - Page routes: `/login`, `/dashboard`, `/projects/[slug]`.
  - State machine interface:
    - Active environment toggle: `'production' | 'dev' | 'test'`.
    - Secret table state: inline editing, reveal/mask toggle, search filter, selection.
    - Bulk modal state: raw `.env` parser with syntax validation before commit.
- **Depth & Implementation**:
  - Built with **shadcn/ui** and Framer Motion / Spring physics.
  - Features fluid layout shifts when switching environments: tab indicators glide seamlessly with physics-based springs.
  - Secret value masking: values are hidden by default with visual asterisks; reveal actions animate cleanly with tactile copy buttons.
  - Bulk import drawer: parses pasted `.env` strings in real time using `CryptoVault.parseDotenv`, surfacing duplicates and syntax warnings before executing `DataStorage.bulkSetSecrets`.
- **Leverage & Locality**:
  - All visual animation timings, theme tokens (monochrome dark mode), and secret masking behaviors are unified.

---

## 4. Seams and Testability Matrix

| Module | Seam Location | Adapters | Testing Strategy |
|---|---|---|---|
| **`CryptoVault`** | In-Process Seam | Pure TypeScript implementation (no external I/O) | Unit tests verifying cipher roundtrips, invalid key handling, and edge cases in dotenv grammar parsing. |
| **`DataStorage`** | Storage Adapter Seam | 1. `CloudflareD1StorageAdapter`<br>2. `MemorySqliteStorageAdapter` | Integration tests run against the in-memory SQLite adapter across all CRUD operations, cascade deletes, and transactions. |
| **`AuthEngine`** | Application Service Seam | Integrated Better Auth service | Test admin login with valid/invalid credentials, grant generation, exchange flow, and token validation. |
| **`CliClient`** | Network / Process Seam | 1. HTTP Fetch Adapter<br>2. Local Mock HTTP Adapter | Subprocess / CLI integration tests exercising `login`, `pull`, `push`, and `run` against a running test server. |
| **`DashboardUI`** | HTTP/Route Seam | Next.js Server & Client components | Component interaction and visual regression tests checking environment toggles and secret visibility. |

---

## 5. Repository Topology & Monorepo Layout

```text
dotenvmgr/
├── apps/
│   └── web/                         # Full-Stack Cloudflare Application
│       ├── app/                     # Next.js App Router (Dashboard & API)
│       │   ├── api/                 # Seams for Auth, Secrets, and CLI Handshake
│       │   ├── dashboard/           # Fluid Project & Secret Management Views
│       │   └── login/               # Minimal Admin Login
│       ├── components/              # shadcn/ui components & fluid animated editors
│       ├── db/                      # Drizzle D1 schema, migrations, and adapters
│       └── wrangler.jsonc           # Cloudflare D1 bindings & Worker settings
├── packages/
│   ├── core/                        # Shared Deep Modules
│   │   ├── src/
│   │   │   ├── crypto/              # Module 1: CryptoVault (AES-256-GCM + Dotenv)
│   │   │   ├── storage/             # Module 2: Storage Interfaces & Types
│   │   │   └── auth/                # Shared token validation helpers
│   │   └── package.json
│   └── cli/                         # Standalone Developer Binary
│       ├── src/
│       │   ├── commands/            # login, pull, push, run, link
│       │   ├── client/              # Module 4: CliClient implementation
│       │   └── index.ts             # Executable entry point (`dotenvmgr`)
│       └── package.json
├── docs/
│   ├── ARCHITECTURE.md              # This architecture document
│   └── agents/                      # Agent protocols and triage guidelines
├── package.json                     # Workspace configuration (pnpm / bun)
└── README.md
```
