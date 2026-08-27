# `@repo/eslint-config`

Collection of internal ESLint configurations for the FinanceLens monorepo.

Available entry points:

- `@repo/eslint-config/base` — base flat config
- `@repo/eslint-config/next-js` — Next.js apps
- `@repo/eslint-config/react-internal` — React packages

Usage in an app's `eslint.config.js`:

```js
import { nextJsConfig } from "@repo/eslint-config/next-js";

export default nextJsConfig;
```
