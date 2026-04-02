/**
 * Documentation Generation System
 *
 * Automated documentation tools with:
 * - API documentation generator
 * - Component documentation generator
 * - Type definition documentation
 * - Usage examples generator
 * - Markdown/HTML output
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Documentation types
 */
export type DocType = 'api' | 'component' | 'type' | 'guide' | 'readme';

/**
 * Documentation output format
 */
export type DocFormat = 'markdown' | 'html' | 'json';

/**
 * API endpoint documentation
 */
export interface APIDoc {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: any;
  }>;
  requestBody?: {
    type: string;
    properties: Record<string, { type: string; description: string; required?: boolean }>;
  };
  responses: Array<{
    statusCode: number;
    description: string;
    schema?: any;
  }>;
  examples?: Array<{
    request: any;
    response: any;
  }>;
}

/**
 * Component documentation
 */
export interface ComponentDoc {
  name: string;
  description: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    description: string;
  }>;
  examples: Array<{
    title: string;
    code: string;
    description?: string;
  }>;
  usage: string;
}

/**
 * Type documentation
 */
export interface TypeDoc {
  name: string;
  kind: 'interface' | 'type' | 'enum' | 'class';
  description: string;
  properties?: Array<{
    name: string;
    type: string;
    optional: boolean;
    description: string;
  }>;
  methods?: Array<{
    name: string;
    parameters: Array<{ name: string; type: string; description: string }>;
    returnType: string;
    description: string;
  }>;
}

/**
 * Documentation generator class
 */
export class DocumentationGenerator {
  private outputDir: string;
  private projectName: string;
  private projectVersion: string;

  constructor(config: {
    outputDir: string;
    projectName: string;
    projectVersion: string;
  }) {
    this.outputDir = config.outputDir;
    this.projectName = config.projectName;
    this.projectVersion = config.projectVersion;
  }

  /**
   * Generate API documentation
   */
  generateAPIDoc(endpoints: APIDoc[], format: DocFormat = 'markdown'): string {
    switch (format) {
      case 'markdown':
        return this.generateAPIMarkdown(endpoints);
      case 'html':
        return this.generateAPIHTML(endpoints);
      case 'json':
        return JSON.stringify(endpoints, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate API documentation in Markdown
   */
  private generateAPIMarkdown(endpoints: APIDoc[]): string {
    let markdown = `# API Documentation\n\n`;
    markdown += `**Project:** ${this.projectName}\n`;
    markdown += `**Version:** ${this.projectVersion}\n`;
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;

    markdown += `## Table of Contents\n\n`;
    endpoints.forEach((endpoint, index) => {
      markdown += `${index + 1}. [${endpoint.method} ${endpoint.path}](#${endpoint.method.toLowerCase()}-${endpoint.path.replace(/\//g, '-')})\n`;
    });

    markdown += `\n---\n\n`;

    endpoints.forEach((endpoint) => {
      markdown += `## ${endpoint.method} ${endpoint.path}\n\n`;
      markdown += `${endpoint.description}\n\n`;

      // Parameters
      if (endpoint.parameters.length > 0) {
        markdown += `### Parameters\n\n`;
        markdown += `| Name | Type | Required | Description | Default |\n`;
        markdown += `|------|------|----------|-------------|----------|\n`;

        endpoint.parameters.forEach((param) => {
          markdown += `| ${param.name} | \`${param.type}\` | ${param.required ? 'Yes' : 'No'} | ${param.description} | ${param.defaultValue ?? '-'} |\n`;
        });

        markdown += `\n`;
      }

      // Request body
      if (endpoint.requestBody) {
        markdown += `### Request Body\n\n`;
        markdown += `**Type:** \`${endpoint.requestBody.type}\`\n\n`;

        if (Object.keys(endpoint.requestBody.properties).length > 0) {
          markdown += `| Property | Type | Required | Description |\n`;
          markdown += `|----------|------|----------|-------------|\n`;

          Object.entries(endpoint.requestBody.properties).forEach(([prop, info]) => {
            markdown += `| ${prop} | \`${info.type}\` | ${info.required ? 'Yes' : 'No'} | ${info.description} |\n`;
          });

          markdown += `\n`;
        }
      }

      // Responses
      markdown += `### Responses\n\n`;
      endpoint.responses.forEach((response) => {
        markdown += `#### ${response.statusCode}\n\n`;
        markdown += `${response.description}\n\n`;

        if (response.schema) {
          markdown += `\`\`\`json\n${JSON.stringify(response.schema, null, 2)}\n\`\`\`\n\n`;
        }
      });

      // Examples
      if (endpoint.examples && endpoint.examples.length > 0) {
        markdown += `### Examples\n\n`;
        endpoint.examples.forEach((example, index) => {
          markdown += `#### Example ${index + 1}\n\n`;
          markdown += `**Request:**\n`;
          markdown += `\`\`\`bash\n${JSON.stringify(example.request, null, 2)}\n\`\`\`\n\n`;
          markdown += `**Response:**\n`;
          markdown += `\`\`\`json\n${JSON.stringify(example.response, null, 2)}\n\`\`\`\n\n`;
        });
      }

      markdown += `---\n\n`;
    });

    return markdown;
  }

  /**
   * Generate API documentation in HTML
   */
  private generateAPIHTML(endpoints: APIDoc[]): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - ${this.projectName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .endpoint { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
    .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; margin-right: 8px; }
    .method.GET { background: #28a745; color: white; }
    .method.POST { background: #007bff; color: white; }
    .method.PUT { background: #ffc107; color: black; }
    .method.DELETE { background: #dc3545; color: white; }
    .method.PATCH { background: #17a2b8; color: white; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: bold; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>API Documentation</h1>
  <p><strong>Project:</strong> ${this.projectName} | <strong>Version:</strong> ${this.projectVersion} | <strong>Generated:</strong> ${new Date().toISOString()}</p>

  <nav>
    <h2>Table of Contents</h2>
    <ul>
      ${endpoints.map((endpoint, index) => `<li><a href="#endpoint-${index}">${endpoint.method} ${endpoint.path}</a></li>`).join('\n      ')}
    </ul>
  </nav>
`;

    endpoints.forEach((endpoint, index) => {
      html += `
  <div class="endpoint" id="endpoint-${index}">
    <h2><span class="method ${endpoint.method}">${endpoint.method}</span> ${endpoint.path}</h2>
    <p>${endpoint.description}</p>
`;

      // Parameters table
      if (endpoint.parameters.length > 0) {
        html += `    <h3>Parameters</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Required</th>
          <th>Description</th>
          <th>Default</th>
        </tr>
      </thead>
      <tbody>
        ${endpoint.parameters.map(param => `
        <tr>
          <td><code>${param.name}</code></td>
          <td><code>${param.type}</code></td>
          <td>${param.required ? 'Yes' : 'No'}</td>
          <td>${param.description}</td>
          <td>${param.defaultValue ?? '-'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
`;
      }

      // Request body
      if (endpoint.requestBody) {
        html += `    <h3>Request Body</h3>
    <p><strong>Type:</strong> <code>${endpoint.requestBody.type}</code></p>
`;
      }

      // Responses
      html += `    <h3>Responses</h3>
    ${endpoint.responses.map(response => `
    <h4>${response.statusCode}</h4>
    <p>${response.description}</p>
    ${response.schema ? `<pre><code>${JSON.stringify(response.schema, null, 2)}</code></pre>` : ''}
    `).join('')}
  </div>
`;
    });

    html += `
</body>
</html>
`;

    return html;
  }

  /**
   * Generate component documentation
   */
  generateComponentDoc(components: ComponentDoc[], format: DocFormat = 'markdown'): string {
    switch (format) {
      case 'markdown':
        return this.generateComponentMarkdown(components);
      case 'html':
        return this.generateComponentHTML(components);
      case 'json':
        return JSON.stringify(components, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate component documentation in Markdown
   */
  private generateComponentMarkdown(components: ComponentDoc[]): string {
    let markdown = `# Component Documentation\n\n`;
    markdown += `**Project:** ${this.projectName}\n`;
    markdown += `**Version:** ${this.projectVersion}\n\n`;

    components.forEach((component) => {
      markdown += `## ${component.name}\n\n`;
      markdown += `${component.description}\n\n`;

      // Props
      if (component.props.length > 0) {
        markdown += `### Props\n\n`;
        markdown += `| Name | Type | Required | Default | Description |\n`;
        markdown += `|------|------|----------|---------|-------------|\n`;

        component.props.forEach((prop) => {
          markdown += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | ${prop.defaultValue ?? '-'} | ${prop.description} |\n`;
        });

        markdown += `\n`;
      }

      // Usage
      markdown += `### Usage\n\n`;
      markdown += `\`\`\`tsx\n${component.usage}\n\`\`\`\n\n`;

      // Examples
      if (component.examples.length > 0) {
        markdown += `### Examples\n\n`;
        component.examples.forEach((example) => {
          markdown += `#### ${example.title}\n\n`;
          if (example.description) {
            markdown += `${example.description}\n\n`;
          }
          markdown += `\`\`\`tsx\n${example.code}\n\`\`\`\n\n`;
        });
      }

      markdown += `---\n\n`;
    });

    return markdown;
  }

  /**
   * Generate component documentation in HTML
   */
  private generateComponentHTML(components: ComponentDoc[]): string {
    // Similar to API HTML generation but for components
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Component Documentation - ${this.projectName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .component { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .prop { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Component Documentation</h1>
`;

    components.forEach((component) => {
      html += `
  <div class="component">
    <h2>${component.name}</h2>
    <p>${component.description}</p>

    <h3>Props</h3>
    ${component.props.map(prop => `
    <div class="prop">
      <strong>${prop.name}</strong>: <code>${prop.type}</code>
      ${prop.required ? '<span style="color: red;">*required</span>' : ''}
      <p>${prop.description}</p>
      ${prop.defaultValue ? `<p><strong>Default:</strong> ${prop.defaultValue}</p>` : ''}
    </div>`).join('')}

    <h3>Usage</h3>
    <pre><code>${component.usage}</code></pre>
  </div>
`;
    });

    html += `</body></html>`;
    return html;
  }

  /**
   * Generate README
   */
  generateREADME(config: {
    description: string;
    installation: string;
    usage: string;
    features: string[];
    author: string;
    license: string;
  }): string {
    const readme = `# ${this.projectName}

${config.description}

## Features

${config.features.map(feature => `- ${feature}`).join('\n')}

## Installation

\`\`\`bash
${config.installation}
\`\`\`

## Usage

\`\`\`typescript
${config.usage}
\`\`\`

## Documentation

For detailed documentation, please see the [docs](./docs) folder.

## Version

Current version: ${this.projectVersion}

## Author

${config.author}

## License

${config.license}
`;

    return readme;
  }

  /**
   * Generate CHANGELOG
   */

  /**
   * Generate CHANGELOG
   */
  generateCHANGELOG(changes: ChangelogEntry[]): string {
    let changelog = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n`;

    changes.forEach(({ version, date, changes: versionChanges }) => {
      changelog += `## [${version}] - ${date}\n\n`;

      const sections = [
        { key: 'added', title: 'Added' },
        { key: 'changed', title: 'Changed' },
        { key: 'deprecated', title: 'Deprecated' },
        { key: 'removed', title: 'Removed' },
        { key: 'fixed', title: 'Fixed' },
        { key: 'security', title: 'Security' },
      ];
      const sections = [
        { key: 'added', title: 'Added' },
        { key: 'changed', title: 'Changed' },
        { key: 'deprecated', title: 'Deprecated' },
        { key: 'removed', title: 'Removed' },
        { key: 'fixed', title: 'Fixed' },
        { key: 'security', title: 'Security' },
      ];

      sections.forEach((section) => {
        const items = versionChanges[section.key as keyof typeof versionChanges];
        if (items && items.length > 0) {
          changelog += `### ${section.title}\n\n`;
          items.forEach((item) => {
            changelog += `- ${item}\n`;
          });
          changelog += '\n';
        }
      });
    });

    return changelog;
  }

  /**
   * Save documentation to file
   */
  async saveToFile(content: string, filename: string, subdirectory?: string): Promise<void> {
    let dir = this.outputDir;
    if (subdirectory) {
      dir = path.join(this.outputDir, subdirectory);
    }

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, content, 'utf-8');
  }

  /**
   * Generate all documentation
   */
  async generateAll(config: {
    apis?: APIDoc[];
    components?: ComponentDoc[];
    types?: TypeDoc[];
    readme?: Parameters<typeof this.generateREADME>[0];
    changelog?: Parameters<typeof this.generateCHANGELOG>[0];
  }): Promise<void> {
    // Generate API docs
    if (config.apis) {
      const apiMarkdown = this.generateAPIDoc(config.apis, 'markdown');
      await this.saveToFile(apiMarkdown, 'api.md', 'api');

      const apiHTML = this.generateAPIDoc(config.apis, 'html');
      await this.saveToFile(apiHTML, 'api.html', 'api');
    }

    // Generate component docs
    if (config.components) {
      const componentMarkdown = this.generateComponentDoc(config.components, 'markdown');
      await this.saveToFile(componentMarkdown, 'components.md', 'components');

      const componentHTML = this.generateComponentDoc(config.components, 'html');
      await this.saveToFile(componentHTML, 'components.html', 'components');
    }

    // Generate README
    if (config.readme) {
      const readme = this.generateREADME(config.readme);
      await this.saveToFile(readme, 'README.md');
    }

    // Generate CHANGELOG
    if (config.changelog) {
      const changelog = this.generateCHANGELOG(config.changelog);
      await this.saveToFile(changelog, 'CHANGELOG.md');
    }
  }
}

/**
 * Quick documentation generator
 */
export function quickDoc(content: string, type: DocType = 'guide'): string {
  const timestamp = new Date().toISOString();
  const header = `---
# Generated Documentation
**Type:** ${type}
**Date:** ${timestamp}
---

`;

  return header + content;
}

/**
 * JSDoc generator
 */
export function generateJSDoc(
  functionName: string,
  description: string,
  params: Array<{ name: string; type: string; description: string }>,
  returnType: string,
  example?: string
): string {
  let jsdoc = `/**
 * ${description}
 *
`;

  if (params.length > 0) {
    jsdoc += ` * @param {Object} params - Function parameters
`;
    params.forEach((param) => {
      jsdoc += ` * @param {${param.type}} params.${param.name} - ${param.description}
`;
    });
  }

  jsdoc += ` * @returns {${returnType}} Function result
`;

  if (example) {
    jsdoc += ` *
 * @example
 * ${example}
`;
  }

  jsdoc += ' */';

  return jsdoc;
}
