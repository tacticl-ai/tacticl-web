# Tacticl-Core Nested Multi-Module Restructuring

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure tacticl-core from flat modules into nested parent directories matching Cidadel's Gradle pattern.

**Architecture:** Move 20 flat modules into 4 parent directories (service/, business/, data/, client/), add parent build.gradle.kts files with shared dependencies, update all inter-module references to use `:layer:module` syntax, and deduplicate dependency declarations.

**Tech Stack:** Gradle 8.12, Kotlin DSL (build.gradle.kts), Spring Boot 3.5.7, Java 21

**Working directory:** `/Users/cuztomizer/Documents/GitHub/tacticl-core`

---

### Task 1: Create parent directories and move service modules

**Files:**
- Create: `service/` directory
- Move: `service-agent/`, `service-spark/`, `service-checkpoint/`, `service-social/`, `service-repo/`, `service-token/` into `service/`

**Step 1: Create the service parent directory and move all service modules**

```bash
cd /Users/cuztomizer/Documents/GitHub/tacticl-core
mkdir -p service
git mv service-agent service/
git mv service-spark service/
git mv service-checkpoint service/
git mv service-social service/
git mv service-repo service/
git mv service-token service/
```

**Step 2: Verify the moves**

```bash
ls service/
```

Expected: `service-agent  service-checkpoint  service-repo  service-social  service-spark  service-token`

---

### Task 2: Move business modules into parent directory

**Files:**
- Create: `business/` directory
- Move: `business-agent/`, `business-browser/`, `business-social/` into `business/`

**Step 1: Create the business parent directory and move all business modules**

```bash
cd /Users/cuztomizer/Documents/GitHub/tacticl-core
mkdir -p business
git mv business-agent business/
git mv business-browser business/
git mv business-social business/
```

**Step 2: Verify the moves**

```bash
ls business/
```

Expected: `business-agent  business-browser  business-social`

---

### Task 3: Move data modules into parent directory

**Files:**
- Create: `data/` directory
- Move: `data-social/`, `data-browser/` into `data/`

**Step 1: Create the data parent directory and move all data modules**

```bash
cd /Users/cuztomizer/Documents/GitHub/tacticl-core
mkdir -p data
git mv data-social data/
git mv data-browser data/
```

**Step 2: Verify the moves**

```bash
ls data/
```

Expected: `data-browser  data-social`

---

### Task 4: Move client modules into parent directory

**Files:**
- Create: `client/` directory
- Move: all 9 `client-*` directories into `client/`

**Step 1: Create the client parent directory and move all client modules**

```bash
cd /Users/cuztomizer/Documents/GitHub/tacticl-core
mkdir -p client
git mv client-brave-search client/
git mv client-gcs client/
git mv client-github client/
git mv client-google client/
git mv client-instagram client/
git mv client-jina client/
git mv client-linkedin client/
git mv client-siliconflow client/
git mv client-twitter client/
```

**Step 2: Verify the moves**

```bash
ls client/
```

Expected: `client-brave-search  client-gcs  client-github  client-google  client-instagram  client-jina  client-linkedin  client-siliconflow  client-twitter`

---

### Task 5: Update root build.gradle.kts and settings.gradle.kts

**Files:**
- Modify: `build.gradle.kts` (change group)
- Modify: `settings.gradle.kts` (nested include syntax)

**Step 1: Update root build.gradle.kts**

Change line 7 from:
```kotlin
group = "io.strategiz.social"
```
to:
```kotlin
group = "ai.tacticl"
```

**Step 2: Replace settings.gradle.kts with nested include syntax**

Write the complete new file:

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

---

### Task 6: Create client parent build.gradle.kts

**Files:**
- Create: `client/build.gradle.kts`

**Step 1: Write the client parent build file**

This provides shared dependencies for all client-* children, matching Cidadel's `client/build.gradle.kts` pattern.

```kotlin
// Intermediate parent for client-* modules
subprojects {
    dependencies {
        // Cidadel shared infrastructure
        add("implementation", rootProject.libs.cidadel.framework.exception)
        add("implementation", rootProject.libs.cidadel.framework.secrets)
        add("implementation", rootProject.libs.cidadel.client.base)
        add("implementation", rootProject.libs.spring.boot.starter.web)
        add("implementation", rootProject.libs.jackson.databind)

        // Testing
        add("testImplementation", rootProject.libs.spring.boot.starter.test)
        add("testImplementation", rootProject.libs.junit.jupiter)
        add("testImplementation", rootProject.libs.mockito.core)
    }
}
```

---

### Task 7: Create data parent build.gradle.kts

**Files:**
- Create: `data/build.gradle.kts`

**Step 1: Write the data parent build file**

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
        add("testRuntimeOnly", rootProject.libs.junit.platform.launcher)
    }
}
```

---

### Task 8: Create business parent build.gradle.kts

**Files:**
- Create: `business/build.gradle.kts`

**Step 1: Write the business parent build file**

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
        add("testRuntimeOnly", rootProject.libs.junit.platform.launcher)
    }
}
```

---

### Task 9: Create service parent build.gradle.kts

**Files:**
- Create: `service/build.gradle.kts`

**Step 1: Write the service parent build file**

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

        // Testing
        add("testImplementation", rootProject.libs.spring.boot.starter.test)
        add("testImplementation", rootProject.libs.junit.jupiter)
        add("testImplementation", rootProject.libs.mockito.core)
    }
}
```

---

### Task 10: Update all client module build.gradle.kts files

**Files:**
- Modify: `client/client-twitter/build.gradle.kts`
- Modify: `client/client-linkedin/build.gradle.kts`
- Modify: `client/client-instagram/build.gradle.kts`
- Modify: `client/client-google/build.gradle.kts`
- Modify: `client/client-github/build.gradle.kts`
- Modify: `client/client-siliconflow/build.gradle.kts`
- Modify: `client/client-brave-search/build.gradle.kts`
- Modify: `client/client-jina/build.gradle.kts`
- Modify: `client/client-gcs/build.gradle.kts`

**Step 1: Update each client module**

Remove dependencies now provided by parent (framework-exception, framework-secrets, client.base, spring-web, jackson-databind, test deps). Keep only module-specific deps.

**client-twitter/build.gradle.kts** (same pattern for linkedin, instagram, siliconflow, brave-search, jina):
```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // HTTP & rate limiting (module-specific)
    implementation(libs.httpclient)
    implementation(libs.bucket4j.core)
}
```

**client-google/build.gradle.kts:**
```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Rate limiting (module-specific)
    implementation(libs.bucket4j.core)
}
```

**client-github/build.gradle.kts:**
```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

// All dependencies provided by parent
```

**client-gcs/build.gradle.kts:**
```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

// All dependencies provided by parent
```

---

### Task 11: Update all data module build.gradle.kts files

**Files:**
- Modify: `data/data-social/build.gradle.kts`
- Modify: `data/data-browser/build.gradle.kts`

**Step 1: Update data-social**

All deps now provided by parent. File becomes minimal:

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

// All dependencies provided by parent
```

**Step 2: Update data-browser**

Only module-specific dep is the cross-module reference to data-social:

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Internal — need base repository class
    implementation(project(":data:data-social"))
}
```

---

### Task 12: Update all business module build.gradle.kts files

**Files:**
- Modify: `business/business-agent/build.gradle.kts`
- Modify: `business/business-browser/build.gradle.kts`
- Modify: `business/business-social/build.gradle.kts`

**Step 1: Update business-agent/build.gradle.kts**

Remove parent-provided deps (framework-exception, framework-logging, spring-web, jackson-databind, test deps). Update project references to nested syntax. Keep module-specific deps:

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Internal modules
    implementation(project(":data:data-social"))
    implementation(project(":data:data-browser"))
    implementation(project(":business:business-social"))
    implementation(project(":client:client-siliconflow"))
    implementation(project(":client:client-brave-search"))
    implementation(project(":client:client-jina"))
    implementation(project(":client:client-google"))

    // Cidadel shared infrastructure (module-specific, beyond parent)
    implementation(libs.cidadel.service.framework.base)
    implementation(libs.cidadel.framework.secrets)
    implementation(libs.cidadel.framework.token.issuance)
    implementation(libs.cidadel.client.base)
    implementation(libs.cidadel.framework.llm.router)

    // Cidadel LLM clients
    implementation(libs.cidadel.client.anthropic.direct)
    implementation(libs.cidadel.client.openai.direct)
    implementation(libs.cidadel.client.grok.direct)

    // Google Cloud Firestore (for UserDataPurgeService batch operations)
    implementation(libs.google.cloud.firestore)
}
```

**Step 2: Update business-browser/build.gradle.kts**

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Internal modules
    implementation(project(":data:data-browser"))
    implementation(project(":data:data-social"))
    implementation(project(":business:business-agent"))
    implementation(project(":client:client-gcs"))

    // Cidadel shared infrastructure (module-specific, beyond parent)
    implementation(libs.cidadel.framework.secrets)
    implementation(libs.cidadel.client.base)
    implementation(libs.cidadel.framework.llm.router)

    // Google Cloud Firestore
    implementation(libs.google.cloud.firestore)

    // Playwright (browser automation)
    implementation(libs.playwright)
}
```

**Step 3: Update business-social/build.gradle.kts**

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Internal modules
    implementation(project(":data:data-social"))
    implementation(project(":client:client-twitter"))
    implementation(project(":client:client-linkedin"))
    implementation(project(":client:client-instagram"))
    implementation(project(":client:client-google"))
    implementation(project(":client:client-github"))

    // Cidadel shared infrastructure (module-specific, beyond parent)
    implementation(libs.cidadel.client.base)
    implementation(libs.cidadel.framework.secrets)
    implementation(libs.cidadel.framework.resilience)
}
```

---

### Task 13: Update all service module build.gradle.kts files

**Files:**
- Modify: `service/service-agent/build.gradle.kts`
- Modify: `service/service-spark/build.gradle.kts`
- Modify: `service/service-social/build.gradle.kts`
- Modify: `service/service-checkpoint/build.gradle.kts`
- Modify: `service/service-repo/build.gradle.kts`
- Modify: `service/service-token/build.gradle.kts`

**Step 1: Update service-agent/build.gradle.kts**

Remove parent-provided deps (framework-authorization, framework-exception, framework-logging, spring-web, spring-validation, springdoc, jackson, test deps). Update project references. Keep module-specific deps:

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Internal modules
    implementation(project(":business:business-agent"))
    implementation(project(":business:business-social"))
    implementation(project(":data:data-social"))

    // Cidadel shared infrastructure (module-specific, beyond parent)
    implementation(libs.cidadel.service.framework.base)
    implementation(libs.cidadel.framework.token.issuance)
    implementation(libs.cidadel.framework.api.docs)
    implementation(libs.cidadel.framework.llm.router)
    implementation(libs.cidadel.client.base)

    // WebSocket (module-specific)
    implementation(libs.spring.boot.starter.websocket)
}
```

**Step 2: Update service-spark/build.gradle.kts**

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Internal modules
    implementation(project(":business:business-agent"))
    implementation(project(":data:data-social"))
}
```

**Step 3: Update service-social/build.gradle.kts**

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Internal modules
    implementation(project(":business:business-social"))
    implementation(project(":data:data-social"))

    // Cidadel (module-specific, beyond parent)
    implementation(libs.cidadel.framework.api.docs)
}
```

**Step 4: Update service-checkpoint/build.gradle.kts**

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Internal modules
    implementation(project(":business:business-agent"))
    implementation(project(":data:data-social"))
}
```

**Step 5: Update service-repo/build.gradle.kts**

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Internal modules
    implementation(project(":data:data-social"))
}
```

**Step 6: Update service-token/build.gradle.kts**

```kotlin
plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Internal modules
    implementation(project(":data:data-social"))
}
```

---

### Task 14: Update application/build.gradle.kts

**Files:**
- Modify: `application/build.gradle.kts`

**Step 1: Update all project references to nested syntax and fix mainClass package**

```kotlin
plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Service layer
    implementation(project(":service:service-social"))
    implementation(project(":service:service-agent"))
    implementation(project(":service:service-spark"))
    implementation(project(":service:service-checkpoint"))
    implementation(project(":service:service-repo"))
    implementation(project(":service:service-token"))

    // Business layer
    implementation(project(":business:business-social"))
    implementation(project(":business:business-agent"))
    implementation(project(":business:business-browser"))

    // Data layer
    implementation(project(":data:data-social"))
    implementation(project(":data:data-browser"))

    // Client layer
    implementation(project(":client:client-twitter"))
    implementation(project(":client:client-linkedin"))
    implementation(project(":client:client-instagram"))
    implementation(project(":client:client-google"))
    implementation(project(":client:client-github"))
    implementation(project(":client:client-siliconflow"))
    implementation(project(":client:client-brave-search"))
    implementation(project(":client:client-jina"))
    implementation(project(":client:client-gcs"))

    // Cidadel shared infrastructure
    implementation(libs.cidadel.framework.authorization)
    implementation(libs.cidadel.framework.token.issuance)
    implementation(libs.cidadel.framework.exception)
    implementation(libs.cidadel.framework.logging)
    implementation(libs.cidadel.framework.secrets)
    implementation(libs.cidadel.framework.resilience)
    implementation(libs.cidadel.framework.api.docs)
    implementation(libs.cidadel.framework.llm.router)

    // Cidadel LLM clients
    implementation(libs.cidadel.client.anthropic.direct)
    implementation(libs.cidadel.client.openai.direct)
    implementation(libs.cidadel.client.grok.direct)

    // Cidadel auth (all /v1/auth/* endpoints)
    implementation(libs.cidadel.service.auth)
    implementation(libs.cidadel.service.framework.base)
    implementation(libs.cidadel.business.auth)
    implementation(libs.cidadel.data.auth)
    implementation(libs.cidadel.data.user)
    implementation(libs.cidadel.data.session)
    implementation(libs.cidadel.data.product)
    implementation(libs.cidadel.data.framework.base)
    implementation(libs.cidadel.client.google)
    implementation(libs.cidadel.client.facebook)
    implementation(libs.cidadel.client.sms)

    // Spring Boot
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.security)
    implementation(libs.spring.boot.starter.websocket)

    // Testing
    testImplementation(libs.spring.boot.starter.test)
}

springBoot {
    mainClass = "ai.tacticl.application.TacticlApplication"
}
```

**NOTE:** The `mainClass` should be updated from `io.strategiz.social.application.TacticlApplication` to `ai.tacticl.application.TacticlApplication` ONLY if you also rename the Java package. If you want to keep the Java packages as-is for now, leave the mainClass unchanged. This plan only restructures modules — it does NOT rename Java packages.

If keeping existing Java packages, use:
```kotlin
springBoot {
    mainClass = "io.strategiz.social.application.TacticlApplication"
}
```

---

### Task 15: Verify build compiles

**Step 1: Run Gradle build**

```bash
cd /Users/cuztomizer/Documents/GitHub/tacticl-core
./gradlew clean build --no-daemon
```

Expected: `BUILD SUCCESSFUL`

If it fails, check:
1. Missing dependency — a child module may need a dep that was incorrectly removed. Add it back.
2. Wrong project reference — search for old `:module-name` syntax that wasn't updated.
3. Verify no stale `.gradle` cache: `rm -rf .gradle/` and retry.

**Step 2: Verify the project structure is recognized**

```bash
./gradlew projects
```

Expected output should show nested hierarchy:
```
Root project 'tacticl-core'
+--- Project ':application'
+--- Project ':business'
|    +--- Project ':business:business-agent'
|    +--- Project ':business:business-browser'
|    \--- Project ':business:business-social'
+--- Project ':client'
|    +--- Project ':client:client-brave-search'
|    +--- Project ':client:client-gcs'
|    +--- Project ':client:client-github'
|    +--- Project ':client:client-google'
|    +--- Project ':client:client-instagram'
|    +--- Project ':client:client-jina'
|    +--- Project ':client:client-linkedin'
|    +--- Project ':client:client-siliconflow'
|    \--- Project ':client:client-twitter'
+--- Project ':data'
|    +--- Project ':data:data-browser'
|    \--- Project ':data:data-social'
\--- Project ':service'
     +--- Project ':service:service-agent'
     +--- Project ':service:service-checkpoint'
     +--- Project ':service:service-repo'
     +--- Project ':service:service-social'
     +--- Project ':service:service-spark'
     \--- Project ':service:service-token'
```

---

### Task 16: Update CLAUDE.md if it exists

**Files:**
- Modify: `CLAUDE.md` (if present in tacticl-core)

**Step 1: Update the project structure section**

Update any file paths or module references in CLAUDE.md to reflect the new nested structure. Key changes:
- All module paths now use `layer/module-name` format
- settings.gradle.kts uses `"layer:module-name"` include syntax
- Each layer has a parent build.gradle.kts

---

### Task 17: Commit the restructuring

**Step 1: Stage all changes**

```bash
cd /Users/cuztomizer/Documents/GitHub/tacticl-core
git add -A
```

**Step 2: Verify the staged changes look correct**

```bash
git status
git diff --cached --stat
```

Expected: Renamed files (service-agent/ → service/service-agent/, etc.), modified build files, new parent build files.

**Step 3: Commit**

```bash
git commit -m "refactor: nest modules into parent directories matching Cidadel pattern

- Move service-* modules under service/ parent directory
- Move business-* modules under business/ parent directory
- Move data-* modules under data/ parent directory
- Move client-* modules under client/ parent directory
- Add parent build.gradle.kts with shared deps per layer
- Update settings.gradle.kts to nested include syntax
- Update all inter-module project() references
- Deduplicate dependencies (parent provides common deps)
- Fix root group from io.strategiz.social to ai.tacticl

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
