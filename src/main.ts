import './ui/style.css';
import { ScopaApp } from './ui/app';
import { audio } from './presentation/audio/audio';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app');
  if (!root) throw new Error('Root #app element not found');

  new ScopaApp(root);

  // Resume Web Audio on first user interaction
  const resumeAudio = () => {
    audio.play('click');
    window.removeEventListener('pointerdown', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('pointerdown', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
});
