import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-learning-path',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './learning-path.component.html',
  styleUrls: ['./learning-path.component.css']
})
export class LearningPathComponent implements OnInit {
  contentService = inject(ContentService);
  progressService = inject(ProgressService);

  languages: any[] = [];
  selectedLanguageId: string = '';
  courseData: any = null;
  isLoading = true;

  ngOnInit() {
    this.contentService.getLanguagesIndex().subscribe({
      next: (data) => {
        this.languages = data.languages;
        if (this.languages.length > 0) {
          this.selectLanguage(this.languages[0].id);
        }
      },
      error: () => this.isLoading = false
    });
  }

  selectLanguage(langId: string) {
    this.selectedLanguageId = langId;
    this.isLoading = true;
    this.courseData = null;
    
    this.contentService.getLanguageCourse(langId).subscribe({
      next: (data) => {
        this.courseData = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  isCompleted(lessonId: string): boolean {
    return this.progressService.isLessonCompleted(lessonId);
  }
}
