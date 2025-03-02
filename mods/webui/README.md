# Fonoster WebUI

Fonoster WebUI is a modern and powerful user interface for the Fonoster platform, built with Next.js and Material UI. This application provides an intuitive user experience for managing Fonoster resources, with a robust authentication system and a scalable architecture.

## Main Features

- **Complete Authentication**: Support for credential and OAuth (GitHub) login
- **Session Management**: Automatic handling of JWT tokens with renewal
- **SDK Integration**: Direct connection with the Fonoster SDK
- **Modern Interface**: UI components based on Material UI
- **Responsive Experience**: Adaptive design for mobile and desktop devices
- **Storybook Development**: Documented component library

## Project Structure

```
fonoster-webui/
├── .storybook/         # Storybook configuration
├── public/             # Static files
├── src/
│   ├── common/         # Shared code
│   │   ├── components/ # Reusable components
│   │   ├── contexts/   # React contexts
│   │   ├── hooks/      # Custom hooks
│   │   ├── sdk/        # Fonoster SDK integration
│   │   └── utils/      # Utilities
│   ├── components/     # Application-specific components
│   ├── pages/          # Next.js pages
│   ├── stories/        # Storybook stories
│   └── types/          # Type definitions
├── theme/              # Theme configuration
└── ...
```

## GitHub OAuth Configuration

### GitHub Setup

To enable GitHub authentication, you must correctly configure your OAuth application in GitHub:

1. **Register an OAuth application in GitHub**:
   - Go to your GitHub account → Settings → Developer settings → OAuth Apps → New OAuth App
   - Fill in your application information:
     - **Application name**: Fonoster Cloud (or your preferred name)
     - **Homepage URL**: Your application URL (e.g., http://localhost:3000)
     - **Application description**: Optional description of your application
     - **Authorization callback URL**: Redirect URLs (IMPORTANT)

2. **Redirect URLs Configuration**:
   - In the "Authorization callback URL" field, you must add ALL redirect URLs that your application will use
   - For local development, you typically need:
     ```
     http://localhost:3000/signup,http://localhost:3000/signin
     ```
   - If you have more redirect URLs, add them separated by commas
   - **IMPORTANT**: URLs must match EXACTLY with those used in your code, including:
     - Protocol (http/https)
     - Exact domain (including subdomains)
     - Port (if applicable)
     - Complete path
     - No trailing slashes

3. **Get the credentials**:
   - After registering the application, GitHub will provide you with:
     - **Client ID**: Required for the `NEXT_PUBLIC_GITHUB_CLIENT_ID` variable
     - **Client Secret**: Store it securely (not used in the frontend)

### Environment Variables Configuration

Copy the `.env.example` file to `.env.local` and configure the following variables:

```bash
# Copy the example file
cp .env.example .env.local

# Edit variables according to your environment
```

#### GitHub OAuth Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | Client ID provided by GitHub | `abcd1234...` |
| `NEXT_PUBLIC_GITHUB_URL` | Base URL for GitHub authorization | `https://github.com/login/oauth/authorize` |
| `NEXT_PUBLIC_GITHUB_SIGNIN_REDIRECT_URI` | Redirect path for sign in | `/workspace` or full URL |
| `NEXT_PUBLIC_GITHUB_SIGNIN_SCOPE` | Permissions requested for sign in | `read:user` |
| `NEXT_PUBLIC_GITHUB_SIGNUP_REDIRECT_URI` | Redirect path for registration | `/workspace` or full URL |
| `NEXT_PUBLIC_GITHUB_SIGNUP_SCOPE` | Permissions requested for registration | `user:email` |

**IMPORTANT**: If you use relative paths (like `/workspace`), they will be combined with `NEXT_PUBLIC_FRONTEND_URL`. If you use absolute URLs, make sure they match exactly with those configured in GitHub.

### Configuration Verification

To verify that your GitHub OAuth configuration works correctly:

1. Make sure the URLs in GitHub and in your environment variables match exactly
2. Check the browser console when clicking "Sign in with GitHub" to see the generated URL
3. If you receive the error "The redirect_uri is not associated with this application", compare the generated URL with the one configured in GitHub

## Code Improvements

### 1. Authentication System

- **AuthClient**: Robust implementation following best practices
- **Token Management**: Automatic validation and renewal of JWT tokens
- **Cookie Handling**: Centralized system for cookie management

### 2. SDK Configuration

- **WebClient Interface**: Typed extension of the Fonoster SDK client
- **Client Initialization**: Optimized configuration
- **Error Handling**: Robust system for capturing and managing errors

### 3. Code Organization

- **Utility Modules**: Specific functions for tokens and cookies
- **Documentation**: JSDoc comments on all main methods
- **Naming Conventions**: Standardized nomenclature

### 4. Performance

- **Memoization**: Use of useCallback and useMemo for optimization
- **State Management**: Prevention of unnecessary re-renders
- **Session Verification**: Optimization of authentication checks

### 5. Type Safety

- **TypeScript**: Robust interfaces for type safety
- **Error Handling**: Type checking in errors
- **Null Safety**: Checks to prevent runtime errors

## Using the Authentication System

```tsx
import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient';

function MyComponent() {
  const { 
    client, 
    isReady, 
    isAuthenticated, 
    authentication 
  } = useFonosterClient();

  // Use the client and authentication methods
  // ...
}
```

## Best Practices

1. Always check `isReady` before using the client
2. Use `authentication.executeWithRefresh` for authenticated operations
3. Handle errors with try/catch blocks
4. Check `isAuthenticated` to determine if the user is logged in

## Next.js Basic Concepts

Next.js is a React framework that offers:

### File System Based Routing

- Each file in `pages/` automatically becomes a route
- Files like `pages/about.tsx` generate the `/about` route
- Nested folders like `pages/blog/[slug].tsx` generate dynamic routes

### Hybrid Rendering

- **Static Site Generation (SSG)**: Pages generated at build time
- **Server-Side Rendering (SSR)**: Rendering on each request
- **Client-Side Rendering**: Rendering in the browser
- **Incremental Static Regeneration**: Updating static pages

### Automatic Optimization

- **Images**: `Image` component for automatic optimization
- **Fonts**: Optimization and loading of web fonts
- **Scripts**: Optimized JavaScript loading

### API Routes

- Serverless API endpoints in `pages/api/`
- Ideal for creating APIs without needing a separate server

## Getting Started

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Configure environment variables:

```
# Copy the example file
cp .env.example .env.local

# Edit variables according to your environment
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development with Storybook

To develop and test components in isolation:

```bash
npm run storybook
# or
yarn storybook
```

Open [http://localhost:6006](http://localhost:6006) to see the component library.

## Deployment

### Deployment on Vercel

The easiest way to deploy this application is to use [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

1. Import your repository to Vercel
2. Configure environment variables
3. Deploy

### Manual Deployment

To build the application for production:

```bash
npm run build
# or
yarn build
```

Then, start the production server:

```bash
npm run start
# or
yarn start
```

## Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs) - Features and API
- [Next.js Tutorial](https://nextjs.org/learn-pages-router) - Interactive tutorial
- [Next.js Repository](https://github.com/vercel/next.js) - Source code and contributions

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
