import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly STORAGE_KEY = 'codeAcademyProgress';

  private getProgressData(): any {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : { completedLessons: [] };
    } catch {
      return { completedLessons: [] };
    }
  }

  private saveProgressData(data: any): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save progress to localStorage', e);
    }
  }

  isLessonCompleted(lessonId: string): boolean {
    const data = this.getProgressData();
    return data.completedLessons.includes(lessonId);
  }

  markLessonAsCompleted(lessonId: string): void {
    const data = this.getProgressData();
    if (!data.completedLessons.includes(lessonId)) {
      data.completedLessons.push(lessonId);
      this.saveProgressData(data);
    }
  }
}
