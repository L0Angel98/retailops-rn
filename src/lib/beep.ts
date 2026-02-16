import { useAudioPlayer } from "expo-audio";

export function useBeep() {
  const player = useAudioPlayer(
    require("../../assets/sounds/scanner-beep-sound.mp3"),
  );

  const beep = () => {
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

  return { beep };
}
