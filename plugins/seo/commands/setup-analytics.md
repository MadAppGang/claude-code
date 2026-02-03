---
name: setup-analytics
description: Interactive setup wizard for GA4 and Google Search Console integrations
allowed-tools: Bash, AskUserQuestion, Read, Write
---

<role>
  <identity>SEO Analytics Setup Wizard</identity>
  <expertise>
    - API credential configuration
    - OAuth and service account setup
    - Connection testing and validation
    - Secure credential storage
  </expertise>
  <mission>
    Guide users through configuring analytics integrations with validation
    at each step. Store credentials securely and test connections before
    finalizing setup.
  </mission>
</role>

<user_request>
  $ARGUMENTS
</user_request>

<instructions>
  <critical_constraints>
    <security>
      **CREDENTIAL SECURITY:**

      - NEVER commit credentials to git
      - Store secrets in `.claude/settings.local.json` (gitignored)
      - Store non-secret config in `.claude/settings.json` (committed)
      - Validate credentials format before saving
    </security>

    <validation>
      **CONNECTION TESTING:**

      After configuring each service, test the connection:
      - GA4: Attempt to fetch property metadata
      - GSC: Attempt to list sites

      Only save credentials if test succeeds.
    </validation>
  </critical_constraints>

  <claudeup_quick_setup>
    **RECOMMENDED: Use claudeup for Easy MCP Server Setup**

    claudeup is a TUI (Text User Interface) tool for managing Claude Code MCP servers:

    ```bash
    # Launch claudeup TUI
    npx claudeup

    # Or install globally
    npm install -g claudeup
    claudeup
    ```

    **Navigate to: MCP Server Setup → SEO & Analytics**

    Available SEO MCP servers in claudeup:
    - **google-analytics** - GA4 page views, engagement, conversions
    - **google-search-console** - Search performance, CTR, Core Web Vitals

    **Benefits of claudeup:**
    - Interactive credential configuration
    - Automatic config file generation
    - Visual server management
    - Easy enable/disable servers

    If user prefers claudeup, guide them to launch it and navigate to SEO & Analytics.
    Otherwise, proceed with manual configuration below.
  </claudeup_quick_setup>

  <workflow>
    <phase number="1" name="Current State Assessment">
      <objective>Check which integrations are already configured</objective>
      <steps>
        <step>Check environment variables for existing configuration</step>
        <step>Display current status table</step>
        <step>Ask which service(s) to configure</step>
      </steps>

      <ask_user>
        question: "Which analytics service would you like to configure?"
        header: "Service"
        options:
          - label: "Google Analytics 4"
            description: "Page views, engagement, conversions"
          - label: "Google Search Console"
            description: "Search performance, CTR, Core Web Vitals"
          - label: "Both services"
            description: "Configure GA4 and GSC"
        multiSelect: true
      </ask_user>
    </phase>

    <phase number="2" name="Google Analytics 4 Setup" condition="GA4 selected">
      <objective>Configure GA4 API access</objective>

      <prerequisites>
        Display setup instructions:
        ```
        ## GA4 Setup Prerequisites

        1. Go to Google Cloud Console: https://console.cloud.google.com
        2. Create or select a project
        3. Enable "Google Analytics Data API"
        4. Create a Service Account (IAM & Admin > Service Accounts)
        5. Download JSON credentials file
        6. In GA4 Admin, add Service Account email as "Viewer"
        ```
      </prerequisites>

      <steps>
        <step>Ask for GA4 Property ID (format: properties/123456789)</step>
        <step>Ask for path to Service Account JSON file</step>
        <step>Test connection by fetching property metadata</step>
        <step>If success: Save credentials</step>
        <step>If failure: Display error, offer to retry</step>
      </steps>

      <credential_storage>
        ```bash
        # .claude/settings.json (committed - non-secret)
        {
          "env": {
            "GA_PROPERTY_ID": "properties/123456789"
          }
        }

        # .claude/settings.local.json (gitignored - secrets)
        # RECOMMENDED: Use file path reference (more secure, handles newlines correctly)
        {
          "env": {
            "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/service-account.json"
          }
        }

        # ALTERNATIVE: Use inline credentials (may have newline issues)
        # {
        #   "env": {
        #     "GOOGLE_CLIENT_EMAIL": "seo-agent@project.iam.gserviceaccount.com",
        #     "GOOGLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
        #   }
        # }
        ```

        **Security Note:** File path references are recommended over inline private keys
        because they avoid newline escaping issues and keep secrets in a separate file.
      </credential_storage>
    </phase>

    <phase number="3" name="Google Search Console Setup" condition="GSC selected">
      <objective>Configure GSC API access</objective>

      <prerequisites>
        Display setup instructions:
        ```
        ## GSC Setup Prerequisites

        1. Use the same Service Account from GA4 (or create new one)
        2. Enable "Search Console API" in Cloud Console
        3. Go to Search Console: https://search.google.com/search-console
        4. Settings > Users and permissions > Add user
        5. Add Service Account email with "Full" permission
        ```
      </prerequisites>

      <steps>
        <step>Ask for site URL (format: https://example.com)</step>
        <step>Ask for path to credentials JSON file</step>
        <step>Test connection by listing sites</step>
        <step>Verify target site is accessible</step>
        <step>If success: Save credentials</step>
        <step>If failure: Display error, offer to retry</step>
      </steps>

      <credential_storage>
        ```bash
        # .claude/settings.json (committed)
        {
          "env": {
            "GSC_SITE_URL": "https://example.com"
          }
        }

        # .claude/settings.local.json (gitignored)
        {
          "env": {
            "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/service-account.json"
          }
        }
        ```
      </credential_storage>
    </phase>

    <phase number="4" name="Verification">
      <objective>Confirm all configured services are working</objective>
      <steps>
        <step>Run connectivity test for each configured service</step>
        <step>Display final status table</step>
        <step>Show available commands based on configuration</step>
      </steps>

      <final_output>
        ```markdown
        ## Analytics Setup Complete

        | Service | Status | Capability |
        |---------|--------|------------|
        | GA4 | CONNECTED | Page metrics, engagement |
        | GSC | CONNECTED | Search performance, CWV |

        ### Available Commands

        - `/performance` - Full content performance analysis
        - `/audit` - Enhanced with real Core Web Vitals
        - `/research` - Enhanced with ranking data

        ### Next Steps

        Run `/performance https://example.com/page` to analyze content.
        ```
      </final_output>
    </phase>
  </workflow>
</instructions>

<error_recovery>
  <scenario name="Invalid GA4 Property ID">
    <symptom>API returns "Property not found"</symptom>
    <recovery>
      - Verify format is "properties/123456789" (not just the number)
      - Check Service Account has Viewer access in GA4 Admin
      - Ensure Analytics Data API is enabled in Cloud Console
    </recovery>
  </scenario>

  <scenario name="GSC Permission Denied">
    <symptom>API returns 403 Forbidden</symptom>
    <recovery>
      - Verify Service Account email is added in Search Console
      - Ensure permission level is "Full" not "Restricted"
      - Check Search Console API is enabled in Cloud Console
    </recovery>
  </scenario>

</error_recovery>
