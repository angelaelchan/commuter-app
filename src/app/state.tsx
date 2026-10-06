import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from '../data/api';
import type { Quarter } from '../data/types';
import type { CustomRange, DateChoice, Slot } from '../lib/availability';

export type Route =
  | { name: 'home' }
  | { name: 'friends' }
  | { name: 'classes' }
  | { name: 'class'; courseId: string; tab: 'forum' | 'chat' }
  | { name: 'hangout'; step: HangoutStep };

export type HangoutStep = 0 | 1 | 2 | 3 | 4;
export const HANGOUT_STEPS = ['Details', 'Invite', 'Time', 'Place', 'Confirm'] as const;

export type ViewMode = 'list' | 'calendar';

export interface HangoutDraft {
  name: string;
  dateChoice: DateChoice;
  /** Set when dateChoice is 'custom'. */
  customRange?: CustomRange;
  duration: number;
  campus: 'on' | 'off';
  invited: string[];
  /** Earlier invite selections, for Undo. */
  inviteHistory: string[][];
  slot?: Slot;
  placeId?: string;
  /** True after tapping an edit icon on Confirm: steps offer "Save changes" back to Confirm. */
  editing: boolean;
  /** Why the picked time was cleared (shown on the Time step). */
  timeNotice?: string;
}

/** Defaults match the chips pre-selected in the Hangout - Details wireframe. */
const newDraft = (invited: string[] = []): HangoutDraft => ({
  name: '',
  dateChoice: 'this-week',
  duration: 90,
  campus: 'on',
  invited,
  inviteHistory: [],
  editing: false,
});

export interface Toast {
  eventId: string;
  message: string;
}

interface AppState {
  route: Route;
  navigate: (route: Route) => void;

  homeQuery: string;
  setHomeQuery: (q: string) => void;
  classesView: ViewMode;
  setClassesView: (v: ViewMode) => void;
  quarter: Quarter;
  setQuarter: (q: Quarter) => void;
  classesQuery: string;
  setClassesQuery: (q: string) => void;
  friendsView: ViewMode;
  setFriendsView: (v: ViewMode) => void;
  friendsQuery: string;
  setFriendsQuery: (q: string) => void;

  draft: HangoutDraft;
  updateDraft: (patch: Partial<HangoutDraft>) => void;
  startHangout: (friendId?: string) => void;

  toast: Toast | null;
  setToast: (t: Toast | null) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [homeQuery, setHomeQuery] = useState('');
  const [classesView, setClassesView] = useState<ViewMode>('list');
  const [quarter, setQuarter] = useState<Quarter>(api.currentQuarter());
  const [classesQuery, setClassesQuery] = useState('');
  const [friendsView, setFriendsView] = useState<ViewMode>('list');
  const [friendsQuery, setFriendsQuery] = useState('');
  const [draft, setDraft] = useState<HangoutDraft>(newDraft());
  const [toast, setToast] = useState<Toast | null>(null);

  const navigate = useCallback((next: Route) => {
    setRoute(next);
    // Inside the desktop phone frame the screen scrolls, not the window.
    const root = document.querySelector('[data-scroll-root]');
    if (root) root.scrollTop = 0;
    else window.scrollTo(0, 0);
  }, []);

  const updateDraft = useCallback((patch: Partial<HangoutDraft>) => setDraft((d) => ({ ...d, ...patch })), []);

  const startHangout = useCallback(
    (friendId?: string) => {
      setDraft(newDraft(friendId ? [friendId] : []));
      navigate({ name: 'hangout', step: 0 });
    },
    [navigate],
  );

  const value = useMemo<AppState>(
    () => ({
      route, navigate,
      homeQuery, setHomeQuery,
      classesView, setClassesView, quarter, setQuarter, classesQuery, setClassesQuery,
      friendsView, setFriendsView, friendsQuery, setFriendsQuery,
      draft, updateDraft, startHangout,
      toast, setToast,
    }),
    [route, navigate, homeQuery, classesView, quarter, classesQuery, friendsView, friendsQuery, draft, updateDraft, startHangout, toast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider');
  return ctx;
}
