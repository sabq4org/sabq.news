import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ChatWebSocketProvider } from "@/contexts/ChatWebSocketContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AIChatBot from "@/components/AIChatBot";
import { useEffect } from "react";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import TwoFactorVerify from "@/pages/TwoFactorVerify";
import ArticleDetail from "@/pages/ArticleDetail";
import CategoryPage from "@/pages/CategoryPage";
import KeywordPage from "@/pages/KeywordPage";
import NewsPage from "@/pages/NewsPage";
import CategoriesListPage from "@/pages/CategoriesListPage";
import OpinionPage from "@/pages/OpinionPage";
import OpinionDetailPage from "@/pages/OpinionDetailPage";
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
import SmartLinksManagement from "@/pages/dashboard/SmartLinksManagement";
import TermDetail from "@/pages/TermDetail";
import EntityDetail from "@/pages/EntityDetail";
import DailyBrief from "@/pages/DailyBrief";
import MomentByMoment from "@/pages/MomentByMoment";
import ComingSoon from "@/pages/ComingSoon";
import UserBehavior from "@/pages/UserBehavior";
import Notifications from "@/pages/Notifications";
import NotificationAdmin from "@/pages/NotificationAdmin";
import RecommendationSettings from "@/pages/recommendation-settings";
import UserNotifications from "@/pages/UserNotifications";
import UserRecommendationSettings from "@/pages/UserRecommendationSettings";
import RecommendationAnalytics from "@/pages/RecommendationAnalytics";
import DashboardComments from "@/pages/DashboardComments";
import MyFollows from "@/pages/MyFollows";
import MyKeywords from "@/pages/MyKeywords";
import StoryAdmin from "@/pages/StoryAdmin";
import SystemSettings from "@/pages/SystemSettings";
import ABTestsManagement from "@/pages/ABTestsManagement";
import ABTestDetail from "@/pages/ABTestDetail";
import ReporterProfile from "@/pages/ReporterProfile";
import ActivityLogsPage from "@/pages/dashboard/ActivityLogsPage";
import AboutPage from "@/pages/AboutPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import MirqabPage from "@/pages/MirqabPage";
import SabqIndexListPage from "@/pages/mirqab/SabqIndexListPage";
import SabqIndexDetailPage from "@/pages/mirqab/SabqIndexDetailPage";
import NextStoriesListPage from "@/pages/mirqab/NextStoriesListPage";
import NextStoryDetailPage from "@/pages/mirqab/NextStoryDetailPage";
import RadarListPage from "@/pages/mirqab/RadarListPage";
import RadarDetailPage from "@/pages/mirqab/RadarDetailPage";
import AlgorithmWritesListPage from "@/pages/mirqab/AlgorithmWritesListPage";
import AlgorithmWriteDetailPage from "@/pages/mirqab/AlgorithmWriteDetailPage";
import MirqabDashboard from "@/pages/dashboard/MirqabDashboard";
import CreateSabqIndex from "@/pages/dashboard/mirqab/CreateSabqIndex";
import CreateNextStory from "@/pages/dashboard/mirqab/CreateNextStory";
import CreateRadar from "@/pages/dashboard/mirqab/CreateRadar";
import CreateAlgorithmWrite from "@/pages/dashboard/mirqab/CreateAlgorithmWrite";
import SmartBlocksPage from "@/pages/dashboard/SmartBlocksPage";
import AudioNewslettersDashboard from "@/pages/AudioNewslettersDashboard";
import AudioNewsletterEditor from "@/pages/AudioNewsletterEditor";
import AudioNewslettersArchive from "@/pages/AudioNewslettersArchive";
import AudioNewsletterDetail from "@/pages/AudioNewsletterDetail";
import AudioBriefsDashboard from "@/pages/AudioBriefsDashboard";
import AudioBriefEditor from "@/pages/AudioBriefEditor";
import AnnouncementsList from "@/pages/AnnouncementsList";
import AnnouncementDetail from "@/pages/AnnouncementDetail";
import AnnouncementEditor from "@/pages/AnnouncementEditor";
import AnnouncementsArchive from "@/pages/AnnouncementsArchive";
import AnnouncementVersions from "@/pages/AnnouncementVersions";
import AnnouncementAnalytics from "@/pages/AnnouncementAnalytics";
import AIPublisher from "@/pages/AIPublisher";
import AIPolicy from "@/pages/AIPolicy";
import ShortsPage from "@/pages/ShortsPage";
import ShortsManagement from "@/pages/ShortsManagement";
import ShortsEditor from "@/pages/ShortsEditor";
import QuadCategoriesBlockSettings from "@/pages/QuadCategoriesBlockSettings";
import SmartCategoriesManagement from "@/pages/SmartCategoriesManagement";
import OpinionManagement from "@/pages/dashboard/OpinionManagement";
import Chat from "@/pages/dashboard/Chat";
import ChatAdmin from "@/pages/dashboard/ChatAdmin";
import MediaLibrary from "@/pages/dashboard/MediaLibrary";
import AdminLogin from "@/pages/AdminLogin";
import CalendarPage from "@/pages/CalendarPage";
import CalendarEventDetail from "@/pages/CalendarEventDetail";
import CalendarEventForm from "@/pages/CalendarEventForm";
import EnglishHome from "@/pages/en/EnglishHome";
import EnglishArticleDetail from "@/pages/en/EnglishArticleDetail";
import EnglishKeywordPage from "@/pages/en/EnglishKeywordPage";
import EnglishArticleEditor from "@/pages/en/EnglishArticleEditor";
import EnglishDashboard from "@/pages/en/EnglishDashboard";
import EnglishNewsPage from "@/pages/en/EnglishNewsPage";
import EnglishCategoriesPage from "@/pages/en/EnglishCategoriesPage";
import EnglishCategoriesListPage from "@/pages/en/EnglishCategoriesListPage";
import EnglishCategoryPage from "@/pages/en/EnglishCategoryPage";
import EnglishCommentsPage from "@/pages/en/EnglishCommentsPage";
import EnglishUsersPage from "@/pages/en/EnglishUsersPage";
import EnglishArticlesPage from "@/pages/en/EnglishArticlesPage";
import EnglishProfile from "@/pages/en/EnglishProfile";
import EnglishDailyBrief from "@/pages/en/EnglishDailyBrief";
import EnglishNotificationSettings from "@/pages/en/EnglishNotificationSettings";
import EnglishSmartBlocksPage from "@/pages/en/EnglishSmartBlocksPage";
import EnglishQuadCategoriesBlockSettings from "@/pages/en/EnglishQuadCategoriesBlockSettings";
import NotFound from "@/pages/not-found";

function ScrollRestoration() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollRestoration />
      <Switch>
        {/* English Version Routes */}
        <Route path="/en" component={EnglishHome} />
        <Route path="/en/news" component={EnglishNewsPage} />
        <Route path="/en/categories" component={EnglishCategoriesListPage} />
        <Route path="/en/category/:slug" component={EnglishCategoryPage} />
        <Route path="/en/keyword/:keyword" component={EnglishKeywordPage} />
        <Route path="/en/article/:slug" component={EnglishArticleDetail} />
        <Route path="/en/dashboard/articles/new" component={EnglishArticleEditor} />
        <Route path="/en/dashboard/articles/:id/edit" component={EnglishArticleEditor} />
        <Route path="/en/dashboard/articles" component={EnglishArticlesPage} />
        <Route path="/en/dashboard/categories" component={EnglishCategoriesPage} />
        <Route path="/en/dashboard/comments" component={EnglishCommentsPage} />
        <Route path="/en/dashboard/smart-blocks" component={EnglishSmartBlocksPage} />
        <Route path="/en/dashboard/quad-categories" component={EnglishQuadCategoriesBlockSettings} />
        <Route path="/en/dashboard/users" component={EnglishUsersPage} />
        <Route path="/en/dashboard" component={EnglishDashboard} />
        <Route path="/en/profile" component={EnglishProfile} />
        <Route path="/en/daily-brief" component={EnglishDailyBrief} />
        <Route path="/en/notification-settings" component={EnglishNotificationSettings} />
        
        {/* Arabic Version Routes */}
        <Route path="/" component={Home} />
        <Route path="/ar" component={Home} />
        <Route path="/about" component={AboutPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/ai-publisher" component={AIPublisher} />
      <Route path="/ai-policy" component={AIPolicy} />
      <Route path="/news" component={NewsPage} />
      <Route path="/opinion" component={OpinionPage} />
      <Route path="/opinion/:slug" component={OpinionDetailPage} />
      <Route path="/categories" component={CategoriesListPage} />
      <Route path="/shorts" component={ShortsPage} />
      <Route path="/login" component={Login} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/2fa-verify" component={TwoFactorVerify} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/keyword/:keyword" component={KeywordPage} />
      <Route path="/muqtarib/:slug" component={MuqtaribDetail} />
      <Route path="/muqtarib" component={Muqtarib} />
      
      {/* Mirqab public pages */}
      <Route path="/mirqab" component={MirqabPage} />
      <Route path="/mirqab/sabq-index" component={SabqIndexListPage} />
      <Route path="/mirqab/sabq-index/:slug" component={SabqIndexDetailPage} />
      <Route path="/mirqab/next-stories" component={NextStoriesListPage} />
      <Route path="/mirqab/next-stories/:slug" component={NextStoryDetailPage} />
      <Route path="/mirqab/radar" component={RadarListPage} />
      <Route path="/mirqab/radar/:slug" component={RadarDetailPage} />
      <Route path="/mirqab/algorithm-writes" component={AlgorithmWritesListPage} />
      <Route path="/mirqab/algorithm-writes/:slug" component={AlgorithmWriteDetailPage} />
      
      <Route path="/article/:slug" component={ArticleDetail} />
      <Route path="/reporter/:slug" component={ReporterProfile} />
      
      {/* Smart Links pages */}
      <Route path="/term/:identifier" component={TermDetail} />
      <Route path="/entity/:slug" component={EntityDetail} />
      
      {/* Audio Newsletters public pages */}
      <Route path="/audio-newsletters" component={AudioNewslettersArchive} />
      <Route path="/audio-newsletters/:slug" component={AudioNewsletterDetail} />
      
      {/* Mirqab dashboard */}
      <Route path="/dashboard/mirqab" component={MirqabDashboard} />
      <Route path="/dashboard/mirqab/sabq-index/new" component={CreateSabqIndex} />
      <Route path="/dashboard/mirqab/sabq-index/:id/edit" component={CreateSabqIndex} />
      <Route path="/dashboard/mirqab/next-stories/new" component={CreateNextStory} />
      <Route path="/dashboard/mirqab/next-stories/:id/edit" component={CreateNextStory} />
      <Route path="/dashboard/mirqab/radar/new" component={CreateRadar} />
      <Route path="/dashboard/mirqab/radar/:id/edit" component={CreateRadar} />
      <Route path="/dashboard/mirqab/algorithm-writes/new" component={CreateAlgorithmWrite} />
      <Route path="/dashboard/mirqab/algorithm-writes/:id/edit" component={CreateAlgorithmWrite} />
      
      <Route path="/dashboard/muqtarib" component={DashboardMuqtarib} />
      <Route path="/dashboard/smart-blocks" component={SmartBlocksPage} />
      
      {/* Audio Newsletters dashboard */}
      <Route path="/dashboard/audio-newsletters" component={AudioNewslettersDashboard} />
      <Route path="/dashboard/audio-newsletters/create" component={AudioNewsletterEditor} />
      <Route path="/dashboard/audio-newsletters/:id/edit" component={AudioNewsletterEditor} />
      
      {/* Audio Briefs dashboard */}
      <Route path="/dashboard/audio-briefs" component={AudioBriefsDashboard} />
      <Route path="/dashboard/audio-briefs/create" component={AudioBriefEditor} />
      <Route path="/dashboard/audio-briefs/:id" component={AudioBriefEditor} />
      
      {/* Internal Announcements dashboard */}
      <Route path="/dashboard/announcements" component={AnnouncementsList} />
      <Route path="/dashboard/announcements/new" component={AnnouncementEditor} />
      <Route path="/dashboard/announcements/archive" component={AnnouncementsArchive} />
      <Route path="/dashboard/announcements/:id/edit" component={AnnouncementEditor} />
      <Route path="/dashboard/announcements/:id/versions" component={AnnouncementVersions} />
      <Route path="/dashboard/announcements/:id/analytics" component={AnnouncementAnalytics} />
      <Route path="/dashboard/announcements/:id" component={AnnouncementDetail} />
      
      {/* Shorts dashboard */}
      <Route path="/dashboard/shorts" component={ShortsManagement} />
      <Route path="/dashboard/shorts/new" component={ShortsEditor} />
      <Route path="/dashboard/shorts/:id" component={ShortsEditor} />
      
      {/* Quad Categories Block Settings */}
      <Route path="/dashboard/blocks/quad-categories" component={QuadCategoriesBlockSettings} />
      
      {/* Smart Categories Management */}
      <Route path="/dashboard/smart-categories" component={SmartCategoriesManagement} />
      
      {/* Chat */}
      <Route path="/dashboard/chat" component={Chat} />
      <Route path="/dashboard/chat-admin" component={ChatAdmin} />
      
      {/* Calendar */}
      <Route path="/dashboard/calendar" component={CalendarPage} />
      <Route path="/dashboard/calendar/:action" component={CalendarEventForm} />
      <Route path="/dashboard/calendar/events/:id" component={CalendarEventDetail} />
      <Route path="/dashboard/calendar/events/:id/edit" component={CalendarEventForm} />
      
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/articles/new" component={ArticleEditor} />
      <Route path="/dashboard/article/new" component={ArticleEditor} />
      <Route path="/dashboard/articles/:id" component={ArticleEditor} />
      <Route path="/dashboard/articles" component={ArticlesManagement} />
      <Route path="/dashboard/opinion" component={OpinionManagement} />
      <Route path="/dashboard/categories" component={CategoriesManagement} />
      <Route path="/dashboard/media-library" component={MediaLibrary} />
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
      <Route path="/dashboard/tags" component={TagsManagement} />
      <Route path="/dashboard/smart-links" component={SmartLinksManagement} />
      <Route path="/dashboard/comments" component={DashboardComments} />
      <Route path="/dashboard/ai/summaries" component={ComingSoon} />
      <Route path="/dashboard/ai/deep" component={ComingSoon} />
      <Route path="/dashboard/ai/headlines" component={ComingSoon} />
      <Route path="/dashboard/permissions" component={ComingSoon} />
      <Route path="/dashboard/templates" component={ComingSoon} />
      <Route path="/dashboard/analytics" component={ComingSoon} />
      <Route path="/dashboard/analytics/trending" component={ComingSoon} />
      <Route path="/dashboard/analytics/behavior" component={UserBehavior} />
      <Route path="/dashboard/analytics/ab-tests/:id" component={ABTestDetail} />
      <Route path="/dashboard/analytics/ab-tests" component={ABTestsManagement} />
      <Route path="/dashboard/analytics/recommendations" component={RecommendationAnalytics} />
      <Route path="/dashboard/rss-feeds" component={ComingSoon} />
      <Route path="/dashboard/integrations" component={ComingSoon} />
      <Route path="/dashboard/storage" component={ComingSoon} />
      <Route path="/dashboard/audit-logs" component={ActivityLogsPage} />
      <Route path="/dashboard/profile" component={ComingSoon} />
      <Route path="/dashboard/notifications" component={Notifications} />
      <Route path="/dashboard/notification-admin" component={NotificationAdmin} />
      <Route path="/notifications" component={UserNotifications} />
      <Route path="/recommendation-settings" component={UserRecommendationSettings} />
      <Route path="/my-follows" component={MyFollows} />
      <Route path="/my-keywords" component={MyKeywords} />
      <Route path="/dashboard/story-admin" component={StoryAdmin} />
      <Route path="/dashboard/system-settings" component={SystemSettings} />
      
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <ChatWebSocketProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
              <AIChatBot />
            </TooltipProvider>
          </ChatWebSocketProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
