import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  GameStats,
  ActivePowerUp,
  Character,
  PlayerSkin,
  DEFAULT_SKINS,
  PlayerInventory,
  Mission,
  AudioSettings,
  PowerUpUpgrades,
  DEFAULT_UPGRADES,
  CHARACTERS,
  INITIAL_MISSIONS,
  LeaderboardEntry,
  DEFAULT_LEADERBOARD,
  DailyStreakState,
} from './types/game';
import { GameEngine } from './game/gameEngine';
import { soundSynth } from './audio/soundSynth';
import { GameHUD } from './components/GameHUD';
import { MainMenu } from './components/MainMenu';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { MissionsModal } from './components/MissionsModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { DailyBonusModal } from './components/DailyBonusModal';
import { MysteryBoxModal } from './components/MysteryBoxModal';
import { UpgradesModal } from './components/UpgradesModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ShopModal, ShopCategory } from './components/ShopModal';
import { LoadingScreen } from './components/LoadingScreen';
import { MultiplayerModal, MultiplayerStage } from './components/MultiplayerModal';
import { webrtcService } from './services/webrtcService';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Persistent Game State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('subway_dash_highscore') || '0', 10);
  });
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    return parseInt(localStorage.getItem('subway_dash_total_coins') || '1500', 10);
  });

  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('subway_dash_player_name') || 'You';
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('subway_dash_leaderboard');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_LEADERBOARD;
  });

  const [dailyStreak, setDailyStreak] = useState<DailyStreakState>(() => {
    const saved = localStorage.getItem('subway_dash_daily_streak');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const todayStr = new Date().toISOString().slice(0, 10);
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (parsed.lastClaimDate !== todayStr && parsed.lastClaimDate !== yesterdayStr) {
          return { currentStreak: 1, lastClaimDate: parsed.lastClaimDate || '', claimedDays: [] };
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    return { currentStreak: 1, lastClaimDate: '', claimedDays: [] };
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const canClaimDaily = dailyStreak.lastClaimDate !== todayStr;
  const [showDailyBonus, setShowDailyBonus] = useState<boolean>(canClaimDaily);

  const [upgrades, setUpgrades] = useState<PowerUpUpgrades>(() => {
    const saved = localStorage.getItem('subway_dash_upgrades');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_UPGRADES;
  });

  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('subway_dash_unlocked_chars');
    if (saved) {
      try {
        const unlockedIds: string[] = JSON.parse(saved);
        return CHARACTERS.map(c => ({
          ...c,
          unlocked: unlockedIds.includes(c.id) || c.price === 0,
        }));
      } catch {
        // fallback
      }
    }
    return CHARACTERS;
  });

  const [selectedCharId, setSelectedCharId] = useState<string>(() => {
    return localStorage.getItem('subway_dash_selected_char') || 'roy';
  });

  // Skins State (Shop Outfits)
  const [skins, setSkins] = useState<PlayerSkin[]>(() => {
    const saved = localStorage.getItem('subway_dash_unlocked_skins');
    if (saved) {
      try {
        const unlockedIds: string[] = JSON.parse(saved);
        return DEFAULT_SKINS.map(s => ({
          ...s,
          unlocked: unlockedIds.includes(s.id) || s.price === 0,
        }));
      } catch {
        // fallback
      }
    }
    return DEFAULT_SKINS;
  });

  const [selectedSkinId, setSelectedSkinId] = useState<string>(() => {
    return localStorage.getItem('subway_dash_selected_skin') || 'skin_default';
  });

  // Mystery Box Inventory State (Free Revives & 24h 2x Multiplier)
  const [inventory, setInventory] = useState<PlayerInventory>(() => {
    const saved = localStorage.getItem('subway_dash_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return { freeRevives: 0, multiplier24hUntil: 0 };
  });

  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem('subway_dash_missions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_MISSIONS;
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem('subway_dash_audio');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return { soundEnabled: true, musicEnabled: true, volume: 0.5 };
  });

  // Active Run State
  const [currentStats, setCurrentStats] = useState<GameStats>({
    score: 0,
    highScore,
    coins: 0,
    totalCoins,
    distance: 0,
    speed: 18,
    speedLevel: 1,
    combo: 0,
    maxCombo: 0,
    powerUpsCollected: 0,
    nearMisses: 0,
    newHighScore: false,
    weather: 'CLEAR',
    theme: 'SUNNY_CITY',
    isSkateboardActive: false,
  });

  const [canRevive, setCanRevive] = useState<boolean>(true);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [comboMessage, setComboMessage] = useState<string | null>(null);
  const [nearMissMessage, setNearMissMessage] = useState<string | null>(null);
  const [themeAlert, setThemeAlert] = useState<string | null>(null);
  const [inGameMissionAlert, setInGameMissionAlert] = useState<string | null>(null);

  // Modals visibility
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopInitialTab, setShopInitialTab] = useState<ShopCategory>('CHARACTERS');
  const [showCharModal, setShowCharModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [showUpgradesModal, setShowUpgradesModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChaseActive, setIsChaseActive] = useState(false);
  const [isScreenFaded, setIsScreenFaded] = useState(false);

  // WebRTC Peer-to-Peer Multiplayer State
  const [isMultiplayerMatch, setIsMultiplayerMatch] = useState<boolean>(false);
  const isMultiplayerMatchRef = useRef<boolean>(false);
  useEffect(() => {
    isMultiplayerMatchRef.current = isMultiplayerMatch;
  }, [isMultiplayerMatch]);

  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);
  const [mpStage, setMpStage] = useState<MultiplayerStage>('MENU');
  const [mpCountdown, setMpCountdown] = useState<number>(3);
  const [mpRoomCode, setMpRoomCode] = useState<string | null>(null);
  const [mpSharedSeed, setMpSharedSeed] = useState<number | null>(null);
  const [mpErrorMessage, setMpErrorMessage] = useState<string | null>(null);
  const [mpIsConnecting, setMpIsConnecting] = useState<boolean>(false);
  const [mpInitialJoinCode, setMpInitialJoinCode] = useState<string>('');
  const [mpOpponent, setMpOpponent] = useState<{
    name: string;
    charId: string;
    dist: number;
    score: number;
    crashed?: boolean;
  } | null>(null);
  const [mpWinner, setMpWinner] = useState<'PLAYER' | 'OPPONENT' | 'TIE' | null>(null);
  const [mpWinReason, setMpWinReason] = useState<string | null>(null);
  const [lanRooms, setLanRooms] = useState<Array<{ code: string; hostName: string }>>([]);
  const countdownIntervalRef = useRef<number | null>(null);

  const mpOpponentRef = useRef(mpOpponent);
  useEffect(() => {
    mpOpponentRef.current = mpOpponent;
  }, [mpOpponent]);

  // Combo Popup Handler
  const handleComboMessage = useCallback((text: string) => {
    setComboMessage(text);
    setTimeout(() => {
      setComboMessage(null);
    }, 1400);
  }, []);

  // In-Game Mini Mission Complete Handler
  const handleInGameMissionComplete = useCallback((_title: string, bonusMult: number) => {
    setInGameMissionAlert(`+500 PTS! Multiplier +${bonusMult}x`);
    setTimeout(() => {
      setInGameMissionAlert(null);
    }, 2800);
  }, []);

  // Auto-open Join Room if URL contains ?room=123456
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && /^\d{6}$/.test(roomParam.trim())) {
      setMpInitialJoinCode(roomParam.trim());
      setIsMultiplayerMatch(true);
      setMpStage('JOIN_INPUT');
      setShowMultiplayerModal(true);
      setShowDailyBonus(false);
    }
  }, []);

  // WebRTC Peer-to-Peer Event Handlers
  useEffect(() => {
    webrtcService.init({
      onHostCodeGenerated: code => {
        setMpRoomCode(code);
        setMpErrorMessage(null);
      },
      onOpponentConnected: opponent => {
        setMpIsConnecting(false);
        setMpErrorMessage(null);
        setMpOpponent({
          name: opponent.name,
          charId: opponent.charId,
          dist: 0,
          score: 0,
          crashed: false,
        });
      },
      onRaceStart: seed => {
        setMpIsConnecting(false);
        setMpSharedSeed(seed);
        setMpWinner(null);
        setMpWinReason(null);
        setMpStage('COUNTDOWN');
        setMpCountdown(3);

        const oppInfo = webrtcService.opponentInfo || { name: 'Rival', charId: 'maya' };
        setMpOpponent({
          name: oppInfo.name,
          charId: oppInfo.charId,
          dist: 0,
          score: 0,
          crashed: false,
        });

        if (engineRef.current) {
          engineRef.current.setSeed(seed);
          engineRef.current.spawnOpponent(oppInfo.charId, oppInfo.name);
          engineRef.current.resetGame();
        }

        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }

        let count = 3;
        countdownIntervalRef.current = window.setInterval(() => {
          count -= 1;
          setMpCountdown(count);

          if (count <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setTimeout(() => {
              setShowMultiplayerModal(false);
              setGameState('PLAYING');
              if (engineRef.current) {
                engineRef.current.start();
              }
              if (audioSettings.musicEnabled) {
                soundSynth.startMusic();
              }
            }, 600);
          }
        }, 1000);
      },
      onOpponentUpdate: data => {
        if (engineRef.current) {
          engineRef.current.updateOpponent(data);
        }
        setMpOpponent(prev => (prev ? { ...prev, dist: Math.round(data.dist), score: data.score } : prev));
      },
      onOpponentCrashed: data => {
        if (engineRef.current) {
          engineRef.current.setOpponentCrashed(data.dist, data.score);
          engineRef.current.pause();
        }
        soundSynth.stopMusic();
        soundSynth.playJackpot();
        setMpOpponent(prev => (prev ? { ...prev, dist: data.dist, score: data.score, crashed: true } : prev));

        setMpWinner('PLAYER');
        setMpWinReason(`Opponent crashed at ${data.dist}m! You Win!`);
        setMpStage('RESULT');
        setShowMultiplayerModal(true);

        setTotalCoins(prev => {
          const updated = prev + 500;
          localStorage.setItem('subway_dash_total_coins', updated.toString());
          return updated;
        });
      },
      onConnectionLost: reason => {
        if (isMultiplayerMatchRef.current) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          if (engineRef.current) {
            engineRef.current.pause();
          }
          soundSynth.stopMusic();
          setMpIsConnecting(false);
          setMpErrorMessage(reason);
          setMpStage('CONNECTION_LOST');
          setShowMultiplayerModal(true);
        }
      },
      onError: errMsg => {
        setMpIsConnecting(false);
        setMpErrorMessage(errMsg);
      },
      onLanRoomsUpdated: rooms => {
        setLanRooms(rooms.map(r => ({ code: r.roomCode, hostName: r.hostName })));
      },
    });

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [audioSettings.musicEnabled]);

  // Touch Swipe & Double Tap coordinates
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const lastTapTime = useRef<number>(0);
  const isDoubleTapping = useRef<boolean>(false);
  const lastSpaceTime = useRef<number>(0);

  // Sync Audio Synthesizer
  useEffect(() => {
    soundSynth.setSettings(audioSettings.soundEnabled, audioSettings.musicEnabled, audioSettings.volume);
    localStorage.setItem('subway_dash_audio', JSON.stringify(audioSettings));
  }, [audioSettings]);

  // Sync Missions
  useEffect(() => {
    localStorage.setItem('subway_dash_missions', JSON.stringify(missions));
  }, [missions]);

  // Sync Upgrades
  useEffect(() => {
    localStorage.setItem('subway_dash_upgrades', JSON.stringify(upgrades));
    if (engineRef.current) {
      engineRef.current.setUpgrades(upgrades);
    }
  }, [upgrades]);

  // Sync Inventory (localStorage) & 24h Multiplier
  useEffect(() => {
    localStorage.setItem('subway_dash_inventory', JSON.stringify(inventory));
    if (engineRef.current) {
      engineRef.current.setHas24hMultiplier(inventory.multiplier24hUntil > Date.now());
    }
  }, [inventory]);

  // Sync Player Name
  const handleUpdatePlayerName = useCallback((newName: string) => {
    setPlayerName(newName);
    localStorage.setItem('subway_dash_player_name', newName);
    setLeaderboard(prev => {
      const updated = prev.map(entry =>
        entry.isCurrentPlayer || entry.playerName === 'You'
          ? { ...entry, playerName: newName, isCurrentPlayer: true }
          : entry
      );
      localStorage.setItem('subway_dash_leaderboard', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Mission Progress Handler
  const handleMissionProgress = useCallback((type: Mission['type'], delta: number) => {
    setMissions(prevMissions =>
      prevMissions.map(m => {
        if (m.type === type && !m.completed) {
          let updatedVal = m.current;
          if (
            type === 'RUN_DISTANCE' ||
            type === 'COLLECT_COINS' ||
            type === 'USE_POWERUPS' ||
            type === 'NEAR_MISS' ||
            type === 'DODGE_TRAIN'
          ) {
            updatedVal += delta;
          } else if (type === 'REACH_SCORE' || type === 'HIGH_COMBO') {
            updatedVal = Math.max(m.current, delta);
          }

          const isDone = updatedVal >= m.target;
          return {
            ...m,
            current: updatedVal,
            completed: isDone,
          };
        }
        return m;
      })
    );
  }, []);

  // Near Miss Alert Handler
  const handleNearMiss = useCallback((text: string) => {
    setNearMissMessage(text);
    setTimeout(() => {
      setNearMissMessage(null);
    }, 1600);
  }, []);

  // Theme Change Alert Handler
  const handleThemeChange = useCallback((_theme: string, title: string) => {
    setThemeAlert(title);
    setTimeout(() => {
      setThemeAlert(null);
    }, 3500);
  }, []);

  // Game Over Handler & Leaderboard Tracking
  const handleGameOver = useCallback(
    (finalStats: GameStats) => {
      let isNewRecord = false;
      let newHigh = highScore;

      if (finalStats.score > highScore) {
        isNewRecord = true;
        newHigh = finalStats.score;
        setHighScore(newHigh);
        localStorage.setItem('subway_dash_highscore', newHigh.toString());
      }

      const updatedCoins = totalCoins + finalStats.coins;
      setTotalCoins(updatedCoins);
      localStorage.setItem('subway_dash_total_coins', updatedCoins.toString());

      if (finalStats.score > 0) {
        const currentChar = characters.find(c => c.id === selectedCharId) || characters[0];
        setLeaderboard(prev => {
          const newEntry: LeaderboardEntry = {
            id: Date.now().toString(),
            playerName: playerName || 'You',
            score: finalStats.score,
            coins: finalStats.coins,
            distance: finalStats.distance,
            characterName: currentChar.name,
            date: 'Today',
            isCurrentPlayer: true,
          };
          const combined = [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 5);
          localStorage.setItem('subway_dash_leaderboard', JSON.stringify(combined));
          return combined;
        });
      }

      setCurrentStats({
        ...finalStats,
        highScore: newHigh,
        newHighScore: isNewRecord,
      });

      if (isMultiplayerMatchRef.current) {
        const myDist = finalStats.distance;
        const opp = mpOpponentRef.current;
        const oppDist = opp?.dist || 0;
        let matchWinner: 'PLAYER' | 'OPPONENT' | 'TIE' = 'PLAYER';
        let reason = '';

        if (opp?.crashed) {
          if (myDist > oppDist) {
            matchWinner = 'PLAYER';
            reason = `You dashed ${myDist}m vs Rival ${oppDist}m!`;
          } else if (myDist < oppDist) {
            matchWinner = 'OPPONENT';
            reason = `Rival reached ${oppDist}m before crashing, you reached ${myDist}m!`;
          } else {
            matchWinner = 'TIE';
            reason = `Both runners crashed at ${myDist}m!`;
          }
        } else {
          matchWinner = 'OPPONENT';
          reason = `You crashed at ${myDist}m while Rival continued running!`;
        }

        setMpWinner(matchWinner);
        setMpWinReason(reason);
        setMpStage('RESULT');
        setShowMultiplayerModal(true);

        if (matchWinner === 'PLAYER') {
          soundSynth.playJackpot();
          setTotalCoins(c => {
            const nextCoins = c + 500;
            localStorage.setItem('subway_dash_total_coins', nextCoins.toString());
            return nextCoins;
          });
        }
      } else {
        setGameState('GAMEOVER');
      }
      setIsChaseActive(false);
      soundSynth.stopMusic();
    },
    [highScore, totalCoins, characters, selectedCharId, playerName]
  );

  // Initialize 3D Engine
  useEffect(() => {
    if (!mountRef.current || engineRef.current) return;

    const selectedChar = characters.find(c => c.id === selectedCharId) || characters[0];

    const engine = new GameEngine(
      mountRef.current,
      selectedChar,
      {
        onStatsUpdate: stats => {
          setCurrentStats(prev => ({
            ...stats,
            highScore: Math.max(prev.highScore, stats.score),
          }));
        },
        onPowerUpsUpdate: powerUps => {
          setActivePowerUps(powerUps);
        },
        onGameOver: handleGameOver,
        onMissionProgress: handleMissionProgress,
        onComboMessage: handleComboMessage,
        onNearMiss: handleNearMiss,
        onThemeChange: handleThemeChange,
        onChaseStart: () => {
          setIsChaseActive(true);
        },
        onScreenFade: fadeBlack => {
          setIsScreenFaded(fadeBlack);
        },
        onInGameMissionComplete: handleInGameMissionComplete,
      },
      upgrades
    );

    const activeSkin = skins.find(s => s.id === selectedSkinId) || null;
    engine.setSkin(activeSkin);
    engine.setHas24hMultiplier(inventory.multiplier24hUntil > Date.now());

    // Synchronize 30 FPS WebRTC Peer-to-Peer Stream
    engine.onMultiplayerUpdate = data => {
      if (isMultiplayerMatchRef.current) {
        webrtcService.sendPlayerUpdate(data);
      }
    };

    engine.onMultiplayerCrash = (dist, score) => {
      if (isMultiplayerMatchRef.current) {
        webrtcService.sendPlayerCrashed(dist, score);
      }
    };

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [
    characters,
    selectedCharId,
    skins,
    selectedSkinId,
    inventory.multiplier24hUntil,
    handleGameOver,
    handleMissionProgress,
    handleComboMessage,
    handleNearMiss,
    handleThemeChange,
    handleInGameMissionComplete,
    upgrades,
  ]);

  // Sync character & skin switch
  useEffect(() => {
    if (engineRef.current && selectedCharId) {
      const selectedChar = characters.find(c => c.id === selectedCharId) || characters[0];
      const activeSkin = skins.find(s => s.id === selectedSkinId) || null;
      engineRef.current.setSkin(activeSkin);
      engineRef.current.loadCharacter(selectedChar);
    }
    localStorage.setItem('subway_dash_selected_char', selectedCharId);
  }, [selectedCharId, characters, selectedSkinId, skins]);

  // Global Keyboard Controls (Shift or Double-Space -> Skateboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING' || !engineRef.current) {
        if (e.key === 'Escape') {
          if (gameState === 'PLAYING') setGameState('PAUSED');
          else if (gameState === 'PAUSED') setGameState('PLAYING');
        }
        return;
      }

      if (e.repeat) return;
      const now = Date.now();

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          engineRef.current.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          engineRef.current.moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          engineRef.current.jump();
          break;
        case 'Space':
          e.preventDefault();
          engineRef.current.jump();
          if (now - lastSpaceTime.current < 260) {
            engineRef.current.triggerSkateboard();
          }
          lastSpaceTime.current = now;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          e.preventDefault();
          engineRef.current.triggerSkateboard();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          engineRef.current.slide();
          break;
        case 'Escape':
          setGameState('PAUSED');
          engineRef.current.pause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Mobile Touch Swipe & Double Tap Handlers (Full Screen, Instant Reaction)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;

    const now = Date.now();
    if (now - lastTapTime.current < 320 && engineRef.current) {
      isDoubleTapping.current = true;
      engineRef.current.triggerSkateboard();
      lastTapTime.current = 0;
    } else {
      isDoubleTapping.current = false;
      lastTapTime.current = now;
    }

    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING' || !touchStartPos.current || !engineRef.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartPos.current.x;
    const deltaY = currentY - touchStartPos.current.y;
    const minSwipeDist = 16;

    if (Math.abs(deltaX) > minSwipeDist || Math.abs(deltaY) > minSwipeDist) {
      isDoubleTapping.current = false;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > minSwipeDist) {
          engineRef.current.moveRight();
        } else if (deltaX < -minSwipeDist) {
          engineRef.current.moveLeft();
        }
      } else {
        if (deltaY > minSwipeDist) {
          engineRef.current.slide();
        } else if (deltaY < -minSwipeDist) {
          engineRef.current.jump();
        }
      }
      touchStartPos.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING' || !touchStartPos.current || !engineRef.current) return;

    if (isDoubleTapping.current) {
      isDoubleTapping.current = false;
      touchStartPos.current = null;
      return;
    }

    const touchEndPos = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchEndPos.x - touchStartPos.current.x;
    const deltaY = touchEndPos.y - touchStartPos.current.y;
    const minSwipeDist = 16;

    if (Math.abs(deltaX) > minSwipeDist || Math.abs(deltaY) > minSwipeDist) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > minSwipeDist) {
          engineRef.current.moveRight();
        } else if (deltaX < -minSwipeDist) {
          engineRef.current.moveLeft();
        }
      } else {
        if (deltaY > minSwipeDist) {
          engineRef.current.slide();
        } else if (deltaY < -minSwipeDist) {
          engineRef.current.jump();
        }
      }
    }

    touchStartPos.current = null;
  };

  // Menu Handlers
  const handleRequestStart = () => {
    setIsLoading(true);
  };

  const handleStartGame = () => {
    setIsLoading(false);
    setIsChaseActive(false);
    setIsScreenFaded(false);
    if (!engineRef.current) return;
    setCanRevive(true);
    engineRef.current.setHas24hMultiplier(inventory.multiplier24hUntil > Date.now());
    engineRef.current.resetGame();
    engineRef.current.start();
    setGameState('PLAYING');
    if (audioSettings.musicEnabled) {
      soundSynth.startMusic();
    }
  };

  // Revive Handlers
  const handleReviveWithCoins = () => {
    if (totalCoins < 500) return;
    const newCoins = totalCoins - 500;
    setTotalCoins(newCoins);
    localStorage.setItem('subway_dash_total_coins', newCoins.toString());
    setCanRevive(false);
    setIsChaseActive(false);
    setIsScreenFaded(false);
    setGameState('PLAYING');
    engineRef.current?.revive();
  };

  const handleReviveFree = () => {
    if (inventory.freeRevives > 0) {
      setInventory(prev => ({
        ...prev,
        freeRevives: Math.max(0, prev.freeRevives - 1),
      }));
    }
    setCanRevive(false);
    setIsChaseActive(false);
    setIsScreenFaded(false);
    setGameState('PLAYING');
    engineRef.current?.revive();
  };

  const handlePauseGame = () => {
    if (!engineRef.current || isChaseActive) return;
    engineRef.current.pause();
    setGameState('PAUSED');
  };

  const handleResumeGame = () => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    setGameState('PLAYING');
  };

  const handleRestartGame = () => {
    handleStartGame();
  };

  const handleMainMenu = () => {
    setIsChaseActive(false);
    setIsScreenFaded(false);
    if (engineRef.current) {
      engineRef.current.removeOpponent();
      engineRef.current.setSeed(null);
      engineRef.current.pause();
    }
    setIsMultiplayerMatch(false);
    webrtcService.cleanup();
    soundSynth.stopMusic();
    setGameState('MENU');
  };

  // WebRTC Peer-to-Peer Multiplayer Action Handlers
  const handleStartMultiplayer = () => {
    setIsMultiplayerMatch(true);
    setMpStage('MENU');
    setShowMultiplayerModal(true);
    setMpOpponent(null);
    setMpWinner(null);
    setMpWinReason(null);
    setMpErrorMessage(null);
    setMpIsConnecting(false);
  };

  const handleSelectCreateRoom = () => {
    setMpStage('HOST_WAITING');
    setMpRoomCode(null);
    setMpErrorMessage(null);
    const currentChar = characters.find(c => c.id === selectedCharId) || characters[0];
    webrtcService.createRoom({ name: currentChar.name, charId: currentChar.id }).catch(err => {
      setMpErrorMessage(err?.message || 'Could not create room');
    });
  };

  const handleSelectJoinRoom = () => {
    setMpStage('JOIN_INPUT');
    setMpErrorMessage(null);
    setMpIsConnecting(false);
    webrtcService.requestLanRooms();
  };

  const handleJoinWithCode = (code: string) => {
    setMpIsConnecting(true);
    setMpErrorMessage(null);
    setMpRoomCode(code);
    const currentChar = characters.find(c => c.id === selectedCharId) || characters[0];
    webrtcService.joinRoom(code, { name: currentChar.name, charId: currentChar.id }).catch(err => {
      setMpIsConnecting(false);
      setMpErrorMessage(err?.message || 'Failed to connect to room');
    });
  };

  const handleBackToMpMenu = () => {
    webrtcService.cleanup();
    setMpIsConnecting(false);
    setMpErrorMessage(null);
    setMpRoomCode(null);
    setMpStage('MENU');
  };

  const handleCancelMultiplayer = () => {
    webrtcService.cleanup();
    setShowMultiplayerModal(false);
    setIsMultiplayerMatch(false);
    setMpIsConnecting(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handlePlayAgainMultiplayer = () => {
    if (webrtcService.isConnected) {
      webrtcService.requestRematch();
    } else {
      handleBackToMpMenu();
    }
  };

  const handleCloseMultiplayer = () => {
    setShowMultiplayerModal(false);
    setIsMultiplayerMatch(false);
    setMpIsConnecting(false);
    if (engineRef.current) {
      engineRef.current.removeOpponent();
      engineRef.current.setSeed(null);
      engineRef.current.pause();
    }
    webrtcService.cleanup();
    soundSynth.stopMusic();
    setGameState('MENU');
  };

  // Unlock Character Handler
  const handleUnlockCharacter = (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char || char.unlocked || totalCoins < char.price) return;

    const newCoins = totalCoins - char.price;
    setTotalCoins(newCoins);
    localStorage.setItem('subway_dash_total_coins', newCoins.toString());

    const updated = characters.map(c => (c.id === charId ? { ...c, unlocked: true } : c));
    setCharacters(updated);

    const unlockedIds = updated.filter(c => c.unlocked).map(c => c.id);
    localStorage.setItem('subway_dash_unlocked_chars', JSON.stringify(unlockedIds));

    setSelectedCharId(charId);
    soundSynth.playPowerUp();
  };

  // Unlock Skin Handler (Shop)
  const handleUnlockSkin = (skinId: string) => {
    const skin = skins.find(s => s.id === skinId);
    if (!skin || skin.unlocked || totalCoins < skin.price) return;

    const newCoins = totalCoins - skin.price;
    setTotalCoins(newCoins);
    localStorage.setItem('subway_dash_total_coins', newCoins.toString());

    const updated = skins.map(s => (s.id === skinId ? { ...s, unlocked: true } : s));
    setSkins(updated);

    const unlockedIds = updated.filter(s => s.unlocked).map(s => s.id);
    localStorage.setItem('subway_dash_unlocked_skins', JSON.stringify(unlockedIds));

    setSelectedSkinId(skinId);
    localStorage.setItem('subway_dash_selected_skin', skinId);
    soundSynth.playPowerUp();
  };

  // Unlock Random Rare Skin (Mystery Box)
  const handleUnlockRareSkin = useCallback((): string | null => {
    const lockedSkins = skins.filter(s => !s.unlocked);
    if (lockedSkins.length === 0) return null;
    const chosen = lockedSkins[Math.floor(Math.random() * lockedSkins.length)];
    const updated = skins.map(s => (s.id === chosen.id ? { ...s, unlocked: true } : s));
    setSkins(updated);
    const unlockedIds = updated.filter(s => s.unlocked).map(s => s.id);
    localStorage.setItem('subway_dash_unlocked_skins', JSON.stringify(unlockedIds));
    setSelectedSkinId(chosen.id);
    localStorage.setItem('subway_dash_selected_skin', chosen.id);
    return chosen.name;
  }, [skins]);

  // Grant 24h 2x Multiplier (Mystery Box)
  const handleGrant24hMultiplier = useCallback(() => {
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    setInventory(prev => ({
      ...prev,
      multiplier24hUntil: Math.max(Date.now(), prev.multiplier24hUntil) + twentyFourHoursMs,
    }));
  }, []);

  // Grant Free Revive (Mystery Box)
  const handleGrantFreeRevive = useCallback(() => {
    setInventory(prev => ({
      ...prev,
      freeRevives: prev.freeRevives + 1,
    }));
  }, []);

  const handleClaimMissionReward = (missionId: string) => {
    const m = missions.find(item => item.id === missionId);
    if (!m || !m.completed || m.claimed) return;

    const newCoins = totalCoins + m.rewardCoins;
    setTotalCoins(newCoins);
    localStorage.setItem('subway_dash_total_coins', newCoins.toString());

    setMissions(prev => prev.map(item => (item.id === missionId ? { ...item, claimed: true } : item)));
    soundSynth.playPowerUp();
  };

  const handleClaimDailyStreak = (rewardCoins: number, bonus?: string) => {
    const newCoins = totalCoins + rewardCoins;
    setTotalCoins(newCoins);
    localStorage.setItem('subway_dash_total_coins', newCoins.toString());

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const nextStreak = dailyStreak.currentStreak >= 7 ? 1 : dailyStreak.currentStreak + 1;
    const updated: DailyStreakState = {
      currentStreak: nextStreak,
      lastClaimDate: todayDateStr,
      claimedDays: [...dailyStreak.claimedDays, dailyStreak.currentStreak],
    };
    setDailyStreak(updated);
    localStorage.setItem('subway_dash_daily_streak', JSON.stringify(updated));
    setShowDailyBonus(false);
    soundSynth.playJackpot();

    if (bonus === 'Grand Spin!') {
      setTimeout(() => {
        setShowMysteryBox(true);
      }, 500);
    }
  };

  // Upgrades Workbench Handler
  const handleUpgrade = (key: keyof PowerUpUpgrades, cost: number) => {
    if (totalCoins < cost) return;
    const newCoins = totalCoins - cost;
    setTotalCoins(newCoins);
    localStorage.setItem('subway_dash_total_coins', newCoins.toString());

    setUpgrades(prev => {
      const nextLvl = Math.min(5, prev[key] + 1);
      return { ...prev, [key]: nextLvl };
    });
  };

  // Mystery Box Rewards
  const handleMysteryRewardCoins = (amount: number) => {
    setTotalCoins(prev => {
      const newCoins = prev + amount;
      localStorage.setItem('subway_dash_total_coins', newCoins.toString());
      return newCoins;
    });
  };

  const handleMysteryDeductCoins = (amount: number): boolean => {
    if (totalCoins < amount) return false;
    const newCoins = totalCoins - amount;
    setTotalCoins(newCoins);
    localStorage.setItem('subway_dash_total_coins', newCoins.toString());
    return true;
  };

  const handleMysteryRewardBonus = (_rewardType: string) => {
    setTotalCoins(prev => {
      const newCoins = prev + 350;
      localStorage.setItem('subway_dash_total_coins', newCoins.toString());
      return newCoins;
    });
  };

  const handleUnlockRandomCharacter = useCallback(() => {
    const locked = characters.filter(c => !c.unlocked);
    if (locked.length === 0) return null;
    const chosen = locked[Math.floor(Math.random() * locked.length)];
    const updated = characters.map(c => (c.id === chosen.id ? { ...c, unlocked: true } : c));
    setCharacters(updated);
    const unlockedIds = updated.filter(c => c.unlocked).map(c => c.id);
    localStorage.setItem('subway_dash_unlocked_chars', JSON.stringify(unlockedIds));
    soundSynth.playJackpot();
    return chosen.name;
  }, [characters]);

  const selectedChar = characters.find(c => c.id === selectedCharId) || characters[0];
  const has24hMultiplier = inventory.multiplier24hUntil > Date.now();

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />

      {/* Police Siren Flashing Screen Edges during Inspector & Dog Chase Sequence */}
      {isChaseActive && (
        <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-red-600/45 to-transparent animate-pulse" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-blue-600/45 to-transparent animate-pulse" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-red-600/30 via-blue-600/20 to-transparent animate-pulse" />
        </div>
      )}

      {/* Cinematic Fade-to-Black Overlay */}
      <div
        className={`pointer-events-none fixed inset-0 z-40 bg-black transition-opacity duration-500 ${
          isScreenFaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Loading & Pre-warm Screen */}
      {isLoading && <LoadingScreen onLoaded={handleStartGame} />}

      {/* Main Menu Screen */}
      {gameState === 'MENU' && !isLoading && (
        <MainMenu
          selectedCharacter={selectedChar}
          highScore={highScore}
          totalCoins={totalCoins}
          missions={missions}
          audioSettings={audioSettings}
          canClaimDaily={canClaimDaily}
          onPlay={handleRequestStart}
          onOpenMultiplayer={handleStartMultiplayer}
          onOpenShop={() => {
            setShopInitialTab('CHARACTERS');
            setShowShopModal(true);
          }}
          onOpenCharacterSelect={() => {
            setShopInitialTab('CHARACTERS');
            setShowShopModal(true);
          }}
          onOpenMissions={() => setShowMissionsModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenMysteryBox={() => setShowMysteryBox(true)}
          onOpenUpgrades={() => {
            setShopInitialTab('UPGRADES');
            setShowShopModal(true);
          }}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onOpenDailyStreak={() => setShowDailyBonus(true)}
          onToggleSound={() =>
            setAudioSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
          }
          onToggleMusic={() =>
            setAudioSettings(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }))
          }
        />
      )}

      {/* Playing Live HUD Overlay with Left-Side Mini Mission Tracker */}
      {gameState === 'PLAYING' && (
        <GameHUD
          stats={currentStats}
          activePowerUps={activePowerUps}
          activeMissions={missions.filter(m => !m.completed)}
          comboMessage={comboMessage}
          nearMissMessage={nearMissMessage}
          themeAlert={themeAlert}
          inGameMissionAlert={inGameMissionAlert}
          has24hMultiplier={has24hMultiplier}
          onPause={handlePauseGame}
        />
      )}

      {/* 7-Day Daily Login Streak Modal */}
      {showDailyBonus && gameState === 'MENU' && !isLoading && (
        <DailyBonusModal
          currentStreak={dailyStreak.currentStreak}
          canClaimToday={canClaimDaily}
          onClaim={handleClaimDailyStreak}
          onClose={() => setShowDailyBonus(false)}
        />
      )}

      {/* Unified Runner Shop Modal (Characters, Skins, Power-Up Upgrades) */}
      {showShopModal && (
        <ShopModal
          initialTab={shopInitialTab}
          totalCoins={totalCoins}
          characters={characters}
          selectedCharacterId={selectedCharId}
          skins={skins}
          selectedSkinId={selectedSkinId}
          upgrades={upgrades}
          onSelectCharacter={id => {
            setSelectedCharId(id);
            soundSynth.playButtonClick();
          }}
          onUnlockCharacter={handleUnlockCharacter}
          onSelectSkin={id => {
            setSelectedSkinId(id);
            localStorage.setItem('subway_dash_selected_skin', id);
            soundSynth.playButtonClick();
          }}
          onUnlockSkin={handleUnlockSkin}
          onUpgradePowerUp={handleUpgrade}
          onClose={() => setShowShopModal(false)}
        />
      )}

      {/* Top 5 Local Leaderboard Modal */}
      {showLeaderboardModal && (
        <LeaderboardModal
          entries={leaderboard}
          highScore={highScore}
          playerName={playerName}
          onUpdatePlayerName={handleUpdatePlayerName}
          onPlayAgain={gameState === 'MENU' ? handleRequestStart : undefined}
          onClose={() => setShowLeaderboardModal(false)}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Game Over Modal with Revive, Shop, Mystery Box & Leaderboard Access */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          stats={currentStats}
          totalCoins={totalCoins}
          canRevive={canRevive}
          freeRevivesCount={inventory.freeRevives}
          onReviveCoins={handleReviveWithCoins}
          onReviveFree={handleReviveFree}
          onPlayAgain={handleRestartGame}
          onMainMenu={handleMainMenu}
          onOpenShop={() => {
            setShopInitialTab('SKINS');
            setShowShopModal(true);
          }}
          onOpenMysteryBox={() => setShowMysteryBox(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        />
      )}

      {/* Character Select Modal */}
      {showCharModal && (
        <CharacterSelectModal
          characters={characters}
          selectedCharacterId={selectedCharId}
          totalCoins={totalCoins}
          onSelectCharacter={id => {
            setSelectedCharId(id);
            soundSynth.playButtonClick();
          }}
          onUnlockCharacter={handleUnlockCharacter}
          onClose={() => setShowCharModal(false)}
        />
      )}

      {/* Missions Modal */}
      {showMissionsModal && (
        <MissionsModal
          missions={missions}
          onClaimReward={handleClaimMissionReward}
          onRefreshMissions={() => {
            setMissions(INITIAL_MISSIONS);
            soundSynth.playButtonClick();
          }}
          onClose={() => setShowMissionsModal(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          audioSettings={audioSettings}
          onUpdateAudio={(sound, music, vol) =>
            setAudioSettings({ soundEnabled: sound, musicEnabled: music, volume: vol })
          }
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Mystery Box (1,000 Coins) & Lucky Wheel Modal */}
      {showMysteryBox && (
        <MysteryBoxModal
          totalCoins={totalCoins}
          inventory={inventory}
          onRewardCoins={handleMysteryRewardCoins}
          onRewardBonus={handleMysteryRewardBonus}
          onDeductCoins={handleMysteryDeductCoins}
          onUnlockRandomCharacter={handleUnlockRandomCharacter}
          onUnlockRareSkin={handleUnlockRareSkin}
          onGrant24hMultiplier={handleGrant24hMultiplier}
          onGrantFreeRevive={handleGrantFreeRevive}
          onClose={() => setShowMysteryBox(false)}
        />
      )}

      {/* Gadget Upgrades Modal */}
      {showUpgradesModal && (
        <UpgradesModal
          upgrades={upgrades}
          totalCoins={totalCoins}
          onUpgrade={handleUpgrade}
          onClose={() => setShowUpgradesModal(false)}
        />
      )}

      {/* WebRTC Peer-to-Peer Multiplayer Modal */}
      {showMultiplayerModal && (
        <MultiplayerModal
          stage={mpStage}
          countdown={mpCountdown}
          roomCode={mpRoomCode}
          sharedSeed={mpSharedSeed}
          selectedCharacter={selectedChar}
          opponent={mpOpponent}
          playerStats={{
            distance: currentStats.distance,
            score: currentStats.score,
          }}
          winner={mpWinner}
          winReason={mpWinReason}
          errorMessage={mpErrorMessage}
          isConnecting={mpIsConnecting}
          initialJoinCode={mpInitialJoinCode}
          lanRooms={lanRooms}
          onSelectCreateRoom={handleSelectCreateRoom}
          onSelectJoinRoom={handleSelectJoinRoom}
          onJoinWithCode={handleJoinWithCode}
          onRefreshLanRooms={() => webrtcService.requestLanRooms()}
          onBackToMpMenu={handleBackToMpMenu}
          onCancelSearch={handleCancelMultiplayer}
          onPlayAgain={handlePlayAgainMultiplayer}
          onClose={handleCloseMultiplayer}
        />
      )}
    </div>
  );
}
