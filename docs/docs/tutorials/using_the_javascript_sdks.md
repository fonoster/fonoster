# Using the Javascript SDKs

Fonoster libraries are available for NodeJS via the `@fonoster/sdk` package or the Browser via `@fonoster/websdk`. 

## NodeJS

Via NPM

```bash
npm install @fonoster/sdk
```

Find the source code on [GitHub](https://github.com/fonoster/fonoster).

## Browser

Via NPM

```bash
npm install @fonoster/websdk
```

If you're using a bundler (like Browserify or webpack), you can import the WebSDK module with:

```Typescript
import Fonoster from "@fonoster/websdk";
```

Or via CDN

```html
<script src="https://unpkg.com/@fonoster/websdk@0.2.13/dist/websdk.js"></script>
// This will populate the object `Fonoster`
```