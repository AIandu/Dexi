import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from 'sonner';
import Shell from '@/components/layout/Shell';
import Dashboard from '@/pages/Dashboard';
import ProjectList from '@/pages/projects/ProjectList';
import ProjectDetail from '@/pages/projects/ProjectDetail';
import OutreachList from '@/pages/outreach/OutreachList';
import ContactList from '@/pages/contacts/ContactList';
import GlobalChat from '@/pages/chat/GlobalChat';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Shell>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/projects" component={ProjectList} />
            <Route path="/projects/:id" component={ProjectDetail} />
            <Route path="/outreach" component={OutreachList} />
            <Route path="/contacts" component={ContactList} />
            <Route path="/chat" component={GlobalChat} />
            <Route>
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-bold font-mono">404</h1>
                  <p className="text-muted-foreground">The module you're looking for doesn't exist.</p>
                </div>
              </div>
            </Route>
          </Switch>
        </Shell>
      </WouterRouter>
      <Toaster theme="dark" position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
