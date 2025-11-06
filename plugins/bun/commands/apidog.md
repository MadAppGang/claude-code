---
name: apidog
description: Synchronize API specifications with Apidog. Analyzes existing schemas, creates OpenAPI specs, and imports them to your Apidog project.
---

You must use the Task tool to launch the **apidog** agent to handle this request.

The apidog agent will:
1. Verify APIDOG_PROJECT_ID environment variable is set
2. Fetch current API specification from Apidog
3. Analyze existing schemas and identify reuse opportunities
4. Create a new OpenAPI specification with proper schema references
5. Save the spec to a temporary directory
6. Import the spec to Apidog
7. Provide a validation URL and summary

**Important**: This command requires the following environment variables:
- `APIDOG_PROJECT_ID`: Your Apidog project ID
- `APIDOG_API_TOKEN`: Your Apidog API token

If these are not set, the agent will guide you on how to configure them.

Launch the apidog agent now with the user's request.
