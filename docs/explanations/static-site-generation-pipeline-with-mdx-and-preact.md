# Static Site Generation Pipeline with MDX and Preact

## Overview
This pipeline compiles [MDX](https://mdxjs.com) files containing embedded [Preact](https://preactjs.com) components into static HTML pages during the build. The process integrates with the existing page manager, running the **MDX-Preact Compiler Plugin** in parallel with the Pug plugin. Front-matter metadata is parsed, validated, and injected into the MDX compilation context before processing. The pipeline enforces compatibility with the project’s minification workflow and fails the build if critical front-matter fields are missing or compilation outputs are invalid.

## Components and Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **MDX Files** | Source files (`.mdx`) containing content + Preact components, with YAML front-matter (e.g., `title`, `layout`). |
| **Front-Matter Metadata Processor** | Parses and validates front-matter. Fails the build if required fields are missing or invalid. |
| **MDX-Preact Compiler Plugin** | Compiles MDX + Preact into intermediate JS/HTML. Runs in parallel with the Pug plugin in the page manager. |
| **Page Manager** | Orchestrates parallel execution of plugins (MDX-Preact, Pug). |
| **JS Dependency Extractor** | (Separate epic) Validates that compiled outputs are compatible with the minification step. |
| **Minifier** | Processes intermediate outputs into final static assets. |

## Flow

```mermaid
%% Verify: Confirm plugin names and execution order match the actual implementation.
flowchart TD
    A[MDX File\n(viewsDir)] -->|1. Input| B[Front-Matter Metadata Processor]
    B -->|2. Parse/Validate| C{Valid Front-Matter?}
    C -->|No| D[Build Fails]
    C -->|Yes| E[Inject Metadata\ninto MDX Context]
    E -->|3. Compile| F[MDX-Preact Compiler Plugin]
    F -->|4. Parallel Execution| G[Page Manager]
    G --> H[Pug Plugin]
    F -->|5. Intermediate Output| I[JS Dependency Extractor]
    I -->|6. Validate| J{Compatible?}
    J -->|No| D
    J -->|Yes| K[Minification]
    K -->|7. Output| L[Static Site]
```

### Key Interactions
1. **Front-Matter Processing**
   - The **Front-Matter Metadata Processor** reads YAML front-matter from each `.mdx` file.
   - Required fields (e.g., `title`, `layout`) are validated. Missing/invalid fields halt the build.
   - Valid metadata is injected into the MDX compilation context for use in layouts/components.

2. **Compilation**
   - The **MDX-Preact Compiler Plugin** transforms MDX + Preact into intermediate JS/HTML.
   - Runs in parallel with the Pug plugin via the **Page Manager** (no blocking).

3. **Minification Compatibility**
   - The **JS Dependency Extractor** (separate epic) checks that compiled outputs (e.g., Preact component references) are compatible with the minifier.
   - Incompatible outputs fail the build.

4. **Output Integration**
   - Valid intermediate outputs are minified and integrated into the static site.

## Invariants
- **Front-Matter Requirements**: All MDX files must include valid front-matter with required fields (defined in the **Front-Matter Metadata Processor**).
- **Parallel Plugin Execution**: The MDX-Preact plugin and Pug plugin run concurrently without dependency.
- **Minification Safety**: Outputs must pass **JS Dependency Extractor** validation before minification.
- **Fail-Fast**: The build fails immediately on:
  - Front-matter validation errors.
  - Compilation errors (e.g., syntax, missing Preact dependencies).
  - Minification compatibility issues.

## Configuration
- **Shared Config**: The **Bootstrap MDX-Preact Pipeline Configuration** defines:
  - Required front-matter fields.
  - MDX-Preact plugin settings (e.g., Preact runtime, MDX options).
  - Parallel execution rules in the page manager.
- **Verify**: Confirm the actual config file location and field requirements in the project.

## Dependencies
- **Runtime**: Preact (version pinned in the project’s manifest).
- **Compiler**: MDX (version pinned in the project’s manifest).
- **Front-Matter**: YAML parser (e.g., `js-yaml`; verify in `package.json`).

## Notes
- **Preact vs. React**: The pipeline assumes Preact compatibility. If React-specific features are used, the build may fail during compilation or minification.
- **Error Messages**: Ensure front-matter validation and compilation errors provide actionable feedback (e.g., missing field names, line numbers).
