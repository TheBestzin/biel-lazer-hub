import { useEffect, useState } from "react";

/**
 * Tela de abertura fullscreen exibida assim que o site abre.
 * Some com fade out suave quando a página termina de carregar.
 */
export function SplashScreen() {
  const [saindo, setSaindo] = useState(false);
  const [oculta, setOculta] = useState(false);

  useEffect(() => {
    let timeoutSaida: ReturnType<typeof setTimeout>;
    let timeoutRemocao: ReturnType<typeof setTimeout>;

    const encerrar = () => {
      timeoutSaida = setTimeout(() => {
        setSaindo(true);
        timeoutRemocao = setTimeout(() => setOculta(true), 700);
      }, 500);
    };

    if (document.readyState === "complete") {
      encerrar();
    } else {
      window.addEventListener("load", encerrar, { once: true });
    }

    return () => {
      window.removeEventListener("load", encerrar);
      clearTimeout(timeoutSaida);
      clearTimeout(timeoutRemocao);
    };
  }, []);

  if (oculta) return null;

  return (
    <div
      aria-hidden
      className={`splash-screen${saindo ? " splash-screen--saindo" : ""}`}
      role="presentation"
    >
      <div className="splash-screen__palco">
        <span className="splash-screen__halo" />
        <img
          src="/logo.png"
          alt=""
          width={160}
          height={160}
          className="splash-screen__logo"
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <p className="splash-screen__titulo">Área de Lazer Biel</p>
      <span className="splash-screen__barra" />
    </div>
  );
}
