import { AppStateProvider, useApp } from './app/state';
import { ClassPage } from './screens/ClassPage';
import { Classes } from './screens/Classes';
import { Friends } from './screens/Friends';
import { Hangout } from './screens/Hangout';
import { Home } from './screens/Home';

function Router() {
  const { route } = useApp();
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'friends':
      return <Friends />;
    case 'classes':
      return <Classes />;
    case 'class':
      return <ClassPage courseId={route.courseId} tab={route.tab} />;
    case 'hangout':
      return <Hangout step={route.step} />;
  }
}

export default function App() {
  return (
    <AppStateProvider>
      <Router />
    </AppStateProvider>
  );
}
