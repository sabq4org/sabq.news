import { storage } from '../storage';
import { aiArticleGenerator } from './aiArticleGenerator';
import { aiImageGenerator } from './aiImageGenerator';
import type { AiScheduledTask } from '@shared/schema';

export interface TaskExecutionResult {
  success: boolean;
  articleId?: string;
  imageUrl?: string;
  error?: string;
  executionTimeMs: number;
  tokensUsed: number;
  generationCost: number;
}

export class AITaskExecutor {
  private readonly costPerToken = 0.00001; // $0.01 per 1000 tokens (estimate)
  private readonly costPerImage = 0.04; // DALL-E 3 standard cost

  async executeTask(taskId: string): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    let totalTokens = 0;
    let totalCost = 0;

    try {
      // Get task details
      const task = await storage.getAiTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Check if task is still pending
      if (task.status !== 'pending') {
        throw new Error(`Task ${taskId} is not in pending status (current: ${task.status})`);
      }

      // Mark as processing
      await storage.updateAiTask(taskId, {
        status: 'processing',
        executedAt: new Date()
      });

      console.log(`[AI Task Executor] Executing task ${taskId}: ${task.title}`);

      // Step 1: Generate article content
      const generatedArticle = await aiArticleGenerator.generateArticle({
        title: task.title,
        categoryId: task.categoryId || 'general',
        locale: task.locale as 'ar' | 'en' | 'ur',
        contentType: task.contentType as 'news' | 'analysis' | 'report' | 'interview' | 'opinion',
        keywords: Array.isArray(task.keywords) ? task.keywords : undefined,
        tone: 'neutral',
        length: 'medium',
        additionalInstructions: task.aiPrompt || undefined
      });

      totalTokens += generatedArticle.tokensUsed;
      totalCost += generatedArticle.tokensUsed * this.costPerToken;

      console.log(`[AI Task Executor] Article generated in ${generatedArticle.generationTimeMs}ms`);

      // Step 2: Generate image (optional)
      let imageUrl: string | undefined;
      if (task.generateImage) {
        try {
          const generatedImage = await aiImageGenerator.generateImageForTask(task);
          if (generatedImage) {
            imageUrl = generatedImage.imageUrl;
            totalCost += this.costPerImage;
            console.log(`[AI Task Executor] Image generated in ${generatedImage.generationTimeMs}ms`);
          }
        } catch (error) {
          console.error('[AI Task Executor] Image generation failed, continuing without image:', error);
          // Continue without image - not a critical failure
        }
      }

      // Step 3: Create article in database
      const articleData = await aiArticleGenerator.convertTaskToArticleData(task, generatedArticle);

      const createdArticle = await storage.createArticle(articleData);
      
      // Update with featured image if generated
      if (imageUrl && createdArticle.id) {
        await storage.updateArticle(createdArticle.id, {
          imageUrl: imageUrl,
          isAiGeneratedImage: true,
          aiImageModel: task.imageModel || 'gemini-pro-image'
        });
      }

      console.log(`[AI Task Executor] Article created with ID: ${createdArticle.id}`);

      // Step 4: Mark task as completed
      await storage.updateAiTaskExecution(taskId, {
        status: 'completed',
        generatedArticleId: createdArticle.id,
        generatedImageUrl: imageUrl,
        executionTimeMs: Date.now() - startTime,
        tokensUsed: totalTokens,
        generationCost: totalCost,
        executionLogs: {
          articleGenerationTime: generatedArticle.generationTimeMs,
          imageGenerationTime: imageUrl ? 'success' : 'skipped',
          articleLength: generatedArticle.content.length,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`[AI Task Executor] Task ${taskId} completed successfully`);

      return {
        success: true,
        articleId: createdArticle.id,
        imageUrl,
        executionTimeMs: Date.now() - startTime,
        tokensUsed: totalTokens,
        generationCost: totalCost
      };

    } catch (error) {
      console.error(`[AI Task Executor] Task ${taskId} failed:`, error);

      // Mark task as failed
      await storage.updateAiTaskExecution(taskId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
        tokensUsed: totalTokens,
        generationCost: totalCost
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
        tokensUsed: totalTokens,
        generationCost: totalCost
      };
    }
  }

  async executePendingTasks(): Promise<{
    executed: number;
    succeeded: number;
    failed: number;
  }> {
    console.log('[AI Task Executor] Checking for pending tasks...');

    const pendingTasks = await storage.getPendingAiTasks();

    if (pendingTasks.length === 0) {
      return { executed: 0, succeeded: 0, failed: 0 };
    }

    console.log(`[AI Task Executor] Found ${pendingTasks.length} pending task(s)`);

    let succeeded = 0;
    let failed = 0;

    // Execute tasks sequentially (to avoid overwhelming AI APIs)
    for (const task of pendingTasks) {
      const result = await this.executeTask(task.id);
      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    console.log(`[AI Task Executor] Execution summary: ${succeeded} succeeded, ${failed} failed`);

    return {
      executed: pendingTasks.length,
      succeeded,
      failed
    };
  }
}

export const aiTaskExecutor = new AITaskExecutor();
