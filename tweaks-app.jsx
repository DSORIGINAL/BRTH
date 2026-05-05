// Tweaks panel for Birthday Card

const { useState, useEffect } = React;

function TweaksApp() {
  const defaults = window.TWEAK_DEFAULTS || {};
  const [tweaks, setTweak] = window.useTweaks(defaults);

  // Wire to card
  useEffect(() => {
    if (!window.__card) return;
    window.__card.setRecipientName(tweaks.recipientName);
    window.__card.setFromName(tweaks.fromName);
    window.__card.setCandleCount(tweaks.candleCount);
    window.__card.setConfettiDensity(tweaks.confettiDensity);
  }, [tweaks]);

  return (
    <window.TweaksPanel title="Tweaks">
      <window.TweakSection label="Names">
        <window.TweakText
          label="For"
          value={tweaks.recipientName}
          onChange={(v) => setTweak('recipientName', v)}
        />
        <window.TweakText
          label="From"
          value={tweaks.fromName}
          onChange={(v) => setTweak('fromName', v)}
        />
      </window.TweakSection>

      <window.TweakSection label="Cake">
        <window.TweakSlider
          label="Candles"
          value={tweaks.candleCount}
          min={1} max={12} step={1}
          onChange={(v) => setTweak('candleCount', v)}
        />
      </window.TweakSection>

      <window.TweakSection label="Confetti">
        <window.TweakSlider
          label="Density"
          value={tweaks.confettiDensity}
          min={0.3} max={3} step={0.1}
          onChange={(v) => setTweak('confettiDensity', v)}
        />
        <window.TweakButton
          label="Burst now"
          onClick={() => window.__card?.burstConfetti(null, null, 150)}
        />
      </window.TweakSection>
    </window.TweaksPanel>
  );
}

// Mount
const tweaksRoot = document.createElement('div');
tweaksRoot.id = 'tweaks-root';
document.body.appendChild(tweaksRoot);
ReactDOM.createRoot(tweaksRoot).render(<TweaksApp />);
