import { Injectable } from '@angular/core';

export interface UserProfile {
  id: string;
  name: string;
  createdAt: string;
  lastActive: string;
  lastLessonId: string | null;
  lastLessonTitle: string | null;
  lastLessonRoute: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly PROFILE_KEY = 'codeAcademyProfile';

  getProfile(): UserProfile | null {
    try {
      const raw = localStorage.getItem(this.PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  createProfile(name: string): UserProfile {
    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      lastLessonId: null,
      lastLessonTitle: null,
      lastLessonRoute: null
    };
    this.saveProfile(profile);
    return profile;
  }

  updateLastLesson(lessonId: string, lessonTitle: string, route: string): void {
    const profile = this.getProfile();
    if (!profile) return;
    profile.lastLessonId = lessonId;
    profile.lastLessonTitle = lessonTitle;
    profile.lastLessonRoute = route;
    profile.lastActive = new Date().toISOString();
    this.saveProfile(profile);
  }

  updateLastActive(): void {
    const profile = this.getProfile();
    if (!profile) return;
    profile.lastActive = new Date().toISOString();
    this.saveProfile(profile);
  }

  hasProfile(): boolean {
    return this.getProfile() !== null;
  }

  private saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save profile', e);
    }
  }
}
