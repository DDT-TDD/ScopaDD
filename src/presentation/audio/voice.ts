// Voice speech synthesis disabled per kid/family privacy and pronunciation accuracy standards.
// Audio feedback is delivered via high-fidelity sound effects in audio.ts.
export const voiceManager = {
  getEnabled: () => false,
  setEnabled: (_enabled: boolean) => {},
  speak: (_text: string) => {},
};
