import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { WelcomeModalComponent } from '../../shared/components/welcome-modal/welcome-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, WelcomeModalComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  showModal = false;
  profile: UserProfile | null = null;

  stats = [
    { value: '38', label: 'Lecciones Interactivas', icon: '📚' },
    { value: '2', label: 'Lenguajes de Programación', icon: '💻' },
    { value: '4', label: 'Niveles de Dificultad', icon: '🎯' },
    { value: '100%', label: 'Gratuito y Sin Registro', icon: '🆓' },
  ];

  features = [
    {
      icon: '▶',
      title: 'Editor con Ejecución Real',
      desc: 'Escribe y ejecuta código Java o C# directamente en el navegador. La IA simula el compilador al instante.'
    },
    {
      icon: '🤖',
      title: 'Revisión con Inteligencia Artificial',
      desc: 'Nuestro asistente de IA (Llama 3.3) revisa tu código, detecta errores y te da retroalimentación personalizada.'
    },
    {
      icon: '🗺️',
      title: 'Ruta de Aprendizaje Guiada',
      desc: 'Desde variables hasta Patrones de Diseño avanzados. Un camino estructurado de cero a experto.'
    },
    {
      icon: '💡',
      title: 'Pistas Progresivas',
      desc: 'Nunca te quedarás atascado. Pide pistas graduales que te guían sin darte la respuesta directamente.'
    },
  ];

  courses = [
    {
      id: 'java',
      name: 'Java',
      icon: '☕',
      color: '#f89820',
      description: 'El lenguaje más popular para el desarrollo empresarial y Android.',
      lessons: 19,
      levels: ['Básico', 'Intermedio', 'Avanzado', 'Patrones']
    },
    {
      id: 'csharp',
      name: 'C#',
      icon: '#️⃣',
      color: '#9b4f96',
      description: 'El lenguaje del ecosistema .NET, ideal para apps de escritorio, web y videojuegos.',
      lessons: 19,
      levels: ['Básico', 'Intermedio', 'Avanzado', 'Patrones']
    }
  ];

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.profile = this.profileService.getProfile();
    if (!this.profile) {
      // Delay slightly so the hero renders first, then modal appears
      setTimeout(() => { this.showModal = true; }, 600);
    } else {
      this.profileService.updateLastActive();
    }
  }

  onProfileCreated(name: string) {
    this.showModal = false;
    this.profile = this.profileService.getProfile();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
