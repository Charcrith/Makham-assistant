import { exec } from 'child_process';
import { promisify } from 'util';
import type { CommandResult } from './types';

const execAsync = promisify(exec);

const PROJECT_PATH = process.env.PROJECT_PATH || '/Christ-web';
const DOCKER_COMPOSE_FILE = process.env.DOCKER_COMPOSE_FILE || 'docker-compose-prod.yml';

export class CommandExecutor {
  private pendingCommands: Map<string, { command: string; timestamp: number }> = new Map();

  async execute(command: string): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      return {
        success: true,
        output: stdout || 'Command executed successfully',
        command,
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      return {
        success: false,
        output: err.stdout || '',
        error: err.stderr || err.message || 'Unknown error',
        command,
      };
    }
  }

  async deploy(): Promise<CommandResult> {
    const commands = [
      `docker load -i ${PROJECT_PATH}/charcrith-api.tar`,
      `docker load -i ${PROJECT_PATH}/charcrith-web.tar`,
      `docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} down`,
      `docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} up -d`,
    ];

    let fullOutput = '';
    for (const cmd of commands) {
      const result = await this.execute(cmd);
      fullOutput += `\n$ ${cmd}\n`;
      fullOutput += result.success ? result.output : `Error: ${result.error}`;
      fullOutput += '\n';

      if (!result.success) {
        return {
          success: false,
          output: fullOutput,
          error: `Command failed: ${cmd}`,
          command: cmd,
        };
      }
    }

    return {
      success: true,
      output: fullOutput,
      command: 'deploy',
    };
  }

  async status(): Promise<CommandResult> {
    return this.execute(`docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} ps`);
  }

  async logs(service?: string): Promise<CommandResult> {
    const cmd = service
      ? `docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} logs ${service}`
      : `docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} logs --tail=50`;
    return this.execute(cmd);
  }

  async stop(): Promise<CommandResult> {
    return this.execute(`docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} down`);
  }

  async start(): Promise<CommandResult> {
    return this.execute(`docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} up -d`);
  }

  async restart(): Promise<CommandResult> {
    return this.execute(`docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} restart`);
  }

  storePendingCommand(userId: string, command: string): void {
    this.pendingCommands.set(userId, {
      command,
      timestamp: Date.now(),
    });
  }

  getPendingCommand(userId: string): string | null {
    const pending = this.pendingCommands.get(userId);
    if (!pending) return null;

    // Expire after 5 minutes
    if (Date.now() - pending.timestamp > 5 * 60 * 1000) {
      this.pendingCommands.delete(userId);
      return null;
    }

    return pending.command;
  }

  clearPendingCommand(userId: string): void {
    this.pendingCommands.delete(userId);
  }

  formatResult(result: CommandResult): string {
    if (result.success) {
      return `✅ **Success**\n\`\`\`\n${result.output}\n\`\`\``;
    } else {
      return `❌ **Error**\n\`\`\`\n${result.error || result.output}\n\`\`\``;
    }
  }
}
