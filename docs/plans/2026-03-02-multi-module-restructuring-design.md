# Tacticl Multi-Module Restructuring Design

**Date**: 2026-03-02
**Goal**: Restructure tacticl-core from flat modules into nested parent directories matching Cidadel's Gradle pattern. Restructure tacticl-web into a Turbo monorepo matching strategiz-ui's pattern.

## Part 1: Backend (tacticl-core)

### Current State (Flat)

All 23 modules sit at the root level. Every module declares its own full dependency set independently, leading to significant duplication.

### Target State (Nested)

```
tacticl-core/
├── application/                          # Spring Boot entry point (stays at root)
├── service/                              # NEW parent directory
│   ├── build.gradle.kts                  # Shared service dependencies
│   ├── service-agent/
│   ├── service-spark/
│   ├── service-checkpoint/
│   ├── service-social/
│   ├── service-repo/
│   └── service-token/
├── business/                             # NEW parent directory
│   ├── build.gradle.kts                  # Shared business dependencies
│   ├── business-agent/
│   ├── business-browser/
│   └── business-social/
├── data/                                 # NEW parent directory
│   ├── build.gradle.kts                  # Shared data dependencies
│   ├── data-browser/
│   └── data-social/
├── client/                               # NEW parent directory
│   ├── build.gradle.kts                  # Shared client dependencies
│   ├── client-brave-search/
│   ├── client-gcs/
│   ├── client-github/
│   ├── client-google/
│   ├── client-instagram/
│   ├── client-jina/
│   ├── client-linkedin/
│   ├── client-siliconflow/
│   └── client-twitter/
├── cidadel-core/                         # Git submodule (stays at root)
├── deployment/
├── docs/
├── gradle/libs.versions.toml
├── build.gradle.kts                      # Root: group = "ai.tacticl"
└── settings.gradle.kts                   # Nested include syntax
```

### Changes Required

#### 1. Root build.gradle.kts

- Change `group` from `"io.strategiz.social"` to `"ai.tacticl"`
- Everything else stays the same

#### 2. settings.gradle.kts

```kotlin
rootProject.name = "tacticl-core"

include(
    // Application (assembler)
    "application",

    // Service layer (REST controllers)
    "service:service-agent",
    "service:service-spark",
    "service:service-checkpoint",
    "service:service-social",
    "service:service-repo",
    "service:service-token",

    // Business layer (domain logic)
    "business:business-agent",
    "business:business-browser",
    "business:business-social",

    // Data layer (entities + repositories)
    "data:data-browser",
    "data:data-social",

    // Client layer (external API clients)
    "client:client-brave-search",
    "client:client-gcs",
    "client:client-github",
    "client:client-google",
    "client:client-instagram",
    "client:client-jina",
    "client:client-linkedin",
    "client:client-siliconflow",
    "client:client-twitter",
)

// Version catalog auto-discovered from gradle/libs.versions.toml
```

#### 3. Parent build.gradle.kts Files

**service/build.gradle.kts** — shared deps for all service-* children:
```kotlin
// Intermediate parent for service-* modules
subprojects {
    dependencies {
        // Cidadel framework (shared across all services)
        add("implementation", rootProject.libs.cidadel.framework.authorization)
        add("implementation", rootProject.libs.cidadel.framework.exception)
        add("implementation", rootProject.libs.cidadel.framework.logging)

        // Spring Boot + API
        add("implementation", rootProject.libs.spring.boot.starter.web)
        add("implementation", rootProject.libs.spring.boot.starter.validation)
        add("implementation", rootProject.libs.springdoc.openapi)
        add("implementation", rootProject.libs.jackson.databind)

        // Test
        add("testImplementation", rootProject.libs.spring.boot.starter.test)
        add("testImplementation", rootProject.libs.junit.jupiter)
        add("testImplementation", rootProject.libs.mockito.core)
    }
}
```

**business/build.gradle.kts** — shared deps for all business-* children:
```kotlin
// Intermediate parent for business-* modules
subprojects {
    dependencies {
        add("implementation", rootProject.libs.cidadel.framework.exception)
        add("implementation", rootProject.libs.cidadel.framework.logging)
        add("implementation", rootProject.libs.spring.boot.starter.web)
        add("implementation", rootProject.libs.jackson.databind)

        add("testImplementation", rootProject.libs.spring.boot.starter.test)
        add("testImplementation", rootProject.libs.junit.jupiter)
        add("testImplementation", rootProject.libs.mockito.core)
        add("testImplementation", rootProject.libs.junit.platform.launcher)
    }
}
```

**data/build.gradle.kts** — shared deps for all data-* children:
```kotlin
// Intermediate parent for data-* modules
subprojects {
    dependencies {
        add("implementation", rootProject.libs.cidadel.framework.exception)
        add("implementation", rootProject.libs.cidadel.framework.logging)
        add("implementation", rootProject.libs.spring.boot.starter.web)
        add("implementation", rootProject.libs.google.cloud.firestore)
        add("implementation", rootProject.libs.jackson.databind)
        add("implementation", rootProject.libs.jackson.annotations)

        add("testImplementation", rootProject.libs.spring.boot.starter.test)
        add("testImplementation", rootProject.libs.junit.jupiter)
        add("testImplementation", rootProject.libs.mockito.core)
        add("testImplementation", rootProject.libs.junit.platform.launcher)
    }
}
```

**client/build.gradle.kts** — shared deps for all client-* children:
```kotlin
// Intermediate parent for client-* modules
subprojects {
    dependencies {
        add("implementation", rootProject.libs.cidadel.framework.exception)
        add("implementation", rootProject.libs.cidadel.framework.secrets)
        add("implementation", rootProject.libs.spring.boot.starter.web)
        add("implementation", rootProject.libs.jackson.databind)

        add("testImplementation", rootProject.libs.spring.boot.starter.test)
        add("testImplementation", rootProject.libs.junit.jupiter)
        add("testImplementation", rootProject.libs.mockito.core)
    }
}
```

#### 4. Module Reference Updates

Every `project(":module-name")` reference in build.gradle.kts files must update to `project(":layer:module-name")`:

| Old Reference | New Reference |
|---------------|---------------|
| `:service-social` | `:service:service-social` |
| `:service-agent` | `:service:service-agent` |
| `:service-spark` | `:service:service-spark` |
| `:service-checkpoint` | `:service:service-checkpoint` |
| `:service-repo` | `:service:service-repo` |
| `:service-token` | `:service:service-token` |
| `:business-agent` | `:business:business-agent` |
| `:business-browser` | `:business:business-browser` |
| `:business-social` | `:business:business-social` |
| `:data-social` | `:data:data-social` |
| `:data-browser` | `:data:data-browser` |
| `:client-twitter` | `:client:client-twitter` |
| `:client-linkedin` | `:client:client-linkedin` |
| `:client-instagram` | `:client:client-instagram` |
| `:client-google` | `:client:client-google` |
| `:client-github` | `:client:client-github` |
| `:client-siliconflow` | `:client:client-siliconflow` |
| `:client-brave-search` | `:client:client-brave-search` |
| `:client-jina` | `:client:client-jina` |
| `:client-gcs` | `:client:client-gcs` |

#### 5. Dependency Deduplication

After shared deps move to parent build files, child module build.gradle.kts files should be cleaned up to remove duplicated dependencies. Each child only declares dependencies specific to itself.

**Example — client-twitter/build.gradle.kts after cleanup:**
```kotlin
// Before: declared framework-exception, secrets, spring-web, httpclient, jackson, bucket4j, test deps
// After:  parent provides framework-exception, secrets, spring-web, jackson, test deps
dependencies {
    implementation(libs.cidadel.client.base)
    implementation(libs.httpclient)
    implementation(libs.bucket4j.core)
}
```

---

## Part 2: Frontend (tacticl-web → tacticl-ui)

### Current State

Single React SPA at `tacticl-web/` with flat `src/` structure.

### Target State

Turbo monorepo matching strategiz-ui's pattern:

```
tacticl-ui/
├── package.json                    # Root: npm workspaces + turbo
├── turbo.json                      # Task orchestration (dev, build, lint, test)
├── tsconfig.base.json              # Shared TypeScript config
├── apps/
│   └── web/                        # @tacticl/web — main dashboard SPA
│       ├── src/                    # All current src/ content (pages, components, hooks, api, stores)
│       ├── public/
│       ├── index.html
│       ├── package.json            # App-specific deps (react, mui, zustand, tanstack-query, react-router)
│       ├── vite.config.ts
│       └── tsconfig.json           # Extends ../../tsconfig.base.json
├── packages/
│   └── shared/                     # @tacticl/shared — extracted shared code
│       ├── src/
│       │   ├── theme/              # MUI dark theme (primary: #6C63FF, secondary: #03DAC6)
│       │   ├── types/              # Shared TypeScript interfaces
│       │   ├── components/         # TacticlLogo, common components
│       │   └── config/             # API base URLs, constants
│       ├── package.json
│       └── tsconfig.json
├── firebase.json
├── .firebaserc
└── .env files
```

### Key Decisions

- **Repo rename**: `tacticl-web` → `tacticl-ui` (matches strategiz-ui naming)
- **Initial extraction to shared**: theme, types (api/types.ts), logo component, config constants
- **Future apps**: auth, console can be added as `apps/auth/`, `apps/console/` when needed
- **Build commands**: `npm run dev:web`, `npm run build:web` via Turbo

---

## Migration Strategy

### Backend (tacticl-core)
1. Create parent directories (service/, business/, data/, client/)
2. Move module directories into their parent (`git mv`)
3. Create parent build.gradle.kts files with shared deps
4. Update settings.gradle.kts to nested syntax
5. Update all inter-module project() references
6. Update root build.gradle.kts group to `ai.tacticl`
7. Clean up duplicated deps in child modules
8. Verify `./gradlew build` passes

### Frontend (tacticl-web → tacticl-ui)
1. Initialize Turbo monorepo structure (root package.json, turbo.json)
2. Move current src/ into apps/web/
3. Extract shared code into packages/shared/
4. Update imports to use @tacticl/shared
5. Update Firebase config for new dist path
6. Verify `npm run dev` and `npm run build` work
7. Rename repo
