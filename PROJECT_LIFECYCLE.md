# Terminal Portfolio - Project Lifecycle Management

## Version Timeline & Strategy

```
V1.0 (Current - Published)
├── Status: Production
├── URL: terminal.zuabi.dev
├── Maintenance: Bug fixes only
└── Sunset: 6 months after V2 launch

V2.0 (Q1 2025)
├── Status: Development starting
├── URL: v2.terminal.zuabi.dev → terminal.zuabi.dev
├── Focus: Real functionality + AI
└── Sunset: 1 year after V3 launch

V3.0 (Q3-Q4 2025)
├── Status: Planning
├── URL: v3.terminal.zuabi.dev → terminal.zuabi.dev
├── Focus: WebAssembly + Hardware
└── Long-term support
```

## Repository Structure

```
OnePromptPortfolio/
├── .github/
│   └── workflows/
│       ├── v1-maintenance.yml
│       ├── v2-ci.yml
│       └── v3-ci.yml
├── v1/
│   ├── terminal-portfolio.html (current production)
│   ├── test-terminal.html
│   └── e2e-tests.html
├── v2/
│   ├── src/
│   │   ├── core/
│   │   ├── ai/
│   │   ├── filesystem/
│   │   └── commands/
│   ├── tests/
│   ├── package.json
│   └── vite.config.ts
├── v3/
│   ├── src/
│   ├── wasm/
│   └── package.json
├── shared/
│   ├── assets/
│   ├── content/
│   └── analytics/
├── docs/
│   ├── V1_DOCS.md
│   ├── V2_ROADMAP.md
│   ├── V3_ROADMAP.md
│   └── PROJECT_LIFECYCLE.md
└── deployments/
    ├── nginx/
    ├── docker/
    └── k8s/
```

## Branching Strategy

### Main Branches
- `main` - V1 production (protected)
- `v2-main` - V2 stable
- `v3-main` - V3 stable
- `staging` - Pre-production testing

### Development Branches
- `v2-dev` - V2 active development
- `v3-dev` - V3 active development
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

### Branch Protection Rules
```yaml
main:
  - Require PR reviews: 1
  - Dismiss stale reviews: true
  - Require status checks: true
  - No force push: true
  - No deletion: true

v2-main, v3-main:
  - Same as main

staging:
  - Require status checks: true
  - Auto-merge from dev branches
```

## Deployment Strategy

### Environments

| Environment | URL | Branch | Purpose |
|------------|-----|---------|---------|
| V1 Prod | terminal.zuabi.dev | main | Current production |
| V1 Legacy | v1.terminal.zuabi.dev | main | Permanent archive |
| V2 Staging | v2-staging.zuabi.dev | v2-dev | V2 testing |
| V2 Prod | terminal.zuabi.dev | v2-main | Future production |
| V3 Beta | v3-beta.zuabi.dev | v3-dev | V3 preview |

### CI/CD Pipeline

```yaml
Pipeline Stages:
1. Code Quality
   - Linting (ESLint, Prettier)
   - Type checking (TypeScript)
   - Security scan

2. Build
   - Development build
   - Production build
   - WASM compilation (V3)

3. Test
   - Unit tests
   - Integration tests
   - E2E tests
   - Performance tests

4. Deploy
   - Deploy to staging
   - Smoke tests
   - Manual approval
   - Deploy to production
   - Post-deployment tests
```

## Version Migration Strategy

### V1 → V2 Migration

```typescript
// migration/v1-to-v2.ts
export class V1toV2Migration {
  static async migrate() {
    const steps = [
      this.backupV1Data,
      this.parseV1Session,
      this.convertToV2Format,
      this.validateMigration,
      this.saveV2Data
    ];

    for (const step of steps) {
      await step();
    }
  }

  static async backupV1Data() {
    const v1Data = {
      history: localStorage.getItem('terminal-history'),
      settings: localStorage.getItem('terminal-settings'),
      session: sessionStorage.getItem('terminal-session')
    };
    localStorage.setItem('v1-backup', JSON.stringify(v1Data));
  }
}
```

### Data Compatibility

```typescript
// Compatibility interface
interface VersionCompatibility {
  command: {
    v1: string;
    v2: string;
    v3?: string;
  };

  storage: {
    v1: 'localStorage';
    v2: 'IndexedDB';
    v3: 'IndexedDB + OPFS';
  };

  features: {
    v1: string[];
    v2: string[];
    v3: string[];
  };
}
```

## Feature Flags Management

```typescript
// config/features.ts
export const Features = {
  flags: {
    // V2 Features
    AI_COMMANDS: process.env.ENABLE_AI ?? false,
    REAL_FILE_SYSTEM: process.env.ENABLE_FS ?? false,
    GITHUB_INTEGRATION: process.env.ENABLE_GITHUB ?? false,
    SNAKE_GAME: true,

    // V3 Features
    WEBASSEMBLY: false,
    HARDWARE_USB: false,
    WEBGPU: false,
  },

  rollout: {
    AI_COMMANDS: 0.5,      // 50% rollout
    REAL_FILE_SYSTEM: 1.0,  // 100% rollout
    GITHUB_INTEGRATION: 0.1 // 10% rollout
  },

  isEnabled(feature: string): boolean {
    if (!this.flags[feature]) return false;

    const rollout = this.rollout[feature] ?? 1.0;
    const userId = this.getUserId();
    const hash = this.hashUserId(userId);

    return hash < rollout;
  }
};
```

## Version Routing

```typescript
// router/version-router.ts
export class VersionRouter {
  private static readonly VERSION_MAP = {
    'v1': '/v1/terminal-portfolio.html',
    'v2': '/v2/index.html',
    'v3': '/v3/index.html',
    'latest': '/index.html'
  };

  static route(): void {
    const requestedVersion = this.getRequestedVersion();
    const supportedVersion = this.checkBrowserSupport(requestedVersion);

    if (requestedVersion !== supportedVersion) {
      this.showCompatibilityWarning(requestedVersion, supportedVersion);
    }

    window.location.href = this.VERSION_MAP[supportedVersion];
  }

  private static getRequestedVersion(): string {
    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('version')) {
      return urlParams.get('version');
    }

    // Check user preference
    const saved = localStorage.getItem('preferred-version');
    if (saved) return saved;

    // Default to latest
    return 'latest';
  }

  private static checkBrowserSupport(version: string): string {
    if (version === 'v3') {
      // Check for WebAssembly support
      if (!window.WebAssembly) {
        return 'v2'; // Fallback to V2
      }

      // Check for WebGPU support
      if (!navigator.gpu) {
        console.warn('WebGPU not supported, some V3 features disabled');
      }
    }

    if (version === 'v2') {
      // Check for modern JS features
      try {
        eval('(async () => {})()');
      } catch {
        return 'v1'; // Fallback to V1
      }
    }

    return version;
  }
}
```

## Testing Strategy

### Test Coverage by Version

| Version | Unit | Integration | E2E | Performance |
|---------|------|-------------|-----|-------------|
| V1 | - | - | ✓ (smoke) | - |
| V2 | 80% | 70% | ✓ | ✓ |
| V3 | 90% | 80% | ✓ | ✓ |

### Test Automation

```json
// package.json test scripts
{
  "scripts": {
    "test:v1": "npm run test:v1:e2e",
    "test:v1:e2e": "playwright test v1/",

    "test:v2": "npm run test:v2:unit && npm run test:v2:e2e",
    "test:v2:unit": "jest src/",
    "test:v2:e2e": "playwright test v2/",
    "test:v2:perf": "lighthouse http://localhost:3002",

    "test:v3": "npm run test:v3:all",
    "test:v3:wasm": "cargo test",
    "test:v3:unit": "jest v3/src/",
    "test:v3:e2e": "playwright test v3/"
  }
}
```

## Monitoring & Analytics

### Version Usage Tracking

```typescript
// analytics/version-analytics.ts
export class VersionAnalytics {
  static track(event: 'load' | 'error' | 'migration' | 'command') {
    const data = {
      version: this.getCurrentVersion(),
      event,
      timestamp: Date.now(),
      browser: navigator.userAgent,
      features: this.getEnabledFeatures()
    };

    // Send to analytics service
    if (window.gtag) {
      gtag('event', event, {
        event_category: 'version',
        event_label: data.version,
        value: 1
      });
    }
  }

  static trackMigration(from: string, to: string, success: boolean) {
    this.track('migration');
    console.log(`Migration ${from} → ${to}: ${success ? 'success' : 'failed'}`);
  }
}
```

## Rollback Strategy

### Automatic Rollback Triggers
1. Error rate > 5% in first hour
2. Performance degradation > 20%
3. Critical feature failure
4. User reports spike

### Rollback Procedure
```bash
#!/bin/bash
# rollback.sh

VERSION=$1
PREVIOUS_VERSION=$2

echo "Rolling back from $VERSION to $PREVIOUS_VERSION"

# 1. Switch nginx config
sudo ln -sf /etc/nginx/sites-available/$PREVIOUS_VERSION /etc/nginx/sites-enabled/terminal
sudo nginx -s reload

# 2. Update DNS if needed
# ...

# 3. Notify monitoring
curl -X POST $MONITORING_WEBHOOK -d "Rollback executed: $VERSION → $PREVIOUS_VERSION"

# 4. Create incident report
echo "Rollback completed at $(date)" >> /var/log/rollbacks.log
```

## Documentation Requirements

### Per Version Documentation
- User Guide
- Developer Setup
- API Reference
- Migration Guide
- Changelog
- Known Issues

### Documentation Automation
```yaml
# .github/workflows/docs.yml
name: Generate Documentation
on:
  push:
    branches: [main, v2-main, v3-main]
    paths: ['**.md', 'src/**']

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate API Docs
        run: npm run docs:api
      - name: Generate User Guide
        run: npm run docs:user
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
```

## Success Metrics

### KPIs by Version

| Metric | V1 Target | V2 Target | V3 Target |
|--------|-----------|-----------|-----------|
| Load Time | < 3s | < 3s | < 5s |
| Error Rate | < 1% | < 0.5% | < 0.5% |
| User Engagement | 2 min | 3 min | 5 min |
| Return Rate | 20% | 25% | 30% |
| Feature Adoption | N/A | 50% | 60% |

## Timeline

### 2025 Q1 (Jan-Mar): V2 Development
- Week 1-2: Setup and migration tools
- Week 3-8: Core features development
- Week 9-10: Testing and optimization
- Week 11-12: Staged rollout

### 2025 Q2 (Apr-Jun): V2 Polish & V3 Start
- Month 1: V2 stabilization
- Month 2-3: V3 WASM development start

### 2025 Q3-Q4 (Jul-Dec): V3 Development
- Q3: Core V3 features
- Q4: Testing and launch

## Risk Management

### Identified Risks
1. **Breaking changes**: Mitigated by version preservation
2. **User confusion**: Clear version selector UI
3. **Performance issues**: Gradual feature rollout
4. **Browser incompatibility**: Automatic fallbacks
5. **Data loss**: Comprehensive backup system

## Maintenance Windows

- **V1**: Sundays 2-4 AM PST (minimal updates)
- **V2**: Tuesdays 2-4 AM PST (regular updates)
- **V3**: Thursdays 2-4 AM PST (feature updates)

---

This lifecycle management ensures smooth transitions between versions while maintaining service availability and user experience throughout the evolution from V1 to V3.