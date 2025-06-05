/*
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  index,
  layout,
  prefix,
  route,
  type RouteConfig
} from "@react-router/dev/routes";

/**
 * Defines the route configuration for the application.
 * Utilizes `prefix` to group related routes under a common path segment,
 * `layout` to specify layout components for nested routes,
 * and `route` to define individual route components.
 */
export default [
  /**
   * Authentication Routes
   *
   * Groups all authentication-related routes under the "/auth" path.
   * These routes share a common layout for consistent styling and structure.
   *
   * Example URLs:
   * - /auth/login
   * - /auth/signup
   * - /auth/forgot-password
   * - /auth/reset-password
   */
  ...prefix("auth", [
    /**
     * Logout Route
     *
     * Renders the logout page at "/auth/logout".
     */
    route("logout", "auth/pages/logout/logout.page.tsx"),

    /**
     * Authentication Layout
     *
     * Applies a layout component to all child authentication routes.
     * This layout typically includes elements like headers, footers, or sidebars
     * specific to the authentication pages.
     */
    layout("auth/components/layouts/authentication-flow.layout.tsx", [
      /**
       * Login Route
       *
       * Renders the login page at "/auth/login".
       */
      route("login", "auth/pages/login/login.page.tsx"),

      /**
       * Signup Route
       *
       * Renders the signup page at "/auth/signup".
       */
      route("signup", "auth/pages/sign-up/sign-up.page.tsx"),

      /**
       * Forgot Password Route
       *
       * Renders the forgot password page at "/auth/forgot-password".
       */
      route(
        "forgot-password",
        "auth/pages/forgot-password/forgot-password.page.tsx"
      ),

      /**
       * Reset Password Route
       *
       * Renders the reset password page at "/auth/reset-password".
       */
      route(
        "reset-password",
        "auth/pages/reset-password/reset-password.page.tsx"
      )
    ])
  ]),

  /**
   * Main Application Routes
   *
   * Applies a global authenticated layout to all main application routes.
   * This layout ensures that only authenticated users can access these routes
   * and provides a consistent structure across the application.
   */
  layout("core/components/layouts/authenticated.layout.tsx", [
    /**
     * Workspaces Index Route
     *
     * Renders the main workspaces page at the root path "/".
     */
    index("workspaces/pages/workspaces/workspaces.page.tsx"),

    /**
     * Account Management Routes
     *
     * Groups account-related routes under the "/accounts" path.
     *
     * Example URLs:
     * - /accounts/profile
     * - /accounts/verify
     */
    ...prefix("accounts", [
      /**
       * Profile Route
       *
       * Renders the user profile page at "/accounts/profile".
       */
      route("profile", "auth/pages/profile/profile.page.tsx"),

      /**
       * Verification Route
       *
       * Renders the account verification page at "/accounts/verify".
       */
      route("verify", "auth/pages/verification-flow/verification-flow.page.tsx")
    ]),

    /**
     * Application Shell Layout
     *
     * Applies a layout component to the main sections of the application,
     * such as workspaces, applications, SIP network, storage, secrets, API keys, and monitoring.
     * This layout typically includes navigation menus and other shared UI elements.
     */
    layout("core/components/layouts/app-shell.layout.tsx", [
      /**
       * Workspaces Routes
       *
       * Placeholder for additional workspace-related routes under "/workspaces".
       */
      ...prefix("workspaces/:workspaceId", [
        /**
         * Workspaces Index Route
         *
         * Renders the workspaces index page at "/workspaces/:workspaceId".
         */
        index("workspaces/pages/[workspace]/overview/overview.page.tsx"),

        /**
         * Workspaces Members Route
         *
         * Renders the members page at "/workspaces/:workspaceId/members".
         */
        route(
          "members",
          "workspaces/pages/[workspace]/members/members.page.tsx"
        ),

        /**
         * Workspaces Settings Route
         *
         * Renders the settings page at "/workspaces/:workspaceId/settings".
         */
        route(
          "settings",
          "workspaces/pages/[workspace]/settings/settings.page.tsx"
        ),

        /**
         * Applications Routes
         *
         * Placeholder for application-related routes under "/applications".
         */
        ...prefix("applications", [
          /**
           * Applications Index Route
           *
           * Renders the applications index page at "/applications".
           */
          index("applications/pages/apps/apps.page.tsx"),

          /**
           * Applications Create Route
           *
           * Renders the create application page at "/applications/create".
           * This route is used to create new applications.
           */
          route(
            "create",
            "applications/pages/create-application/create-application.page.tsx"
          ),

          /**
           * Applications Edit Route
           *
           * Renders the edit application page at "/applications/:ref/edit".
           * This route is used to edit existing applications.
           */
          route(
            "/:ref/edit",
            "applications/pages/edit-application/edit-application.page.tsx"
          )
        ]),

        /**
         * SIP Network Routes
         *
         * Groups SIP network-related routes under the "/sip-network" path.
         *
         * Example URLs:
         * - /sip-network/trunks
         * - /sip-network/numbers
         * - /sip-network/domains
         * - /sip-network/agents
         * - /sip-network/acls
         * - /sip-network/credentials
         */
        ...prefix("sip-network", [
          /**
           * Trunks Routes
           *
           * Placeholder for trunk-related routes under "/sip-network/trunks".
           */
          ...prefix("trunks", []),

          /**
           * Numbers Routes
           *
           * Placeholder for number-related routes under "/sip-network/numbers".
           */
          ...prefix("numbers", [
            /**
             * Numbers Index Route
             *
             * Renders the numbers index page at "/sip-network/numbers".
             * This route is used to manage phone numbers.
             */
            index("numbers/pages/numbers/numbers.page.tsx"),

            /**
             * Create Number Route
             *
             * Renders the create number page at "/sip-network/numbers/create".
             * This route is used to create new phone numbers.
             */
            route(
              "create",
              "numbers/pages/create-number/create-number.page.tsx"
            ),

            /**
             * Edit Number Route
             *
             * Renders the edit number page at "/sip-network/numbers/:ref/edit".
             * This route is used to edit existing phone numbers.
             */
            route(
              "/:ref/edit",
              "numbers/pages/edit-number/edit-number.page.tsx"
            )
          ]),

          /**
           * Domains Routes
           *
           * Placeholder for domain-related routes under "/sip-network/domains".
           */
          ...prefix("domains", []),

          /**
           * Agents Routes
           *
           * Placeholder for agent-related routes under "/sip-network/agents".
           */
          ...prefix("agents", []),

          /**
           * ACLs Routes
           *
           * Placeholder for access control list-related routes under "/sip-network/acls".
           */
          ...prefix("acls", []),

          /**
           * Credentials Routes
           *
           * Placeholder for credential-related routes under "/sip-network/credentials".
           */
          ...prefix("credentials", [
            /**
             * Credentials Index Route
             *
             * Renders the credentials index page at "/sip-network/credentials".
             * This route is used to manage credentials.
             */
            index("credentials/pages/credentials/credentials.page.tsx"),

            /**
             * Create Credential Route
             *
             * Renders the create credential page at "/sip-network/credentials/create".
             * This route is used to create new credentials.
             */
            route(
              "create",
              "credentials/pages/create-credential/create-credential.page.tsx"
            ),

            /**
             * Edit Credential Route
             *
             * Renders the edit credential page at "/sip-network/credentials/:ref/edit".
             * This route is used to edit existing credentials.
             */
            route(
              "/:ref/edit",
              "credentials/pages/edit-credential/edit-credential.page.tsx"
            )
          ])
        ]),

        /**
         * Storage Routes
         *
         * Placeholder for storage-related routes under "/storage".
         */
        ...prefix("storage", []),

        /**
         * Secrets Routes
         *
         * Placeholder for secret management routes under "/secrets".
         */
        ...prefix("secrets", [
          /**
           * Secrets Index Route
           *
           * Renders the secrets index page at "/secrets".
           * This route is used to manage secrets.
           */
          index("secrets/pages/secrets/secrets.page.tsx"),

          /**
           * Create Secret Route
           *
           * Renders the create secret page at "/secrets/create".
           * This route is used to create new secrets.
           */
          route("create", "secrets/pages/create-secret/create-secret.page.tsx"),

          /**
           * Edit Secret Route
           *
           * Renders the edit secret page at "/secrets/:ref/edit".
           * This route is used to edit existing secrets.
           */
          route("/:ref/edit", "secrets/pages/edit-secret/edit-secret.page.tsx")
        ]),

        /**
         * API Keys Routes
         *
         * Placeholder for API key management routes under "/api-keys".
         */
        ...prefix("api-keys", [
          /**
           * API Keys Index Route
           *
           * Renders the API keys index page at "/api-keys".
           * This route is used to manage API keys.
           */
          index("api-keys/pages/api-keys/api-keys.page.tsx"),

          /**
           * Create API Key Route
           *
           * Renders the create API key page at "/api-keys/create".
           * This route is used to create new API keys.
           */
          route(
            "create",
            "api-keys/pages/create-api-key/create-api-key.page.tsx"
          )
        ]),

        /**
         * Monitoring Routes
         *
         * Placeholder for monitoring-related routes under "/monitoring".
         */
        ...prefix("monitoring", [
          /**
           * Monitoring Index Route
           *
           * Renders the monitoring index page at "/monitoring".
           * This route is used to view monitoring data.
           */
          index("monitoring/pages/calls/calls.page.tsx")
        ])
      ])
    ])
  ])
] satisfies RouteConfig;
