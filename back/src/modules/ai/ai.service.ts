import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { TasksService } from '../tasks/tasks.service';
import { CommentsService } from '../comments/comments.service';

interface TaskContext {
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeName: string | null;
  deadline: Date | null;
  comments: string[];
  aiSummary: string | null;
}

@Injectable()
export class AiService {
  private readonly client: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    private readonly tasksService: TasksService,
    private readonly commentsService: CommentsService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async summarizeTask(taskId: string, projectId: string): Promise<string> {
    const task = await this.tasksService.getTaskWithContext(taskId);

    if (task.projectId !== projectId) {
      throw new NotFoundException('Task not found in this project');
    }

    // return if cache
    if (task.aiSummary) {
      return task.aiSummary;
    }

    const comments = await this.commentsService.findAll(taskId);
    const commentTexts = comments
      .slice(-20)
      .map((c) => `[${c.user?.name ?? 'Unknown'}]: ${c.content}`);

    const context: TaskContext = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeName: task.assignee?.name ?? null,
      deadline: task.deadline,
      comments: commentTexts,
      aiSummary: task.aiSummary,
    };

    const summary = await this.callAnthropic(context);

    // saving in caсhe
    await this.tasksService.updateAiSummary(taskId, summary);

    return summary;
  }

  private async callAnthropic(context: TaskContext): Promise<string> {
    const prompt = this.buildPrompt(context);

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = message.content[0];
    if (block.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    return block.text;
  }

  private buildPrompt(ctx: TaskContext): string {
    const lines: string[] = [
      `Task: ${ctx.title}`,
      `Status: ${ctx.status}`,
      `Priority: ${ctx.priority}`,
      `Assignee: ${ctx.assigneeName ?? 'Unassigned'}`,
      `Deadline: ${ctx.deadline ? ctx.deadline.toISOString() : 'None'}`,
      `Description: ${ctx.description ?? 'No description'}`,
    ];

    if (ctx.comments.length > 0) {
      lines.push('', 'Recent comments:', ...ctx.comments);
    }

    lines.push(
      '',
      'Summarize the current state of this task in 3-4 sentences.',
      'Cover: what has been done, what is blocking progress, and what the next step is.',
      'Be concise and actionable. Do not use bullet points.',
    );

    return lines.join('\n');
  }
}
