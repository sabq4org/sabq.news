import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import ArticleDetail from "@/pages/ArticleDetail";
import CategoryPage from "@/pages/CategoryPage";
import KeywordPage from "@/pages/KeywordPage";
import NewsPage from "@/pages/NewsPage";
import CategoriesListPage from "@/pages/CategoriesListPage";
import Dashboard from "@/pages/Dashboard";
import ArticleEditor from "@/pages/ArticleEditor";
import ArticlesManagement from "@/pages/ArticlesManagement";
import CategoriesManagement from "@/pages/CategoriesManagement";
import UsersManagement from "@/pages/UsersManagement";
import RolesManagement from "@/pages/RolesManagement";
import Profile from "@/pages/Profile";
import CompleteProfile from "@/pages/CompleteProfile";
import SelectInterests from "@/pages/SelectInterests";
import ThemeManager from "@/pages/ThemeManager";
import ThemeEditor from "@/pages/ThemeEditor";
import NotificationSettings from "@/pages/NotificationSettings";
import Welcome from "@/pages/onboarding/Welcome";
import OnboardingInterests from "@/pages/onboarding/SelectInterests";
import Personalize from "@/pages/onboarding/Personalize";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/news" component={NewsPage} />
      <Route path="/categories" component={CategoriesListPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/keyword/:keyword" component={KeywordPage} />
      <Route path="/article/:slug" component={ArticleDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/articles/:id" component={ArticleEditor} />
      <Route path="/dashboard/articles" component={ArticlesManagement} />
      <Route path="/dashboard/categories" component={CategoriesManagement} />
      <Route path="/dashboard/users" component={UsersManagement} />
      <Route path="/dashboard/roles" component={RolesManagement} />
      <Route path="/dashboard/themes/:id" component={ThemeEditor} />
      <Route path="/dashboard/themes" component={ThemeManager} />
      <Route path="/profile" component={Profile} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/select-interests" component={SelectInterests} />
      <Route path="/notification-settings" component={NotificationSettings} />
      <Route path="/onboarding/welcome" component={Welcome} />
      <Route path="/onboarding/interests" component={OnboardingInterests} />
      <Route path="/onboarding/personalize" component={Personalize} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
