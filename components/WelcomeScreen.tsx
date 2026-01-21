
import React, { useEffect, useState } from 'react';

interface WelcomeScreenProps {
  onNext: () => void;
}

const TARGET_DATE = new Date('2026-01-21T23:00:00+07:00');

const getTimeLeft = () => {
  const now = Date.now();
  const diff = Math.max(TARGET_DATE.getTime() - now, 0);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { total: diff, days, hours, minutes, seconds };
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUnit = (value: number) => value.toString().padStart(2, '0');
  const isClosed = timeLeft.total <= 0;
  const countdownLabel = timeLeft.total <= 0
    ? 'LIVE NOW'
    : `${timeLeft.days}D ${formatUnit(timeLeft.hours)}H ${formatUnit(timeLeft.minutes)}M ${formatUnit(timeLeft.seconds)}S`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter bg-green-500 text-black px-4 py-2 inline-block transform -rotate-1">
          JUNGLE PROTOCOL
        </h1>
        <p className="text-pink-500 text-xs tracking-widest font-bold uppercase">// ESTABLISHED_SINCE_BEFORE_YOU</p>
      </div>

      <div
        className={`relative group w-48 h-48 md:w-64 md:h-64 ${isClosed ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        onClick={isClosed ? undefined : onNext}
      >
        <div className="absolute inset-0 bg-pink-500 transform rotate-3"></div>
        <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black p-1 text-[10px] font-black border-2 border-black">LIVE_FEED</div>
      </div>

      <div className="space-y-4 max-w-sm text-center">
        <p className="text-xs md:text-sm font-bold leading-relaxed">
          The ritual has begun. Prove your spirit on the timeline. Collect rewards. 
          Become eternal in the $MONKY ecosystem.
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-green-500/50 uppercase font-bold">Estimated time: ~60 SECONDS</p>
          <p className="text-[10px] text-green-500/50 uppercase font-bold">No wallet connect required</p>
        </div>
        <div className={`bg-black/50 border px-3 py-2 text-[10px] uppercase font-bold ${isClosed ? 'border-red-500/60' : 'border-green-500/40'}`}>
          <p className={isClosed ? 'text-red-400' : 'text-green-500/60'}>
            {isClosed ? 'Presale closed' : 'Countdown: Wed 21 • 11 PM'}
          </p>
          <p className={`tracking-widest text-base ${isClosed ? 'text-red-300' : 'text-green-400'}`}>
            {isClosed ? 'CLOSED' : countdownLabel}
          </p>
        </div>
      </div>

      <button 
        onClick={onNext}
        disabled={isClosed}
        className={`w-full max-w-xs py-4 font-black text-2xl transition-all transform border-b-4
          ${isClosed
            ? 'bg-gray-600 text-gray-200 border-gray-700 cursor-not-allowed'
            : 'bg-green-500 text-black hover:bg-white hover:scale-105 active:scale-95 border-green-900'
          }`}
      >
        {isClosed ? 'PRESALE CLOSED' : 'I N I T I A T E'}
      </button>

      <button className="text-[10px] underline uppercase font-bold opacity-50 hover:opacity-100">
        [ WHAT IS MONKY? ]
      </button>
    </div>
  );
};

export default WelcomeScreen;
