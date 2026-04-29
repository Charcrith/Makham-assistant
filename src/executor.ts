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
        output: stdout || 'Done!',
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
      { cmd: `docker load -i ${PROJECT_PATH}/charcrith-api.tar`, name: 'Loading API image' },
      { cmd: `docker load -i ${PROJECT_PATH}/charcrith-web.tar`, name: 'Loading Web image' },
      { cmd: `docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} down`, name: 'Stopping services' },
      { cmd: `docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} up -d`, name: 'Starting services' },
    ];

    let fullOutput = '📦 **Deploy Progress**\n\n';
    for (const item of commands) {
      const result = await this.execute(item.cmd);
      fullOutput += `${result.success ? '✅' : '❌'} ${item.name}\n`;
      if (result.success && result.output) {
        fullOutput += `\`\`\`${result.output.slice(0, 200)}\`\`\`\n`;
      } else if (!result.success) {
        fullOutput += `\`\`\`${result.error}\`\`\`\n`;
        return {
          success: false,
          output: fullOutput,
          error: `Failed at: ${item.name}`,
          command: 'deploy',
        };
      }
    }
    fullOutput += '\n🎉 **Deploy Complete!**';

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
      ? `docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} logs ${service} --tail=30`
      : `docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} logs --tail=30`;
    return this.execute(cmd);
  }

  async stop(): Promise<CommandResult> {
    const result = await this.execute(`docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} down`);
    return {
      ...result,
      output: result.success ? '🛑 **Services Stopped**' : result.output,
    };
  }

  async start(): Promise<CommandResult> {
    const result = await this.execute(`docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} up -d`);
    return {
      ...result,
      output: result.success ? '▶️ **Services Started**' : result.output,
    };
  }

  async restart(): Promise<CommandResult> {
    const result = await this.execute(`docker compose -f ${PROJECT_PATH}/${DOCKER_COMPOSE_FILE} restart`);
    return {
      ...result,
      output: result.success ? '🔁 **Services Restarted**' : result.output,
    };
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
      // If output already has formatting (from deploy), use it directly
      if (result.output.includes('📦') || result.output.includes('▶️') || result.output.includes('🔁') || result.output.includes('🛑')) {
        return result.output;
      }
      return `✅ **Success**\n\`\`\`\n${result.output}\n\`\`\``;
    } else {
      return `❌ **Error**\n\`\`\`\n${result.error || result.output}\n\`\`\``;
    }
  }
}
