import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

const DEVICE_IP = '192.168.0.20';
const OPEN_DURATION = 7;

type DoorState = 'idle' | 'opening' | 'open';

export default function Index() {
  const [connected] = useState(true);
  const [doorState, setDoorState] = useState<DoorState>('idle');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleOpen = () => {
    if (doorState !== 'idle') return;
    setDoorState('opening');

    setTimeout(() => {
      setDoorState('open');
      setCountdown(OPEN_DURATION);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setDoorState('idle');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1200);
  };

  const isBusy = doorState !== 'idle';
  const progress = doorState === 'open' ? countdown / OPEN_DURATION : 1;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-between py-12 px-6 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <header className="w-full max-w-md flex items-center justify-between animate-fade-in z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center">
            <Icon name="DoorOpen" size={20} className="text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Домофон</p>
            <p className="text-xs text-muted-foreground leading-tight">Управление дверью</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-destructive'}`} />
          {connected ? 'На связи' : 'Нет связи'}
        </div>
      </header>

      <main className="flex flex-col items-center gap-12 z-10">
        <div className="relative flex items-center justify-center w-72 h-72">
          {doorState === 'open' && (
            <>
              <span className="absolute inset-0 rounded-full border border-emerald-400/40 animate-ring-pulse" />
              <span className="absolute inset-0 rounded-full border border-emerald-400/30 animate-ring-pulse [animation-delay:0.6s]" />
            </>
          )}

          <span className={`absolute w-56 h-56 rounded-full blur-2xl transition-colors duration-700 ${doorState === 'open' ? 'bg-emerald-500/40' : 'bg-primary/20'} ${!isBusy ? 'animate-breathe' : ''}`} />

          <button
            onClick={handleOpen}
            disabled={isBusy || !connected}
            className={`relative w-52 h-52 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-500 active:scale-95 disabled:cursor-not-allowed
              ${doorState === 'open'
                ? 'bg-emerald-500 text-white shadow-[0_0_60px_-10px] shadow-emerald-500/60'
                : 'bg-foreground text-background shadow-2xl hover:scale-[1.03]'}`}
          >
            {doorState === 'opening' ? (
              <>
                <Icon name="LoaderCircle" size={48} className="animate-spin-slow" />
                <span className="text-base font-semibold">Открываю…</span>
              </>
            ) : doorState === 'open' ? (
              <>
                <span className="text-6xl font-extrabold tabular-nums">{countdown}</span>
                <span className="text-sm font-medium opacity-90">Дверь открыта</span>
              </>
            ) : (
              <>
                <Icon name="Fingerprint" size={52} />
                <span className="text-lg font-bold">Открыть</span>
              </>
            )}
          </button>
        </div>

        <div className="h-1.5 w-56 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${doorState === 'open' ? 'bg-emerald-400 duration-1000 ease-linear' : 'bg-foreground/40 duration-300'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {doorState === 'idle' && 'Нажмите кнопку, чтобы открыть дверь'}
          {doorState === 'opening' && 'Отправляю команду на домофон'}
          {doorState === 'open' && `Дверь закроется через ${countdown} сек.`}
        </p>
      </main>

      <footer className="w-full max-w-md flex items-center justify-between text-xs text-muted-foreground animate-fade-in z-10">
        <div className="flex items-center gap-2">
          <Icon name="Wifi" size={14} />
          <span>{DEVICE_IP}</span>
        </div>
        <span>Wirenboard</span>
      </footer>
    </div>
  );
}
