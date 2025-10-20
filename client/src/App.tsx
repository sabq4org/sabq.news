import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import AIChatBot from "@/components/AIChatBot";
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
import EditInterests from "@/pages/EditInterests";
import ThemeManager from "@/pages/ThemeManager";
import ThemeEditor from "@/pages/ThemeEditor";
import NotificationSettings from "@/pages/NotificationSettings";
import Welcome from "@/pages/onboarding/Welcome";
import OnboardingInterests from "@/pages/onboarding/SelectInterests";
import Personalize from "@/pages/onboarding/Personalize";
import Muqtarib from "@/pages/Muqtarib";
import MuqtaribDetail from "@/pages/MuqtaribDetail";
import DashboardMuqtarib from "@/pages/dashboard/DashboardMuqtarib";
import TagsManagement from "@/pages/TagsManagement";
import DailyBrief from "@/pages/DailyBrief";
import MomentByMoment from "@/pages/MomentByMoment";
import ComingSoon from "@/pages/ComingSoon";
import Notifications from "@/pages/Notifications";
import NotificationAdmin from "@/pages/NotificationAdmin";
import RecommendationSettings from "@/pages/recommendation-settings";
import UserNotifications from "@/pages/UserNotifications";
import UserRecommendationSettings from "@/pages/UserRecommendationSettings";
import RecommendationAnalytics from "@/pages/RecommendationAnalytics";
import DashboardComments from "@/pages/DashboardComments";
import MyFollows from "@/pages/MyFollows";
import StoryAdmin from "@/pages/StoryAdmin";
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
      <Route path="/muqtarib/:slug" component={MuqtaribDetail} />
      <Route path="/muqtarib" component={Muqtarib} />
      <Route path="/article/:slug" component={ArticleDetail} />
      <Route path="/dashboard/muqtarib" component={DashboardMuqtarib} />
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
      <Route path="/interests/edit" component={EditInterests} />
      <Route path="/notification-settings" component={NotificationSettings} />
      <Route path="/onboarding/welcome" component={Welcome} />
      <Route path="/onboarding/interests" component={OnboardingInterests} />
      <Route path="/onboarding/personalize" component={Personalize} />
      <Route path="/daily-brief" component={DailyBrief} />
      <Route path="/moment-by-moment" component={MomentByMoment} />
      
      {/* Coming Soon Pages - Routes defined in nav.config.ts but not implemented yet */}
      <Route path="/dashboard/articles/new" component={ComingSoon} />
      <Route path="/dashboard/tags" component={TagsManagement} />
      <Route path="/dashboard/comments" component={DashboardComments} />
      <Route path="/dashboard/ai/summaries" component={ComingSoon} />
      <Route path="/dashboard/ai/deep" component={ComingSoon} />
      <Route path="/dashboard/ai/headlines" component={ComingSoon} />
      <Route path="/dashboard/permissions" component={ComingSoon} />
      <Route path="/dashboard/templates" component={ComingSoon} />
      <Route path="/dashboard/analytics" component={ComingSoon} />
      <Route path="/dashboard/analytics/trending" component={ComingSoon} />
      <Route path="/dashboard/analytics/behavior" component={ComingSoon} />
      <Route path="/dashboard/analytics/ab-tests" component={ComingSoon} />
      <Route path="/dashboard/analytics/recommendations" component={RecommendationAnalytics} />
      <Route path="/dashboard/rss-feeds" component={ComingSoon} />
      <Route path="/dashboard/integrations" component={ComingSoon} />
      <Route path="/dashboard/storage" component={ComingSoon} />
      <Route path="/dashboard/audit-logs" component={ComingSoon} />
      <Route path="/dashboard/profile" component={ComingSoon} />
      <Route path="/dashboard/notifications" component={Notifications} />
      <Route path="/dashboard/notification-admin" component={NotificationAdmin} />
      <Route path="/notifications" component={UserNotifications} />
      <Route path="/recommendation-settings" component={UserRecommendationSettings} />
      <Route path="/my-follows" component={MyFollows} />
      <Route path="/dashboard/story-admin" component={StoryAdmin} />
      
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
          <AIChatBot />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
