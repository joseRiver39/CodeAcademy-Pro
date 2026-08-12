import { Component, inject, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { ContentService, Lesson } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { ProfileService } from '../../core/services/profile.service';
import { MonacoEditorComponent } from '../../shared/components/monaco-editor/monaco-editor.component';

@Component({
  selector: 'app-lesson',
  standalone: true,
  imports: [CommonModule, RouterModule, MarkdownModule, MonacoEditorComponent],
  templateUrl: './lesson.component.html',
  styleUrls: ['./lesson.component.css']
})
export class LessonComponent implements OnInit {
  contentService = inject(ContentService);
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  router = inject(Router);
  progressService = inject(ProgressService);
  profileService = inject(ProfileService);
  
  lesson: Lesson | null = null;
  // Per-block feedback (so each editor block has its own feedback panel)
  feedbackMap: { [key: number]: any } = {};
  loadingMap:  { [key: number]: boolean } = {};
  
  // Per-block Execution state
  consoleOutputMap: { [key: number]: { text: string, isError: boolean } | null } = {};
  isExecutingMap: { [key: number]: boolean } = {};

  // Per-block UI state keyed by block index
  showSolution: { [key: number]: boolean | undefined } = {};
  revealedHintCount: { [key: number]: number | undefined } = {};
  // Track current code per block (for "Revisar con IA")
  blockCode: { [key: number]: string | undefined } = {};

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const language = params.get('language')!;
      const level    = params.get('level')!;
      const id       = params.get('id')!;

      this.contentService.getLesson(language, level, id).subscribe({
        next: (data) => {
          this.lesson = data;
          this.feedbackMap = {};
          this.loadingMap  = {};
          this.consoleOutputMap = {};
          this.isExecutingMap = {};
          this.showSolution = {};
          this.revealedHintCount = {};
          // Seed blockCode with the initial values
          data.contentBlocks.forEach((block, i) => {
            if (block.type === 'code-editor') {
              this.blockCode[i] = block.config.initialCode;
            }
          });
          // Track last visited lesson in profile
          const route = `/lesson/${language}/${level}/${id}`;
          this.profileService.updateLastLesson(data.id, data.title, route);
        },
        error: () => this.router.navigate(['/'])
      });
    });
  }

  onCodeChange(blockIndex: number, code: string) {
    this.blockCode[blockIndex] = code;
  }

  // --- Hint system ---
  getRevealedHints(blockIndex: number, hints: string[]): string[] {
    const count = this.revealedHintCount[blockIndex] ?? 0;
    return hints.slice(0, count);
  }

  hasMoreHints(blockIndex: number, hints: string[]): boolean {
    return (this.revealedHintCount[blockIndex] ?? 0) < hints.length;
  }

  revealNextHint(blockIndex: number): void {
    this.revealedHintCount[blockIndex] = (this.revealedHintCount[blockIndex] ?? 0) + 1;
  }

  getHintCount(blockIndex: number): number {
    return this.revealedHintCount[blockIndex] ?? 0;
  }

  toggleSolution(blockIndex: number): void {
    this.showSolution[blockIndex] = !this.showSolution[blockIndex];
  }

  // --- AI Feedback ---
  evaluateCode(blockIndex: number) {
    const code = this.blockCode[blockIndex] ?? '';
    this.loadingMap[blockIndex] = true;
    this.feedbackMap[blockIndex] = null;

    this.http.post<any>('/api/evaluate', {
      code,
      language: this.lesson?.language,
      context: this.lesson?.title
    }).subscribe({
      next: (res) => {
        this.feedbackMap[blockIndex] = res;
        this.loadingMap[blockIndex] = false;
        // Scroll to the feedback panel after a short tick
        setTimeout(() => {
          const el = document.getElementById(`feedback-${blockIndex}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      },
      error: (err) => {
        console.error('Evaluation error:', err);
        this.loadingMap[blockIndex] = false;
      }
    });
  }

  // --- Code Execution ---
  runCode(blockIndex: number) {
    const code = this.blockCode[blockIndex] ?? '';
    this.isExecutingMap[blockIndex] = true;
    this.consoleOutputMap[blockIndex] = null;

    this.http.post<any>('/api/run', {
      code,
      language: this.lesson?.language
    }).subscribe({
      next: (res) => {
        this.consoleOutputMap[blockIndex] = { text: res.output, isError: res.isError };
        this.isExecutingMap[blockIndex] = false;
        setTimeout(() => {
          const el = document.getElementById(`console-${blockIndex}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 50);
      },
      error: (err) => {
        console.error('Execution error:', err);
        this.consoleOutputMap[blockIndex] = { text: 'Error de red al intentar ejecutar el código.', isError: true };
        this.isExecutingMap[blockIndex] = false;
      }
    });
  }

  // --- Completion ---
  completeLesson() {
    if (this.lesson) {
      this.progressService.markLessonAsCompleted(this.lesson.id);
      if (this.lesson.nextLessonId) {
        this.router.navigate(['/lesson', this.lesson.language, this.lesson.level, this.lesson.nextLessonId]);
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}
