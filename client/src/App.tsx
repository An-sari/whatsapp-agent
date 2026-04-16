import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Conversations from "./pages/Conversations";
import AgentConfig from "./pages/AgentConfig";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import Integrations from "./pages/Integrations";
import KnowledgeBase from "./pages/KnowledgeBase";
import NurtureSequences from "./pages/NurtureSequences";
import Broadcasts from "./pages/Broadcasts";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/conversations"} component={Conversations} />
      <Route path={"/contacts"} component={Contacts} />
      <Route path={"/contacts/:id"} component={ContactDetail} />
      <Route path={"/broadcasts"} component={Broadcasts} />
      <Route path={"/integrations"} component={Integrations} />
      <Route path={"/agent-config"} component={AgentConfig} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/knowledge-base"} component={KnowledgeBase} />
      <Route path={"/nurture-sequences"} component={NurtureSequences} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
