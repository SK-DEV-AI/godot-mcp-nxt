#!/usr/bin/env node

/**
 * Migration script to replace console.log/error calls with proper logger calls
 * Usage: node scripts/migrate-to-logger.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Component mapping for logger imports
const COMPONENT_MAPPING = {
  'godot_connection.ts': 'connection',
  'config.ts': 'config',
  'logger.ts': 'logger',
  'cache.ts': 'cache',
  'async_queue.ts': 'async_queue',
  'error_context.ts': 'error_context',
  'performance_benchmark.ts': 'performance',
  'tool_registry.ts': 'tool_registry',
  'audit_logger.ts': 'audit',
  'compression.ts': 'compression',
  'retry.ts': 'retry',
  'health_checks.ts': 'health',
  'monitoring.ts': 'monitoring',
  'plugin_system.ts': 'plugin_system',
  'testing_framework.ts': 'testing',
  'client_config_templates.ts': 'config_templates',
  'dynamic_prompt_manager.ts': 'prompt_manager',
  'enhanced_error_handler.ts': 'error_handler',
  'system_prompt.ts': 'system_prompt',
  'types.ts': 'types',
  // Tools
  'node_tools.ts': 'node',
  'script_tools.ts': 'script',
  'scene_tools.ts': 'scene',
  'editor_tools.ts': 'editor',
  'cli_tools.ts': 'cli',
  'code_analysis_tools.ts': 'code_analysis',
  'performance_tools.ts': 'performance',
  'error_recovery_tools.ts': 'error_recovery',
  'prompt_enhancement_tools.ts': 'prompt_enhancement',
  'advanced_tools.ts': 'advanced',
  'screenshot_tools.ts': 'visual',
  'advanced_editor_tools.ts': 'editor_advanced',
  // Resources
  'scene_resources.ts': 'scene_resources',
  'script_resources.ts': 'script_resources',
  'project_resources.ts': 'project_resources',
  'editor_resources.ts': 'editor_resources',
  'index.ts': 'main'
};

// Files to process
const FILES_TO_PROCESS = [
  'server/src/utils/godot_connection.ts',
  'server/src/utils/config.ts',
  'server/src/utils/cache.ts',
  'server/src/utils/async_queue.ts',
  'server/src/utils/error_context.ts',
  'server/src/utils/performance_benchmark.ts',
  'server/src/utils/tool_registry.ts',
  'server/src/utils/audit_logger.ts',
  'server/src/utils/compression.ts',
  'server/src/utils/retry.ts',
  'server/src/utils/health_checks.ts',
  'server/src/utils/monitoring.ts',
  'server/src/utils/plugin_system.ts',
  'server/src/utils/testing_framework.ts',
  'server/src/utils/client_config_templates.ts',
  'server/src/utils/dynamic_prompt_manager.ts',
  'server/src/utils/enhanced_error_handler.ts',
  'server/src/utils/system_prompt.ts',
  'server/src/utils/types.ts',
  'server/src/tools/node_tools.ts',
  'server/src/tools/script_tools.ts',
  'server/src/tools/scene_tools.ts',
  'server/src/tools/editor_tools.ts',
  'server/src/tools/cli_tools.ts',
  'server/src/tools/code_analysis_tools.ts',
  'server/src/tools/performance_tools.ts',
  'server/src/tools/error_recovery_tools.ts',
  'server/src/tools/prompt_enhancement_tools.ts',
  'server/src/tools/advanced_tools.ts',
  'server/src/tools/screenshot_tools.ts',
  'server/src/tools/advanced_editor_tools.ts',
  'server/src/resources/scene_resources.ts',
  'server/src/resources/script_resources.ts',
  'server/src/resources/project_resources.ts',
  'server/src/resources/editor_resources.ts',
  'server/src/index.ts'
];

function getComponentName(filePath) {
  const fileName = path.basename(filePath);
  return COMPONENT_MAPPING[fileName] || 'default';
}

function addLoggerImport(content, component) {
  // Skip if already has logger import
  if (content.includes("from './logger.js'")) {
    return content;
  }

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import') && line.includes('from')) {
      lastImportIndex = i;
    } else if (lastImportIndex !== -1 && !line.startsWith('import') && line !== '') {
      break;
    }
  }

  if (lastImportIndex === -1) {
    // No imports found, add at the beginning
    return `import { ${component}Logger } from './logger.js';\n\n${content}`;
  }

  // Add logger import after the last import
  const loggerImport = `import { ${component}Logger } from './logger.js';`;
  lines.splice(lastImportIndex + 1, 0, '', loggerImport);

  return lines.join('\n');
}

function replaceConsoleCalls(content, component) {
  let result = content;

  // Replace console.error with logger.error
  result = result.replace(
    /console\.error\(([^;]+)\);?/g,
    (match, args) => {
      // Parse the arguments
      const argMatch = args.match(/^\s*['"]([^'"]*)['"]\s*(?:,\s*(.+))?$/);
      if (argMatch) {
        const message = argMatch[1];
        const extraArgs = argMatch[2];
        if (extraArgs) {
          return `${component}Logger.error('${message}', ${extraArgs});`;
        } else {
          return `${component}Logger.error('${message}');`;
        }
      }
      return match; // Keep original if can't parse
    }
  );

  // Replace console.log with appropriate logger level
  result = result.replace(
    /console\.log\(([^;]+)\);?/g,
    (match, args) => {
      // Parse the arguments
      const argMatch = args.match(/^\s*['"]([^'"]*)['"]\s*(?:,\s*(.+))?$/);
      if (argMatch) {
        const message = argMatch[1];
        const extraArgs = argMatch[2];
        if (extraArgs) {
          return `${component}Logger.info('${message}', ${extraArgs});`;
        } else {
          return `${component}Logger.info('${message}');`;
        }
      }
      return match; // Keep original if can't parse
    }
  );

  // Replace console.warn with logger.warn
  result = result.replace(
    /console\.warn\(([^;]+)\);?/g,
    (match, args) => {
      // Parse the arguments
      const argMatch = args.match(/^\s*['"]([^'"]*)['"]\s*(?:,\s*(.+))?$/);
      if (argMatch) {
        const message = argMatch[1];
        const extraArgs = argMatch[2];
        if (extraArgs) {
          return `${component}Logger.warn('${message}', ${extraArgs});`;
        } else {
          return `${component}Logger.warn('${message}');`;
        }
      }
      return match; // Keep original if can't parse
    }
  );

  return result;
}

function processFile(filePath) {
  const fullPath = path.resolve(filePath);
  const component = getComponentName(filePath);

  console.log(`Processing ${filePath} (component: ${component})...`);

  try {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Add logger import
    content = addLoggerImport(content, component);

    // Replace console calls
    content = replaceConsoleCalls(content, component);

    // Write back
    fs.writeFileSync(fullPath, content, 'utf8');

    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to process ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Starting logger migration...\n');

  for (const filePath of FILES_TO_PROCESS) {
    processFile(filePath);
  }

  console.log('\n✅ Logger migration completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Review the changes to ensure they look correct');
  console.log('2. Test the application to make sure logging works');
  console.log('3. Update any remaining console calls that couldn\'t be auto-migrated');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processFile, getComponentName, addLoggerImport, replaceConsoleCalls };