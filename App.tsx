import React, { useState, useEffect } from 'react';
import { AppRoute, Task, CalendarEvent } from './types';
import { Plus, Loader2 } from 'lucide-react';
import { supabase, handleSupabaseError, OperationType } from './supabase';
import { User } from '@supabase/supabase-js';
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
  const [user, setUser] = useState<User | null>(null);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sbUser = session?.user || null;
      setUser(sbUser);
      setIsAuthReady(true);

      if (sbUser) {
        setIsLoadingData(true);
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', sbUser.id)
            .single();

          if (data) {
            setHasCompletedOnboarding(data.has_completed_onboarding ?? false);
            setHasCompletedTour(data.has_completed_tour ?? false);
            // Load data from Supabase DB
            if (data.points !== undefined) _setCoins(data.points);
            if (data.tasks) setTasks(data.tasks);
            if (data.home_config) setHomeSections(data.home_config);
            if (data.placed_items) setPlacedItems(data.placed_items);
            if (data.user_profile) setUserProfile(data.user_profile);
          } else if (error && error.code === 'PGRST116') {
            // New user (not found)
            setHasCompletedOnboarding(false);
            setHasCompletedTour(false);
            const initialData = {
              id: sbUser.id,
              email: sbUser.email,
              display_name: sbUser.user_metadata?.full_name || 'Focus User',
              points: 0,
              has_completed_onboarding: false,
              has_completed_tour: false,
              home_config: ['focus', 'calendar', 'games'],
              placed_items: placedItems,
              tasks: [
                { id: '1', title: '閱讀天龍八部第二章', dueDate: '2026/06/25', completed: false },
                { id: '2', title: '畢業展作品繳交', dueDate: '2026/08/07', completed: false },
              ],
              user_profile: {
                ...userProfile,
                name: sbUser.user_metadata?.full_name || 'Focus User',
                email: sbUser.email || 'user@example.com',
                registrationDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
              }
            };
            await supabase.from('users').insert(initialData);
            setTasks(initialData.tasks);
            setUserProfile(initialData.user_profile as any);
          } else if (error) {
            console.error("Fetch user error:", error);
          }
        } catch (error) {
          handleSupabaseError(error, OperationType.GET, `users/${sbUser.id}`);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        setIsLoadingData(false);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync state to Supabase when it changes
  useEffect(() => {
    if (!user || isLoadingData) return;
    const syncData = async () => {
      try {
        await supabase.from('users').update({
          points: coins,
          tasks: tasks,
          home_config: homeSections,
          placed_items: placedItems,
          user_profile: userProfile,
          has_completed_onboarding: hasCompletedOnboarding,
          has_completed_tour: hasCompletedTour
        }).eq('id', user.id);
      } catch (error) {
        // Silent fail for background sync or handle if critical
      }
    };
    const timer = setTimeout(syncData, 2000); // Debounce sync
    return () => clearTimeout(timer);
  }, [coins, tasks, homeSections, placedItems, userProfile.level, hasCompletedOnboarding, hasCompletedTour, user, isLoadingData]);

  const MAX_COINS = 9999;

  const setCoins = (updater: React.SetStateAction<number>) => {
    _setCoins(prev => {
      const next = typeof updater === 'function' ? (updater as (prev: number) => number)(prev) : updater;
      return Math.max(0, Math.min(next, MAX_COINS));
    });
  };

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
      
      const emojiCount = placedItems.filter(item => !['📺', '🚽', '🛁', '🚪', '🖼️'].includes(item.char)).length;
      const has10Emojis = emojiCount >= 10;

      const has2Wins = userProfile.winsTowardsNextLevel >= 2;

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
        await supabase.from('users').update({ has_completed_onboarding: true }).eq('id', user.id);
      } catch (error) {
        handleSupabaseError(error, OperationType.UPDATE, `users/${user.id}`);
      }
    }
  };

  const handleTourComplete = async () => {
    setIsTourVisible(false);
    setHasCompletedTour(true);
    if (user) {
      try {
        await supabase.from('users').update({ has_completed_tour: true }).eq('id', user.id);
      } catch (error) {
        handleSupabaseError(error, OperationType.UPDATE, `users/${user.id}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoadingData(true);
      await supabase.auth.signOut();
      
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
      
      await supabase.from('users').delete().eq('id', user.id);
      
      /* Note: True user deletion usually requires admin privileges or an Edge Function in Supabase. */
      /* This will clear the user's data and sign them out locally. */
      await supabase.auth.signOut();
      
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
      alert('刪除帳號失敗，請稍後再試。');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentRoute === AppRoute.PROFILE && hasCompletedTour === false && !isTourVisible) {
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
      {currentRoute !== AppRoute.AI_CHAT && (
        <Navigation currentRoute={currentRoute} navigateTo={navigateTo} fab={renderFAB()} />
      )}
      
      {[AppRoute.GAME_PETS, AppRoute.GAME_RACE, AppRoute.LEADERBOARD].includes(currentRoute) && (
        <GameNavigation currentRoute={currentRoute} navigateTo={navigateTo} />
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  public props: { children: React.ReactNode };
  public state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: 'white' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
