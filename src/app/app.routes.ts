import { Routes } from '@angular/router';
import { LessonComponent } from './features/lesson/lesson.component';
import { LearningPathComponent } from './features/learning-path/learning-path.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'courses', component: LearningPathComponent },
  { path: 'lesson/:language/:level/:id', component: LessonComponent },
  { path: '**', redirectTo: '' }
];

