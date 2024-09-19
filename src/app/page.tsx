import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Book, Gift, Star, Zap, Clock, Home, Coins } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SYMBOL_WEIGHTS = { "💎": 0.12, "🎁": 0.14, "🪩": 0.18, "❤️‍🔥": 0.24, "🍹": 0.36 };
const SYMBOLS = Object.entries(SYMBOL_WEIGHTS).flatMap(([s, w]) => Array(Math.round(w * 1000)).fill(s));
const PAYOUTS = { "💎💎💎": 50000, "🎁🎁🎁": 20000, "🪩🪩🪩": 10000, "❤️‍🔥❤️‍🔥❤️‍🔥": 5000, "🍹🍹🍹": 2500, "💎💎": 500, "🎁🎁": 400, "🪩🪩": 300, "❤️‍🔥❤️‍🔥": 200, "🍹🍹": 100 };
const REEL_SIZE = 20;
const MAX_SPINS_PER_DAY = 5;

const createReel = () => Array.from({ length: REEL_SIZE }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

const PartySlots = () => {
  const [reels, setReels] = useState([createReel(), createReel(), createReel()]);
  const [reelPositions, setReelPositions] = useState([0, 0, 0]);
  const [score, setScore] = useState(1000);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("");
  const [winAnimation, setWinAnimation] = useState(null);
  const [spinsLeft, setSpinsLeft] = useState(MAX_SPINS_PER_DAY);
  const [showRules, setShowRules] = useState(false);
  const [showPrizes, setShowPrizes] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [timeUntilNextSpin, setTimeUntilNextSpin] = useState(null);
  const [showRunningText, setShowRunningText] = useState(false);
  const [runningText, setRunningText] = useState("");
  const [runningTextColor, setRunningTextColor] = useState("#ff0000");
  const [glitchIntensity, setGlitchIntensity] = useState(1);

  const spinAudioRef = useRef(new Audio('/spin.mp3'));
  const winAudioRef = useRef(new Audio('/win.mp3'));
  const loseAudioRef = useRef(new Audio('/lose.mp3'));
  const runningTextRef = useRef(null);

  const rules = [
    { icon: <Home size={24} />, text: "Party Slots - мини-игра в дополнение к основной тапалке на странице 'Home'" },
    { icon: <Coins size={24} />, text: "Баланс единый с основной игрой, выигрыши сразу зачисляются на него" },
    { icon: <Star size={24} />, text: "Крутите слоты и выигрывайте монеты VNVNC!" },
    { icon: <Zap size={24} />, text: "У вас есть 5 бесплатных прокруток каждый день" },
    { icon: <Gift size={24} />, text: "Обменивайте монеты на реальные призы в клубе VNVNC" },
    { icon: <Clock size={24} />, text: "Прокрутки обновляются каждый день в полночь" },
  ];

  const prizes = [
    { name: 'Месяц бесплатных тусовок в VNVNC', quantity: 2, image: "/api/placeholder/100/100", description: "Целый месяц безлимитного веселья в лучшем клубе города!" },
    { name: 'VIP-депозит на 50.000 ₽', quantity: 2, image: "/api/placeholder/100/100", description: "Шикуй как король - твой личный депозит на любые напитки!" },
    { name: 'Шанс выступить на сцене с топовыми диджеями', quantity: 5, image: "/api/placeholder/100/100", description: "Стань звездой вечеринки, играя сет с лучшими диджеями!" },
    { name: 'Эксклюзивный мерч VNVNC', quantity: 10, image: "/api/placeholder/100/100", description: "Уникальная коллекция одежды, доступная только для игроков" },
    { name: 'Скидка 50% на следующую вечеринку', quantity: 100, image: "/api/placeholder/100/100", description: "Отрывайся на полную катушку за полцены!" },
  ];

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    if (spinsLeft === 0) {
      const interval = setInterval(() => {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const timeLeft = tomorrow - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        setTimeUntilNextSpin(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [spinsLeft]);

  const calculateWin = (result) => {
    const resultString = result.join("");
    if (PAYOUTS[resultString]) return PAYOUTS[resultString];
    if (result[0] === result[1]) return PAYOUTS[`${result[0]}${result[0]}`] || 0;
    if (result[1] === result[2]) return PAYOUTS[`${result[1]}${result[2]}`] || 0;
    return 0;
  };

  const getWinMessage = (win) => {
    if (win === 0) return "ПОПРОБУЙ ЕЩЕ РАЗ ";
    if (win <= 200) return "НЕПЛОХО ";
    if (win <= 400) return "СУПЕР ";
    if (win === 500) return "ПЯТИХАТ ";
    if (win === 2500) return "NANO JACKPOT ";
    if (win === 5000) return "MINI JACKPOT ";
    if (win === 10000) return "JACKPOT, BABY ";
    if (win === 20000) return "SUPER JACKPOT ";
    if (win === 50000) return "А".repeat(1000);
    return "BIG WIN ";
  };

  const getWinColor = (win) => {
    if (win === 0) return "#ff0000";
    if (win <= 200) return "#00ff00";
    if (win <= 500) return "#00ff80";
    if (win <= 2500) return "#00ffff";
    if (win <= 10000) return "#0080ff";
    return "#0000ff";
  };

  const getGlitchIntensity = (win) => {
    if (win <= 500) return 1;
    if (win <= 2500) return 2;
    if (win <= 10000) return 3;
    return 4;
  };

  const playWinAnimation = (win) => {
    if (win >= 50000) setWinAnimation('jackpot');
    else if (win >= 10000) setWinAnimation('major');
    else if (win >= 1000) setWinAnimation('big');
    else setWinAnimation('small');
    
    setShowRunningText(true);
    setRunningText(getWinMessage(win));
    setRunningTextColor(getWinColor(win));
    setGlitchIntensity(getGlitchIntensity(win));

    if (runningTextRef.current) {
      runningTextRef.current.style.animation = 'none';
      runningTextRef.current.offsetHeight; // Форсируем reflow
      runningTextRef.current.style.animation = 'marquee 15s linear infinite';
    }
  };

  const spin = useCallback(() => {
    if (spinning || spinsLeft <= 0) return;
    spinAudioRef.current.play();
    setSpinning(true);
    setMessage("");
    setWinAnimation(null);
    setShowRunningText(false);
    setSpinsLeft(prevSpins => prevSpins - 1);
    const newReels = [createReel(), createReel(), createReel()];
    const spinDuration = 2000;
    const intervalDuration = 50;
    let elapsed = 0;
    const spinInterval = setInterval(() => {
      elapsed += intervalDuration;
      setReelPositions(prevPositions => prevPositions.map(pos => (pos + 0.5) % REEL_SIZE));
      if (elapsed >= spinDuration) {
        clearInterval(spinInterval);
        setReels(newReels);
        setReelPositions([0, 0, 0]);
        setSpinning(false);
        const result = newReels.map(reel => reel[0]);
        const win = calculateWin(result);
        if (win > 0) {
          setScore(prevScore => prevScore + win);
        } else {
          loseAudioRef.current.play();
        }
        setMessage(`ВЫИГРЫШ: ${win.toLocaleString('ru-RU')}`);
        playWinAnimation(win);
      }
    }, intervalDuration);
  }, [spinning, spinsLeft]);

  const getVisibleSymbols = (reelIndex) => {
    const position = reelPositions[reelIndex];
    const reel = reels[reelIndex];
    return [
      reel[(Math.floor(position) - 1 + REEL_SIZE) % REEL_SIZE],
      reel[Math.floor(position) % REEL_SIZE],
      reel[(Math.floor(position) + 1) % REEL_SIZE],
    ];
  };

  const clearMessage = () => {
    if (!spinning) {
      setMessage("");
      setWinAnimation(null);
      setShowRunningText(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 min-h-screen flex flex-col items-center text-white p-4 overflow-hidden" onClick={clearMessage}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/party-background.jpg')] bg-cover opacity-10 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-800 to-indigo-900 opacity-70"></div>
        <div className="absolute inset-0 bg-[url('/neon-lights.png')] bg-repeat animate-slide"></div>
      </div>
      <div className="w-full max-w-lg flex-col flex gap-4 mx-auto rounded-xl shadow-lg overflow-hidden p-4 z-10 backdrop-blur-md bg-white bg-opacity-10 relative">
        <h2 className="text-3xl font-bold text-center text-yellow-500 mb-4 mt-2 font-['Press_Start_2P'] glitch-slow whitespace-nowrap" data-text="PARTY SLOTS">PARTY SLOTS</h2>
        <div className="text-center mb-2 flex justify-between items-center">
          <div className="flex items-center">
            <Star className="w-6 h-6 text-yellow-400 mr-1" />
            <p className="text-2xl font-bold">{score.toLocaleString('ru-RU')}</p>
          </div>
          <div className="flex items-center">
            <Zap className="w-6 h-6 text-blue-400 mr-1" />
            <p className="text-2xl font-bold">{spinsLeft}/{MAX_SPINS_PER_DAY}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-lg p-4 relative bg-opacity-70 shadow-inner">
          <div className="flex justify-around mb-4 relative overflow-hidden h-40">
            {[0, 1, 2].map(reelIndex => (
              <div key={reelIndex} className="w-1/3 overflow-hidden h-full relative">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-10"></div>
                <div className="absolute top-0 left-0 w-full transition-transform duration-100 ease-linear"
                     style={{transform: `translateY(${-(reelPositions[reelIndex] % 1) * 100}%)`}}>
                  {getVisibleSymbols(reelIndex).map((symbol, i) => (
                    <div key={i} className="text-5xl h-[3.33rem] flex items-center justify-center"
                         style={{opacity: i === 1 ? 1 : 0.5}}>
                      {symbol}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[3.33rem] border-t-4 border-b-4 border-yellow-400 bg-yellow-400 bg-opacity-20">
              </div>
            </div>
          </div>
          <button 
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold py-3 px-4 rounded-lg transform transition duration-200 hover:scale-105 disabled:opacity-50 text-xl relative shadow-lg font-['Press_Start_2P']"
            onClick={spin}
            disabled={spinning || spinsLeft <= 0}
            style={{
              textShadow: '2px 2px 0px #ff0000,-2px -2px 0px #ff0000, 2px -2px 0px #ff0000, -2px 2px 0px #ff0000',
            }}
          >
            {spinning ? 'КРУТИМ...' : spinsLeft > 0 ? (
              <>
                КРУТИТЬ <span className="text-2xl ml-2">🎰</span>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <Clock className="mr-2" />
                {timeUntilNextSpin}
              </div>
            )}
          </button>
        </div>
        
        <div className="flex justify-between gap-2 mb-2">
          <button
            onClick={() => setShowRules(true)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg transform transition duration-200 hover:scale-105 flex items-center justify-center shadow-md"
          >
            <Book className="w-5 h-5 mr-2" />
            Правила
          </button>
          <button
            onClick={() => setShowPrizes(true)}
            className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg transform transition duration-200 hover:scale-105 flex items-center justify-center shadow-md"
          >
            <Gift className="w-5 h-5 mr-2" />
            Призы
          </button>
        </div>
        
        <div className="bg-black bg-opacity-30 p-2 rounded-lg relative">
          <h3 className="text-lg font-bold mb-1 text-yellow-400">Таблица комбинаций:</h3>
          <div className="grid grid-cols-5 gap-1 text-xs">
            {Object.entries(PAYOUTS).map(([combo, payout]) => (
              <div key={combo} className="flex flex-col items-center bg-white bg-opacity-10 p-1 rounded">
                <span>{combo}</span>
                <span className={`font-bold text-yellow-400 ${payout >= 2500 ? 'text-base' : ''}`}>
                  {payout.toLocaleString('ru-RU')}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <Alert variant="info" className="bg-blue-900 border-blue-400 text-white text-xs">
          <AlertDescription>
            Крути барабан, копи коины на едином балансе Coinmania, обменивай их на реальные призы. Чем больше играешь, тем больше шансов на джекпот!
          </AlertDescription>
        </Alert>
        
        {showRunningText && (
          <div className="absolute left-0 right-0 bg-black bg-opacity-30 overflow-hidden z-20" 
               style={{top: 'calc(100% - 310px)', bottom: '4px', height: '320px'}}>
            <div className="relative w-full h-full">
              <div ref={runningTextRef} className="absolute inset-0 whitespace-nowrap font-['Press_Start_2P'] text-7xl flex items-center running-text-container"
                   style={{color: runningTextColor}}>
                <span className={`inline-block ${glitchIntensity > 1 ? 'glitch-intense' : ''} ${glitchIntensity > 2 ? 'flame-text' : ''} neon-text`}
                      style={{animationDuration: `${5 - glitchIntensity}s`}}>
                  {runningText.repeat(130)}
                </span>
              </div>
              <div className="absolute inset-0 bg-black opacity-15"></div>
            </div>
          </div>
        )}
      </div>
      
      {(message || showRunningText) && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
          <div className="bg-black bg-opacity-0 px-14 py-5 rounded-xl backdrop-blur-md">
            <div className="text-4xl font-['Press_Start_2P'] glitch text-center" data-text={message} style={{
              color: message.includes("ВЫИГРЫШ: 0") ? '#ff0000' : '#ffd700',
              textShadow: '2px 2px 0px #ff00de, -2px -2px 0px #00ff9f',
              animation: 'glitch 1s linear infinite alternate-reverse',
            }}>
              {message}
            </div>
          </div>
        </div>
      )}
      
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="bg-gradient-to-r from-green-800 to-blue-800 p-6 rounded-xl shadow-lg max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-yellow-400">Правила игры</DialogTitle>
          </DialogHeader>
          <DialogClose className="absolute right-4 top-4 text-gray-400 hover:text-white" />
          <div className="text-white">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center space-x-4 bg-white bg-opacity-10 p-4 rounded-xl hover:bg-opacity-20 transition-all duration-300 mb-2">
                <div className="text-yellow-400 bg-yellow-400 bg-opacity-20 p-2 rounded-full">{rule.icon}</div>
                <p className="text-sm flex-grow">{rule.text}</p>
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full bg-yellow-400 text-black font-bold py-2 px-4 rounded"
            onClick={() => setShowRules(false)}
          >
            Понятно
          </button>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showPrizes} onOpenChange={setShowPrizes}>
        <DialogContent className="bg-gradient-to-r from-green-800 to-blue-800 p-6 rounded-xl shadow-lg max-w-md mx-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-center text-yellow-400">Призы</DialogTitle>
          </DialogHeader>
          <DialogClose className="absolute right-4 top-4 text-gray-400 hover:text-white" />
          <div className="grid grid-cols-2 gap-4">
            {prizes.map((prize, index) => (
              <div 
                key={index} 
                className="bg-white bg-opacity-10 rounded-xl p-3 flex flex-col items-center hover:bg-opacity-20 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedPrize(prize)}
              >
                <div className="relative w-full h-20 mb-2">
                  <img src={prize.image} alt={prize.name} className="w-full h-full object-cover rounded-lg" />
                  <div className="absolute top-1 right-1 bg-yellow-500 text-black font-bold py-1 px-2 rounded-full text-xs">
                    {prize.quantity}
                  </div>
                </div>
                <h3 className="text-xs font-semibold text-center line-clamp-2 mb-1">{prize.name}</h3>
                <p className="text-yellow-400 text-center text-xs">
                  <span className="blur-[3px]">???</span> <span className="blur-none">🪙</span>
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {selectedPrize && (
        <Dialog open={!!selectedPrize} onOpenChange={() => setSelectedPrize(null)}>
          <DialogContent className="bg-gradient-to-r from-green-800 to-blue-800 p-6 rounded-xl shadow-lg max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-yellow-400">{selectedPrize.name}</DialogTitle>
            </DialogHeader>
            <DialogClose className="absolute right-4 top-4 text-gray-400 hover:text-white" />
            <div className="mt-4">
              <img src={selectedPrize.image} alt={selectedPrize.name} className="w-full h-48 object-cover rounded-lg mb-4" />
              <p className="text-sm mb-4 text-white">{selectedPrize.description}</p>
              <div className="flex justify-between items-center">
                <p className="text-yellow-400 font-bold">
                  Стоимость: <span className="blur-[3px]">???</span> <span className="blur-none">🪙</span>
                </p>
                <p className="text-sm text-white">Осталось: {selectedPrize.quantity}</p>
              </div>
              <button className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-2 px-4 rounded-full opacity-50 cursor-not-allowed">
                Скоро
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      <style jsx global>{`
        @keyframes glitch {
          0% {
            text-shadow: 2px 2px 0px #ff00de, -2px -2px 0px #00ff9f;
          }
          25% {
            text-shadow: -2px 2px 0px #ff00de, 2px -2px 0px #00ff9f;
          }
          50% {
            text-shadow: 2px -2px 0px #ff00de, -2px 2px 0px #00ff9f;
          }
          75% {
            text-shadow: -2px -2px 0px #ff00de, 2px 2px 0px #00ff9f;
          }
          100% {
            text-shadow: 2px 2px 0px #ff00de, -2px -2px 0px #00ff9f;
          }
        }
        @keyframes glitch-slow {
          0% {
            text-shadow: 2px 2px 0px #ff00de, -2px -2px 0px #00ff9f;
          }
          50% {
            text-shadow: -2px 2px 0px #ff00de, 2px -2px 0px #00ff9f;
          }
          100% {
            text-shadow: 2px 2px 0px #ff00de, -2px -2px 0px #00ff9f;
          }
        }
        .glitch-slow {
          animation: glitch-slow 3s linear infinite alternate-reverse;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .running-text-container {
          width: 200%;
          animation: marquee 5s linear infinite;
        }
        @keyframes glitch-intense {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(-2px, 2px);
          }
          40% {
            transform: translate(-2px, -2px);
          }
          60% {
            transform: translate(2px, 2px);
          }
          80% {
            transform: translate(2px, -2px);
          }
          100% {
            transform: translate(0);
          }
        }
        .glitch-intense {
          animation: glitch-intense 0.3s linear infinite;
        }
        @keyframes flame {
          0%, 100% {
            text-shadow: 0 -0.05em 0.2em #FFF, 0 -0.1em 0.3em #FF0, 0 -0.2em 0.4em #FF0, 0 -0.3em 0.6em #F90, 0 -0.4em 0.8em #F20;
          }
          25%, 75% {
            text-shadow: 0 -0.05em 0.2em #FFF, 0 -0.1em 0.3em #FD0, 0 -0.2em 0.4em #FD0, 0 -0.3em 0.6em #F90, 0 -0.4em 0.8em #F20;
          }
          50% {
            text-shadow: 0 -0.05em 0.2em #FFF, 0 -0.1em 0.3em #FF0, 0 -0.2em 0.4em #FF0, 0 -0.3em 0.6em #FA0, 0 -0.4em 0.8em #F30;
          }
        }
        .flame-text {
          animation: flame 2s linear infinite;
        }
        .neon-text {
          text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #ff00de, 0 0 35px #ff00de, 0 0 40px #ff00de, 0 0 50px #ff00de, 0 0 75px #ff00de;
        }
      `}</style>
    </div>
  );
};

export default PartySlots;