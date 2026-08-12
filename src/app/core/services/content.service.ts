import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  language: string;
  level: string;
  nextLessonId?: string | null;
  previousLessonId?: string | null;
  contentBlocks: ContentBlock[];
}

export interface ContentBlock {
  type: 'markdown' | 'code-editor';
  content?: string;
  config?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private http = inject(HttpClient);

  getLanguagesIndex(): Observable<any> {
    return this.http.get<any>('/content/index.json');
  }

  getLanguageCourse(languageId: string): Observable<any> {
    return this.http.get<any>(`/content/${languageId}/index.json`);
  }

  getLesson(language: string, level: string, lessonId: string): Observable<Lesson> {
    // Fetches the static JSON file
    return this.http.get<Lesson>(`/content/${language}/${level}/${lessonId}.json`);
  }
}
