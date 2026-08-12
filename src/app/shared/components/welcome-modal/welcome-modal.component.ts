import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-welcome-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './welcome-modal.component.html',
  styleUrls: ['./welcome-modal.component.css']
})
export class WelcomeModalComponent {
  @Output() profileCreated = new EventEmitter<string>();

  name: string = '';
  error: string = '';

  constructor(private profileService: ProfileService) {}

  submit() {
    const trimmed = this.name.trim();
    if (!trimmed || trimmed.length < 2) {
      this.error = 'Por favor, ingresa al menos 2 caracteres.';
      return;
    }
    if (trimmed.length > 30) {
      this.error = 'El nombre no puede superar los 30 caracteres.';
      return;
    }
    this.error = '';
    this.profileService.createProfile(trimmed);
    this.profileCreated.emit(trimmed);
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') this.submit();
  }
}
