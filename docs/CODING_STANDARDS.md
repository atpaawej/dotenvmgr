# Coding Standards

Evergreen engineering standards for **dotenvmgr**, governed by the deep-module principles in [`codebase-design`](/home/aawej/.gemini/config/skills/codebase-design/SKILL.md).

These standards govern architectural structure, interfaces, seam placement, and testing. They are invariant across library upgrades, framework versions, and syntax changes.

---

## 1. Deep Module Discipline

Every unit of code belongs to a **deep module**: significant behavior encapsulated behind a minimal, cohesive interface.

- **Small Interface, Deep Implementation**: The interface must require the caller to know as few concepts, methods, and parameters as possible. Complex logic (cryptography, parsing edge cases, caching, network retries) lives inside the implementation.
- **The Deletion Test**: Before creating or preserving a module, apply the deletion test:
  - If deleting the module causes its complexity to disperse across $N$ caller sites, it is **deep** and earns its place.
  - If deleting the module only removes boilerplate pass-through calls, it is **shallow** and must be merged into its caller or adjacent module.
- **High Locality**: Changes, bug fixes, invariant assertions, and security guarantees must concentrate in one place rather than spreading across call sites.
- **No Leaky Abstractions**: Never expose internal data structures, intermediate states, or engine-specific primitives across a module interface.

---

## 2. Seams and Adapters

A **seam** is a location where behavior can be altered without editing code at that location.

- **Two-Adapter Requirement**: A seam exists only when at least two concrete adapters are required (e.g., a production Cloudflare D1 adapter and an in-memory SQLite test adapter). Never create a seam with only one adapter; a single-adapter seam is needless indirection.
- **Internal vs. External Seams**: Modules may contain internal seams for modularity or sub-testing, but internal seams must never be exposed through the module's external interface.
- **Port Inversion**: When a module depends on external I/O (database, network, filesystem), the module defines the interface (the port) it requires; the transport or storage mechanism is injected as an adapter.

---

## 3. Interface Design & Data Flow

- **Accept Dependencies, Never Instantiate Them**:
  Functions and modules must accept required configurations, clocks, crypto keys, and storage adapters as explicit parameters. Never instantiate global singletons or reach into hidden ambient state.
- **Return Results, Avoid Ambient Side Effects**:
  Functions compute and return data. Avoid mutating input parameters or relying on invisible side effects.
- **Explicit Invariants and Failure Contracts**:
  - Differentiate expected non-presence (e.g., `null` for a missing entity) from invariant violations or operational errors (which throw domain-specific errors).
  - Every interface must document and enforce its preconditions before executing work.

---

## 4. Security & Cryptographic Invariants

- **Zero Plaintext at Rest**:
  Secret values must be encrypted before touching any storage adapter. Database layers must never receive or return raw plaintext credentials.
- **No Secret Leaks**:
  Environment values, master keys, and CLI authorization tokens must never appear in log statements, stack traces, URL query parameters, or serialized client responses.
- **Timing-Safe Evaluation**:
  All credential and token comparisons must use constant-time comparison routines to prevent timing attacks.

---

## 5. Testing Discipline: The Interface is the Test Surface

- **Test Through the Seam, Not Behind It**:
  Tests must cross the exact same interface that production callers use. Never write tests that reach into private module state, bypass interfaces, or mock internal helper functions.
- **Test Observable Outcomes**:
  Assert only on observable return values, persisted outcomes, and externally visible errors. If internal refactoring causes a test to break while observable behavior remains identical, the test was improperly coupled to the implementation.
- **Replace, Don't Layer**:
  When deepening or consolidating shallow modules, delete obsolete unit tests that tested the shallow interfaces. Write comprehensive tests against the new deep module interface.
- **Fast Local Stand-Ins**:
  Tests for modules requiring databases must run against in-memory or local substitutable adapters (e.g., local SQLite) rather than remote cloud resources.
