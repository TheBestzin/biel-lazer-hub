import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

function PaginaIntro() {
  const [toca, setToca] = useState(0);
  const video = useRef<HTMLVideoElement>(null);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white p-6">
      <div className="absolute right-6 top-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setToca((v) => v + 1);
            video.current?.play();
          }}
        >
          <RotateCcw className="size-4" aria-hidden />
          Repetir abertura
        </Button>
      </div>
      <video
        key={toca}
        ref={video}
        className="w-full max-w-2xl"
        src="/intro/abertura-biel.mp4"
        autoPlay
        muted
        playsInline
        aria-label="Animação de abertura — Área de Lazer Biel"
      />
    </main>
  );
}

export const Route = createFileRoute("/intro")({
  component: PaginaIntro,
  head: () => ({
    meta: [{ title: "Abertura — Área de Lazer Biel" }],
  }),
});
