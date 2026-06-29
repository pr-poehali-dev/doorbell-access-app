import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

const DEVICE_IP = '192.168.0.20';
const OPEN_DURATION = 7;
const BASE = `http://${DEVICE_IP}`;

type DoorState = 'idle' | 'opening' | 'open';

async function wirenboardLogin(login: string, password: string): Promise<void> {
  const body = new URLSearchParams({ login, password });
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`auth ${res.status}`);
}

async function wirenboardPassage(): Promise<void> {
  const res = await fetch(`${BASE}/server/run_passage.lua`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idx: '1' }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`passage ${res.status}`);
}

export default function Index() {
  const [login, setLogin] = useState(() => localStorage.getItem('wb_login') ?? '');
  const [password, setPassword] = useState(() => localStorage.getItem('wb_password') ?? '');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [connected, setConnected] = useState(true);
  const [doorState, setDoorState] = useState<DoorState>('idle');
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      await wirenboardLogin(login, password);
      localStorage.setItem('wb_login', login);
      localStorage.setItem('wb_password', password);
      setAuthed(true);
    } catch {
      setLoginError('Неверный логин или пароль, либо домофон недоступен.');
    } finally {
      setLoggingIn(false);
    }
  };

  const startCountdown = () => {
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
  };

  const handleOpen = async () => {
    if (doorState !== 'idle') return;
    setErrorMsg('');
    setDoorState('opening');
    try {
      await wirenboardPassage();
      setConnected(true);
      startCountdown();
    } catch {
      try {
        await wirenboardLogin(login, password);
        await wirenboardPassage();
        setConnected(true);
        startCountdown();
      } catch {
        setConnected(false);
        setErrorMsg('Не удалось связаться с домофоном. Убедитесь, что телефон в той же Wi-Fi сети.');
        setDoorState('idle');
      }
    }
  };

  const isBusy = doorState !== 'idle';
  const progress = doorState === 'open' ? countdown / OPEN_DURATION : 1;

  if (!authed) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="w-full max-w-sm z-10 animate-fade-in">
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-3xl bg-secondary flex items-center justify-center">
              <Icon name="DoorOpen" size={28} className="text-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Домофон</h1>
            <p className="text-sm text-muted-foreground">Войдите, чтобы управлять дверью</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="root"
                autoComplete="username"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition"
              />
            </div>

            {loginError && (
              <p className="text-destructive text-xs flex items-center gap-1.5">
                <Icon name="TriangleAlert" size={13} />
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn || !login}
              className="mt-2 w-full bg-foreground text-background rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition hover:opacity-90 active:scale-[0.98]"
            >
              {loggingIn ? <Icon name="LoaderCircle" size={18} className="animate-spin-slow" /> : <Icon name="LogIn" size={18} />}
              {loggingIn ? 'Вхожу…' : 'Войти'}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Убедитесь, что телефон подключён к той же Wi-Fi сети, что и домофон
          </p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-destructive'}`} />
            {connected ? 'На связи' : 'Нет связи'}
          </div>
          <button
            onClick={() => { setAuthed(false); localStorage.removeItem('wb_password'); }}
            className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition"
          >
            <Icon name="LogOut" size={15} />
          </button>
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
            disabled={isBusy}
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

        <p className="text-sm text-muted-foreground text-center max-w-xs min-h-[2.5rem]">
          {errorMsg ? (
            <span className="text-destructive flex items-center justify-center gap-1.5">
              <Icon name="TriangleAlert" size={14} />
              {errorMsg}
            </span>
          ) : (
            <>
              {doorState === 'idle' && 'Нажмите кнопку, чтобы открыть дверь'}
              {doorState === 'opening' && 'Отправляю команду на домофон'}
              {doorState === 'open' && `Дверь закроется через ${countdown} сек.`}
            </>
          )}
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