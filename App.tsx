
import React, { useState, useEffect } from 'react';
import { AppRoute, Task, CalendarEvent } from './types';
import { Plus, Loader2 } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import HomeView from './components/HomeView';
import FocusTimerView from './components/FocusTimerView';
import TasksView from './components/TasksView';
import GameView from './components/GameView';
import RaceTrackView from './components/RaceTrackView';
import LeaderboardView from './components/LeaderboardView';
import SettingsView from './components/SettingsView';
import AIChatView from './components/AIChatView';
import CalendarDetailView from './components/CalendarDetailView';
import ProfileView from './components/ProfileView';
import AccountSettingsView from './components/AccountSettingsView';
import NotificationsView from './components/NotificationsView';
import EditProfileView from './components/EditProfileView';
import ArchiveView from './components/ArchiveView';
import ArchivedRemindersView from './components/ArchivedRemindersView';
import ChangeEmailView from './components/ChangeEmailView';
import Navigation from './components/Navigation';
import GameNavigation from './components/GameNavigation';
import LoginView from './components/LoginView';
import OnboardingView from './components/OnboardingView';
import FeatureTour from './components/FeatureTour';
import ConfirmationModal from './components/ConfirmationModal';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [hasCompletedTour, setHasCompletedTour] = useState<boolean | null>(null);
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  
  // Persistence initialization
  const [coins, _setCoins] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [homeSections, setHomeSections] = useState<string[]>(['focus', 'calendar', 'games']);
  const [activeAreas, setActiveAreas] = useState<string[]>(['blue']);
  const [purchasedBackgrounds, setPurchasedBackgrounds] = useState<string[]>([]);
  const [areaBackgrounds, setAreaBackgrounds] = useState<Record<string, string>>({});
  const [areaNames, setAreaNames] = useState<Record<string, string>>({ blue: '專案區域 A', yellow: '專案區域 B', green: '專案區域 C' });
  const [userProfile, setUserProfile] = useState({
    name: 'Focus User',
    bio: '專注於每一刻，成就更好的自己。',
    avatar: 'https://picsum.photos/seed/user/200',
    level: 0,
    winsTowardsNextLevel: 0,
    visitedRoutes: [AppRoute.HOME],
    email: 'user@example.com',
    registrationDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
  });
  const [lastBetAmount, setLastBetAmount] = useState(100);
  const [placedItems, setPlacedItems] = useState<{id: string, x: number, y: number, char: string, isReacting: boolean, clickCount: number, areaId: string}[]>([
    { id: 'start1', x: 50, y: 50, char: '🦦', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'start2', x: 20, y: 30, char: '📺', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'start3', x: 70, y: 20, char: '🧸', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'env1', x: 15, y: 85, char: '🚽', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'env2', x: 35, y: 85, char: '🛁', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'env3', x: 85, y: 80, char: '🚪', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'env4', x: 80, y: 20, char: '🖼️', isReacting: false, clickCount: 0, areaId: 'blue' },
  ]);

  // Auth & Data Fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);

      if (firebaseUser) {
        setIsLoadingData(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setHasCompletedOnboarding(data.hasCompletedOnboarding ?? false);
            setHasCompletedTour(data.hasCompletedTour ?? false);
            // Load data from Firestore
            if (data.points !== undefined) _setCoins(data.points);
            if (data.tasks) setTasks(data.tasks);
            if (data.homeConfig) setHomeSections(data.homeConfig);
            if (data.placedItems) setPlacedItems(data.placedItems);
            if (data.userProfile) setUserProfile(data.userProfile);
          } else {
            // New user
            setHasCompletedOnboarding(false);
            setHasCompletedTour(false);
            const initialData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              points: 0,
              hasCompletedOnboarding: false,
              hasCompletedTour: false,
              createdAt: new Date().toISOString(),
              homeConfig: ['focus', 'calendar', 'games'],
              placedItems: placedItems,
              tasks: [
                { id: '1', title: '閱讀天龍八部第二章', dueDate: '2026/06/25', completed: false },
                { id: '2', title: '畢業展作品繳交', dueDate: '2026/08/07', completed: false },
              ],
              userProfile: {
                ...userProfile,
                name: firebaseUser.displayName || 'Focus User',
                email: firebaseUser.email || 'user@example.com',
                registrationDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
              }
            };
            await setDoc(userDocRef, initialData);
            setTasks(initialData.tasks);
            setUserProfile(initialData.userProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        } finally {
          setIsLoadingData(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync state to Firestore when it changes
  useEffect(() => {
    if (!user || isLoadingData) return;
    const syncData = async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          points: coins,
          tasks: tasks,
          homeConfig: homeSections,
          placedItems: placedItems,
          userProfile: userProfile,
          hasCompletedOnboarding: hasCompletedOnboarding,
          hasCompletedTour: hasCompletedTour
        });
      } catch (error) {
        // Silent fail for background sync or handle if critical
      }
    };
    const timer = setTimeout(syncData, 2000); // Debounce sync
    return () => clearTimeout(timer);
  }, [coins, tasks, homeSections, placedItems, userProfile.level, hasCompletedOnboarding, user, isLoadingData]);

  const MAX_COINS = 9999;

  const setCoins = (updater: React.SetStateAction<number>) => {
    _setCoins(prev => {
      const next = typeof updater === 'function' ? (updater as (prev: number) => number)(prev) : updater;
      return Math.max(0, Math.min(next, MAX_COINS));
    });
  };

  // Persistence effects - Disabled in favor of Firestore
  /*
  useEffect(() => { localStorage.setItem('focus_coins', coins.toString()); }, [coins]);
  useEffect(() => { localStorage.setItem('focus_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('focus_archived_tasks', JSON.stringify(archivedTasks)); }, [archivedTasks]);
  useEffect(() => { localStorage.setItem('focus_home_sections', JSON.stringify(homeSections)); }, [homeSections]);
  useEffect(() => { localStorage.setItem('focus_active_areas', JSON.stringify(activeAreas)); }, [activeAreas]);
  useEffect(() => { localStorage.setItem('focus_placed_items', JSON.stringify(placedItems)); }, [placedItems]);
  useEffect(() => { localStorage.setItem('focus_purchased_backgrounds', JSON.stringify(purchasedBackgrounds)); }, [purchasedBackgrounds]);
  useEffect(() => { localStorage.setItem('focus_area_backgrounds', JSON.stringify(areaBackgrounds)); }, [areaBackgrounds]);
  useEffect(() => { localStorage.setItem('focus_area_names', JSON.stringify(areaNames)); }, [areaNames]);
  useEffect(() => { localStorage.setItem('focus_user_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('focus_last_bet', lastBetAmount.toString()); }, [lastBetAmount]);
  */

  const [timerTotalTime, setTimerTotalTime] = useState(2400);
  const [timerTimeLeft, setTimerTimeLeft] = useState(2400);
  const [timerIsActive, setTimerIsActive] = useState(false);
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const mainRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const resetScroll = () => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    };
    
    resetScroll();
    // Use requestAnimationFrame and setTimeout to ensure scroll is reset after all renders and dnd-kit cleanups
    requestAnimationFrame(resetScroll);
    const timer = setTimeout(resetScroll, 50);
    return () => clearTimeout(timer);
  }, [currentRoute]);

  useEffect(() => {
    let interval: any = null;
    if (timerIsActive && timerTimeLeft > 0) {
      interval = setInterval(() => {
        setTimerTimeLeft(t => t - 1);
      }, 1000);
    } else if (timerTimeLeft === 0 && timerIsActive) {
      setTimerIsActive(false);
      setCoins(c => c + 500);
      alert("太棒了！專注時段已結束。");
    }
    return () => clearInterval(interval);
  }, [timerIsActive, timerTimeLeft]);

  const navigateTo = (route: AppRoute) => {
    setCurrentRoute(route);
    setUserProfile(prev => {
      if (prev.visitedRoutes.includes(route)) return prev;
      return { ...prev, visitedRoutes: [...prev.visitedRoutes, route] };
    });
  };

  // Level up logic
  useEffect(() => {
    const checkLevelUp = () => {
      let canLevelUp = false;
      
      // Condition 1: 10+ emojis
      const emojiCount = placedItems.filter(item => !['📺', '🚽', '🛁', '🚪', '🖼️'].includes(item.char)).length;
      const has10Emojis = emojiCount >= 10;

      // Condition 2: Win 2 horse races (tracked in winsTowardsNextLevel)
      const has2Wins = userProfile.winsTowardsNextLevel >= 2;

      // Condition 3: Visited all main routes (as a proxy for "clicked every button")
      const mainRoutes = [
        AppRoute.HOME, AppRoute.FOCUS_TIMER, AppRoute.TASKS, 
        AppRoute.GAME_PETS, AppRoute.GAME_RACE, AppRoute.LEADERBOARD, 
        AppRoute.SETTINGS, AppRoute.AI_CHAT, AppRoute.CALENDAR_DETAIL, 
        AppRoute.PROFILE, AppRoute.PROFILE_ACCOUNT
      ];
      const hasVisitedAll = mainRoutes.every(r => userProfile.visitedRoutes.includes(r));

      if (has10Emojis || has2Wins || hasVisitedAll) {
        setUserProfile(prev => ({
          ...prev,
          level: prev.level + 1,
          winsTowardsNextLevel: has2Wins ? 0 : prev.winsTowardsNextLevel,
          // We don't reset visitedRoutes or emojiCount as they are cumulative/state-based
          // but for wins we reset as requested "升級後記得重新計算"
        }));
        alert(`恭喜！你升到了 Lv.${userProfile.level + 1}`);
      }
    };

    const timer = setTimeout(checkLevelUp, 1000);
    return () => clearTimeout(timer);
  }, [placedItems, userProfile.winsTowardsNextLevel, userProfile.visitedRoutes]);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const newTasks = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      return newTasks.sort((a, b) => {
        if (a.completed === b.completed) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return a.completed ? 1 : -1;
      });
    });
  };

  const archiveTask = (id: string) => {
    const taskToArchive = tasks.find(t => t.id === id);
    if (taskToArchive) {
      setCoins(c => c + 50);
      setArchivedTasks(prev => [...prev, { ...taskToArchive, completed: true }]);
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const renderView = () => {
    switch (currentRoute) {
      case AppRoute.HOME:
        return <HomeView navigateTo={navigateTo} tasks={tasks} setTasks={setTasks} toggleTask={toggleTask} archiveTask={archiveTask} calendarEvents={calendarEvents} sections={homeSections} setSections={setHomeSections} userProfile={userProfile} />;
      case AppRoute.FOCUS_TIMER:
        return <FocusTimerView 
          navigateTo={navigateTo} 
          totalTime={timerTotalTime}
          setTotalTime={setTimerTotalTime}
          timeLeft={timerTimeLeft}
          setTimeLeft={setTimerTimeLeft}
          isActive={timerIsActive}
          setIsActive={setTimerIsActive}
        />;
      case AppRoute.TASKS:
        return <TasksView 
          navigateTo={navigateTo} 
          tasks={tasks} 
          setTasks={setTasks} 
          toggleTask={toggleTask} 
          archiveTask={archiveTask} 
          isAdding={isAddingTask}
          setIsAdding={setIsAddingTask}
          newTitle={newTaskTitle}
          setNewTitle={setNewTaskTitle}
        />;
      case AppRoute.GAME_PETS:
        return <GameView 
          navigateTo={navigateTo} 
          coins={coins} 
          setCoins={setCoins} 
          placedItems={placedItems}
          setPlacedItems={setPlacedItems}
          activeAreas={activeAreas}
          setActiveAreas={setActiveAreas}
          purchasedBackgrounds={purchasedBackgrounds}
          setPurchasedBackgrounds={setPurchasedBackgrounds}
          areaBackgrounds={areaBackgrounds}
          setAreaBackgrounds={setAreaBackgrounds}
          areaNames={areaNames}
          setAreaNames={setAreaNames}
        />;
      case AppRoute.GAME_RACE:
        return <RaceTrackView 
          navigateTo={navigateTo} 
          coins={coins} 
          setCoins={setCoins} 
          lastBetAmount={lastBetAmount} 
          setLastBetAmount={setLastBetAmount} 
          setUserProfile={setUserProfile}
        />;
      case AppRoute.LEADERBOARD:
        return <LeaderboardView navigateTo={navigateTo} userProfile={userProfile} coins={coins} />;
      case AppRoute.SETTINGS:
        return <SettingsView navigateTo={navigateTo} />;
      case AppRoute.AI_CHAT:
        return <AIChatView navigateTo={navigateTo} setCalendarEvents={setCalendarEvents} tasks={tasks} />;
      case AppRoute.CALENDAR_DETAIL:
        return <CalendarDetailView 
          navigateTo={navigateTo} 
          events={calendarEvents} 
          setEvents={setCalendarEvents} 
        />;
      case AppRoute.PROFILE:
        return <ProfileView navigateTo={navigateTo} onLogout={handleLogout} userProfile={userProfile} />;
      case AppRoute.PROFILE_ACCOUNT:
        return <AccountSettingsView navigateTo={navigateTo} onDeleteAccount={handleDeleteAccount} userProfile={userProfile} />;
      case AppRoute.PROFILE_NOTIFICATIONS:
        return <NotificationsView navigateTo={navigateTo} />;
      case AppRoute.PROFILE_EDIT:
        return <EditProfileView navigateTo={navigateTo} userProfile={userProfile} setUserProfile={setUserProfile} />;
      case AppRoute.PROFILE_ARCHIVE:
        return <ArchiveView navigateTo={navigateTo} />;
      case AppRoute.PROFILE_ARCHIVED_REMINDERS:
        return <ArchivedRemindersView navigateTo={navigateTo} archivedTasks={archivedTasks} />;
      case AppRoute.CHANGE_EMAIL:
        return <ChangeEmailView navigateTo={navigateTo} userProfile={userProfile} setUserProfile={setUserProfile} />;
      default:
        return <HomeView navigateTo={navigateTo} tasks={tasks} setTasks={setTasks} toggleTask={toggleTask} archiveTask={archiveTask} calendarEvents={calendarEvents} sections={homeSections} setSections={setHomeSections} userProfile={userProfile} />;
    }
  };

  const renderFAB = () => {
    if (currentRoute === AppRoute.TASKS) {
      return (
        <button 
          onClick={() => setIsAddingTask(true)}
          className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center transform transition-all hover:scale-110 active:scale-95 border-4 border-white"
        >
          <Plus size={30} strokeWidth={3} />
        </button>
      );
    }
    if (currentRoute === AppRoute.CALENDAR_DETAIL) {
      return (
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('calendar-add-event'))}
          className="w-14 h-14 bg-red-500 text-white rounded-full shadow-2xl flex items-center justify-center transform transition-all hover:scale-110 active:scale-95 border-4 border-white"
        >
          <Plus size={30} strokeWidth={3} />
        </button>
      );
    }
    return null;
  };

  const handleOnboardingComplete = async () => {
    setHasCompletedOnboarding(true);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { hasCompletedOnboarding: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleTourComplete = async () => {
    setIsTourVisible(false);
    setHasCompletedTour(true);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { hasCompletedTour: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoadingData(true);
      await signOut(auth);
      
      // Reset local states to default values
      _setCoins(0);
      setTasks([]);
      setArchivedTasks([]);
      setHomeSections(['focus', 'calendar', 'games']);
      setPlacedItems([
        { id: 'start1', x: 50, y: 50, char: '🦦', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'start2', x: 20, y: 30, char: '📺', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'start3', x: 70, y: 20, char: '🧸', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env1', x: 15, y: 85, char: '🚽', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env2', x: 35, y: 85, char: '🛁', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env3', x: 85, y: 80, char: '🚪', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env4', x: 80, y: 20, char: '🖼️', isReacting: false, clickCount: 0, areaId: 'blue' },
      ]);
      setUserProfile({
        name: 'Focus User',
        bio: '專注於每一刻，成就更好的自己。',
        avatar: 'https://picsum.photos/seed/user/200',
        level: 0,
        winsTowardsNextLevel: 0,
        visitedRoutes: [AppRoute.HOME],
        email: 'user@example.com',
        registrationDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
      });
      
      setCurrentRoute(AppRoute.HOME);
      setHasCompletedOnboarding(null);
      setHasCompletedTour(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setShowDeleteConfirm(true);
    setDeleteStep(1);
  };

  const executeDeleteAccount = async () => {
    if (!user) return;
    
    try {
      setIsLoadingData(true);
      setShowDeleteConfirm(false);
      const uid = user.uid;
      
      // 1. Delete Firestore data
      await deleteDoc(doc(db, 'users', uid));
      
      // 2. Delete Auth user
      await deleteUser(user);
      
      // 3. Reset local states
      _setCoins(0);
      setTasks([]);
      setArchivedTasks([]);
      setHomeSections(['focus', 'calendar', 'games']);
      setPlacedItems([
        { id: 'start1', x: 50, y: 50, char: '🦦', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'start2', x: 20, y: 30, char: '📺', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'start3', x: 70, y: 20, char: '🧸', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env1', x: 15, y: 85, char: '🚽', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env2', x: 35, y: 85, char: '🛁', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env3', x: 85, y: 80, char: '🚪', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env4', x: 80, y: 20, char: '🖼️', isReacting: false, clickCount: 0, areaId: 'blue' },
      ]);
      setUserProfile({
        name: 'Focus User',
        bio: '專注於每一刻，成就更好的自己。',
        avatar: 'https://picsum.photos/seed/user/200',
        level: 0,
        winsTowardsNextLevel: 0,
        visitedRoutes: [AppRoute.HOME],
        email: 'user@example.com',
        registrationDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
      });
      
      setHasCompletedOnboarding(null);
      setHasCompletedTour(null);
      setCurrentRoute(AppRoute.HOME);
    } catch (error: any) {
      console.error('Delete account failed:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('為了安全起見，刪除帳號需要您近期曾進行過登入。請重新登入後再試一次。');
        await signOut(auth);
      } else {
        alert('刪除帳號失敗，請稍後再試。');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentRoute === AppRoute.PROFILE && hasCompletedTour === false && !isTourVisible) {
      // Small delay to ensure elements are rendered
      const timer = setTimeout(() => setIsTourVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [currentRoute, hasCompletedTour, isTourVisible]);

  const tourSteps = [
    {
      targetId: 'home-profile',
      title: '個人中心',
      content: '點擊這裡可以查看你的等級、排名，並進行帳號設定。'
    },
    {
      targetId: 'profile-account',
      title: '帳號設定',
      content: '在這裡修改你的個人資料、頭像以及電子郵件。'
    },
    {
      targetId: 'profile-notifications',
      title: '通知提醒',
      content: '設定專注提醒，讓 AI 幫你保持規律的學習節奏。'
    },
    {
      targetId: 'profile-archive',
      title: '任務封存',
      content: '查看過去已完成的任務紀錄與獲得的獎勵。'
    },
    {
      targetId: 'profile-logout',
      title: '登出帳號',
      content: '安全退出當前帳號。'
    },
    {
      targetId: 'nav-focus',
      title: '專注模式',
      content: '隨時回到首頁，查看待辦事項與使用番茄鐘。'
    },
    {
      targetId: 'nav-game',
      title: '遊戲世界',
      content: '進入你的專屬空間，與寵物互動並參與賽馬挑戰。'
    },
    {
      targetId: 'nav-ai',
      title: 'AI 助手',
      content: '最強大的功能！讓 AI 幫你拆解任務、分析進度，是你的專屬導師。'
    }
  ];

  if (!isAuthReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-indigo-600">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (hasCompletedOnboarding === false) {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-white shadow-xl relative overflow-hidden flex flex-col font-sans">
      <FeatureTour 
        steps={tourSteps} 
        isVisible={isTourVisible} 
        onComplete={handleTourComplete} 
      />
      
      <ConfirmationModal
        isOpen={showDeleteConfirm && deleteStep === 1}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => setDeleteStep(2)}
        title="確定要刪除帳號嗎？"
        message="此操作將永久刪除您的所有專注紀錄、金幣與寵物，且無法復原。"
        confirmText="下一步"
        type="danger"
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm && deleteStep === 2}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDeleteAccount}
        title="最後確認"
        message="您真的要刪除帳號並抹除所有資料嗎？這將無法撤銷。"
        confirmText="永久刪除"
        type="danger"
      />

      <main ref={mainRef} className={`flex-1 ${currentRoute === AppRoute.AI_CHAT ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={currentRoute === AppRoute.AI_CHAT ? "h-full" : "pb-20"}>
          {renderView()}
        </div>
      </main>
      {/* 只有在非 AI 聊天頁面才顯示全域導覽列 */}
      {currentRoute !== AppRoute.AI_CHAT && (
        <Navigation currentRoute={currentRoute} navigateTo={navigateTo} fab={renderFAB()} />
      )}
      
      {/* 遊戲子導覽列 - 當在遊戲相關頁面時顯示 */}
      {[AppRoute.GAME_PETS, AppRoute.GAME_RACE, AppRoute.LEADERBOARD].includes(currentRoute) && (
        <GameNavigation currentRoute={currentRoute} navigateTo={navigateTo} />
      )}
    </div>
  );
};

export default App;
