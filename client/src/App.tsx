import { Switch, Route, useLocation } from "wouter";
import { queryClient, initializeCsrf } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { LiveRegionProvider } from "@/contexts/LiveRegionContext";
import { VoiceAssistantProvider } from "@/contexts/VoiceAssistantContext";
import { SkipLinks } from "@/components/SkipLinks";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useEffect } from "react";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { VoiceCommandsHelp } from "@/components/VoiceCommandsHelp";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import SetPassword from "@/pages/SetPassword";
import TwoFactorVerify from "@/pages/TwoFactorVerify";
import ArticleDetail from "@/pages/ArticleDetail";
import CategoryPage from "@/pages/CategoryPage";
import KeywordPage from "@/pages/KeywordPage";
import NewsPage from "@/pages/NewsPage";
import CategoriesListPage from "@/pages/CategoriesListPage";
import OpinionPage from "@/pages/OpinionPage";
import OpinionDetailPage from "@/pages/OpinionDetailPage";
import Dashboard from "@/pages/Dashboard";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import ArticleEditor from "@/pages/ArticleEditor";
import ArticlesManagement from "@/pages/ArticlesManagement";
import QuizManagement from "@/pages/dashboard/QuizManagement";
import CategoriesManagement from "@/pages/CategoriesManagement";
import UsersManagement from "@/pages/UsersManagement";
import RolesManagement from "@/pages/RolesManagement";
import Profile from "@/pages/Profile";
import PublicProfile from "@/pages/PublicProfile";
import DiscoverUsers from "@/pages/DiscoverUsers";
import CompleteProfile from "@/pages/CompleteProfile";
import SelectInterests from "@/pages/SelectInterests";
import EditInterests from "@/pages/EditInterests";
import ThemeManager from "@/pages/ThemeManager";
import ThemeEditor from "@/pages/ThemeEditor";
import ThemeSwitcher from "@/pages/dashboard/ThemeSwitcher";
import NotificationSettings from "@/pages/NotificationSettings";
import Welcome from "@/pages/onboarding/Welcome";
import OnboardingInterests from "@/pages/onboarding/SelectInterests";
import Personalize from "@/pages/onboarding/Personalize";
import Muqtarab from "@/pages/Muqtarab";
import MuqtarabDetail from "@/pages/MuqtarabDetail";
import TopicDetail from "@/pages/TopicDetail";
import DashboardMuqtarab from "@/pages/dashboard/DashboardMuqtarab";
import TopicsManagement from "@/pages/dashboard/TopicsManagement";
import TagsManagement from "@/pages/TagsManagement";
import SmartLinksManagement from "@/pages/dashboard/SmartLinksManagement";
import SmartJournalist from "@/pages/dashboard/SmartJournalist";
import TermDetail from "@/pages/TermDetail";
import EntityDetail from "@/pages/EntityDetail";
import DailyBrief from "@/pages/DailyBrief";
import MomentByMoment from "@/pages/MomentByMoment";
import ComingSoon from "@/pages/ComingSoon";
import UserBehavior from "@/pages/UserBehavior";
import AdvancedAnalytics from "@/pages/AdvancedAnalytics";
import Notifications from "@/pages/Notifications";
import NotificationAdmin from "@/pages/NotificationAdmin";
import RecommendationSettings from "@/pages/recommendation-settings";
import UserNotifications from "@/pages/UserNotifications";
import UserRecommendationSettings from "@/pages/UserRecommendationSettings";
import RecommendationAnalytics from "@/pages/RecommendationAnalytics";
import SentimentAnalytics from "@/pages/dashboard/SentimentAnalytics";
import ArticleAnalyticsDashboard from "@/pages/dashboard/ArticleAnalyticsDashboard";
import AIModerationDashboard from "@/pages/admin/AIModerationDashboard";
import MyFollows from "@/pages/MyFollows";
import MyKeywords from "@/pages/MyKeywords";
import StoryAdmin from "@/pages/StoryAdmin";
import SystemSettings from "@/pages/SystemSettings";
import AutoImageSettings from "@/pages/AutoImageSettings";
import ABTestsManagement from "@/pages/ABTestsManagement";
import ABTestDetail from "@/pages/ABTestDetail";
import ReporterProfile from "@/pages/ReporterProfile";
import ActivityLogsPage from "@/pages/dashboard/ActivityLogsPage";
import AboutPage from "@/pages/AboutPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import AccessibilityStatement from "@/pages/AccessibilityStatement";
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
import AudioNewslettersPublic from "@/pages/AudioNewslettersPublic";
import AudioNewsletterAnalytics from "@/pages/AudioNewsletterAnalytics";
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
import MediaLibrary from "@/pages/dashboard/MediaLibrary";
import AITools from "@/pages/dashboard/AITools";
import DataStoryGenerator from "@/pages/DataStoryGenerator";
import AdminLogin from "@/pages/AdminLogin";
import DeepAnalysis from "@/pages/dashboard/DeepAnalysis";
import DeepAnalysisList from "@/pages/dashboard/DeepAnalysisList";
import TasksPage from "@/pages/dashboard/TasksPage";
import DashboardProfile from "@/pages/dashboard/DashboardProfile";
import Omq from "@/pages/Omq";
import OmqDetail from "@/pages/OmqDetail";
import OmqStats from "@/pages/OmqStats";
import CalendarPage from "@/pages/CalendarPage";
import CalendarEventDetail from "@/pages/CalendarEventDetail";
import CalendarEventForm from "@/pages/CalendarEventForm";
import EnglishHome from "@/pages/en/EnglishHome";
import EnglishArticleDetail from "@/pages/en/EnglishArticleDetail";
import EnglishKeywordPage from "@/pages/en/EnglishKeywordPage";
import EnglishArticleEditor from "@/pages/en/EnglishArticleEditor";
import EnglishDashboard from "@/pages/en/EnglishDashboard";
import CommunicationsManagement from "@/pages/dashboard/CommunicationsManagement";
import EnglishNewsPage from "@/pages/en/EnglishNewsPage";
import EnglishCategoriesPage from "@/pages/en/EnglishCategoriesPage";
import EnglishCategoriesListPage from "@/pages/en/EnglishCategoriesListPage";
import EnglishCategoryPage from "@/pages/en/EnglishCategoryPage";
import EnglishUsersPage from "@/pages/en/EnglishUsersPage";
import EnglishArticlesPage from "@/pages/en/EnglishArticlesPage";
import EnglishProfile from "@/pages/en/EnglishProfile";
import EnglishDailyBrief from "@/pages/en/EnglishDailyBrief";
import EnglishNotificationSettings from "@/pages/en/EnglishNotificationSettings";
import EnglishSmartBlocksPage from "@/pages/en/EnglishSmartBlocksPage";
import EnglishQuadCategoriesBlockSettings from "@/pages/en/EnglishQuadCategoriesBlockSettings";
import EnglishReporterProfile from "@/pages/en/EnglishReporterProfile";
import UrduHome from "@/pages/ur/Home";
import UrduCategoryPage from "@/pages/ur/CategoryPage";
import UrduArticleDetail from "@/pages/ur/ArticleDetail";
import UrduCategoriesListPage from "@/pages/ur/UrduCategoriesListPage";
import UrduNewsPage from "@/pages/ur/UrduNewsPage";
import UrduDashboard from "@/pages/ur/dashboard/Dashboard";
import UrduArticlesPage from "@/pages/ur/dashboard/ArticlesPage";
import UrduArticleEditor from "@/pages/ur/dashboard/ArticleEditor";
import UrduCategoriesPage from "@/pages/ur/dashboard/CategoriesPage";
import UrduSmartBlocksPage from "@/pages/ur/dashboard/UrduSmartBlocksPage";
import UrduQuadCategoriesPage from "@/pages/ur/dashboard/UrduQuadCategoriesPage";
import AdvertiserDashboard from "@/pages/dashboard/AdvertiserDashboard";
import CampaignsList from "@/pages/dashboard/ads/CampaignsList";
import CampaignDetail from "@/pages/dashboard/ads/CampaignDetail";
import CampaignEditor from "@/pages/dashboard/ads/CampaignEditor";
import AdAccountPage from "@/pages/dashboard/ads/AdAccountPage";
import CreativesManagement from "@/pages/dashboard/ads/CreativesManagement";
import InventorySlotsManagement from "@/pages/dashboard/ads/InventorySlotsManagement";
import PlacementsManagement from "@/pages/dashboard/ads/PlacementsManagement";
import AdAnalyticsPage from "@/pages/dashboard/ads/AdAnalyticsPage";
import NativeAdsManagement from "@/pages/dashboard/NativeAdsManagement";
import ChatbotPage from "@/pages/ChatbotPage";
import AccessibilityInsights from "@/pages/admin/AccessibilityInsights";
import PublisherDashboard from "@/pages/publisher/PublisherDashboard";
import PublisherArticles from "@/pages/publisher/PublisherArticles";
import CorrespondentRegister from "@/pages/correspondent/CorrespondentRegister";
import CorrespondentApplications from "@/pages/admin/CorrespondentApplications";
import EmailTemplatesPage from "@/pages/admin/EmailTemplatesPage";
import PublisherArticleEditor from "@/pages/publisher/PublisherArticleEditor";
import PublisherCredits from "@/pages/publisher/PublisherCredits";
import AdminPublishers from "@/pages/admin/publishers/AdminPublishers";
import AdminPublisherDetails from "@/pages/admin/publishers/AdminPublisherDetails";
import AdminPublisherArticles from "@/pages/admin/publishers/AdminPublisherArticles";
import AdminPublisherAnalytics from "@/pages/admin/publishers/AdminPublisherAnalytics";
import AIHomePage from "@/pages/ai/AIHomePage";
import AICategoryPage from "@/pages/ai/AICategoryPage";
import AIArticleDetail from "@/pages/ai/AIArticleDetail";
import IFoxArticlesPage from "@/pages/IFoxArticles";
// iFox Admin Dashboard imports
import IFoxDashboard from "@/pages/admin/ifox/IFoxDashboard";
import IFoxContentGenerator from "@/pages/admin/ifox/IFoxContentGenerator";
import IFoxArticles from "@/pages/admin/ifox/IFoxArticles";
import IFoxArticleEditor from "@/pages/admin/ifox/IFoxArticleEditor";
import IFoxMedia from "@/pages/admin/ifox/IFoxMedia";
import IFoxSchedule from "@/pages/admin/ifox/IFoxSchedule";
import IFoxCategory from "@/pages/admin/ifox/IFoxCategory";
import IFoxAnalytics from "@/pages/admin/ifox/IFoxAnalytics";
import IFoxSettings from "@/pages/admin/ifox/IFoxSettings";
import IFoxAITasks from "@/pages/admin/ifox/IFoxAITasks";
import AIManagementDashboard from "@/pages/admin/ifox/ai-management";
import ImageStudio from "@/pages/ifox/ImageStudio";
import InfographicStudio from "@/pages/InfographicStudio";
import LiteFeedPage from "@/pages/lite/LiteFeedPage";
import AdvertiserLanding from "@/pages/AdvertiserLanding";
import AdvertiserCreate from "@/pages/AdvertiserCreate";
import NotFound from "@/pages/not-found";

function ScrollRestoration() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

/**
 * VoiceCommandsManager - Manages global voice commands and help dialog
 */
function VoiceCommandsManager() {
  const { showHelp, setShowHelp } = useVoiceCommands();
  
  return (
    <VoiceCommandsHelp 
      open={showHelp} 
      onOpenChange={setShowHelp} 
    />
  );
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
        <Route path="/en/dashboard/smart-blocks" component={EnglishSmartBlocksPage} />
        <Route path="/en/dashboard/quad-categories" component={EnglishQuadCategoriesBlockSettings} />
        <Route path="/en/dashboard/users" component={EnglishUsersPage} />
        <Route path="/en/dashboard" component={EnglishDashboard} />
        <Route path="/en/profile" component={EnglishProfile} />
        <Route path="/en/daily-brief" component={EnglishDailyBrief} />
        <Route path="/en/notification-settings" component={EnglishNotificationSettings} />
        <Route path="/en/reporter/:slug" component={EnglishReporterProfile} />
        
        {/* Urdu Version Routes */}
        <Route path="/ur" component={UrduHome} />
        <Route path="/ur/news" component={UrduNewsPage} />
        <Route path="/ur/categories" component={UrduCategoriesListPage} />
        <Route path="/ur/category/:slug" component={UrduCategoryPage} />
        <Route path="/ur/article/:slug" component={UrduArticleDetail} />
        <Route path="/ur/dashboard/articles/new" component={UrduArticleEditor} />
        <Route path="/ur/dashboard/articles/:id/edit" component={UrduArticleEditor} />
        <Route path="/ur/dashboard/articles" component={UrduArticlesPage} />
        <Route path="/ur/dashboard/categories" component={UrduCategoriesPage} />
        <Route path="/ur/dashboard/smart-blocks" component={UrduSmartBlocksPage} />
        <Route path="/ur/dashboard/quad-categories" component={UrduQuadCategoriesPage} />
        <Route path="/ur/dashboard" component={UrduDashboard} />
        
        {/* Arabic Version Routes */}
        <Route path="/" component={Home} />
        <Route path="/ar" component={Home} />
        <Route path="/about" component={AboutPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/ar/terms" component={TermsPage} />
      <Route path="/en/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/ar/privacy" component={PrivacyPage} />
      <Route path="/en/privacy" component={PrivacyPage} />
      <Route path="/accessibility-statement" component={AccessibilityStatement} />
      <Route path="/ar/accessibility-statement" component={AccessibilityStatement} />
      <Route path="/en/accessibility-statement" component={AccessibilityStatement} />
      <Route path="/ai-publisher" component={AIPublisher} />
      <Route path="/ai-policy" component={AIPolicy} />
      <Route path="/news" component={NewsPage} />
      <Route path="/opinion" component={OpinionPage} />
      <Route path="/opinion/:slug" component={OpinionDetailPage} />
      <Route path="/categories" component={CategoriesListPage} />
      <Route path="/shorts" component={ShortsPage} />
      <Route path="/lite" component={LiteFeedPage} />
      <Route path="/login" component={Login} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/set-password" component={SetPassword} />
      <Route path="/2fa-verify" component={TwoFactorVerify} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/keyword/:keyword" component={KeywordPage} />
      <Route path="/muqtarab/:angleSlug/topic/:topicSlug" component={TopicDetail} />
      <Route path="/muqtarab/:slug" component={MuqtarabDetail} />
      <Route path="/muqtarab" component={Muqtarab} />
      
      {/* Omq (Deep Analysis) public pages */}
      <Route path="/omq/stats" component={OmqStats} />
      <Route path="/omq/:id" component={OmqDetail} />
      <Route path="/omq" component={Omq} />
      
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
      <Route path="/chatbot" component={ChatbotPage} />
      
      {/* Advertiser self-service routes */}
      <Route path="/advertise/create" component={AdvertiserCreate} />
      <Route path="/advertise" component={AdvertiserLanding} />
      
      {/* AI/iFox Routes */}
      <Route path="/ai" component={AIHomePage} />
      <Route path="/ai/category/:category" component={AICategoryPage} />
      <Route path="/ai/article/:slug" component={AIArticleDetail} />
      <Route path="/ifox" component={IFoxArticlesPage} />
      
      {/* iFox Admin Dashboard Routes */}
      <Route path="/admin" component={IFoxDashboard} />
      <Route path="/admin/ai/infographic/studio" component={InfographicStudio} />
      <Route path="/admin/ifox/dashboard" component={IFoxDashboard} />
      <Route path="/admin/ifox/articles" component={IFoxArticles} />
      <Route path="/admin/ifox/articles/new" component={IFoxArticleEditor} />
      <Route path="/admin/ifox/articles/:id/edit" component={IFoxArticleEditor} />
      <Route path="/admin/ifox/media" component={IFoxMedia} />
      <Route path="/admin/ifox/schedule" component={IFoxSchedule} />
      <Route path="/admin/ifox/categories" component={IFoxCategory} />
      <Route path="/admin/ifox/analytics" component={IFoxAnalytics} />
      <Route path="/admin/ifox/settings" component={IFoxSettings} />
      <Route path="/admin/ifox/image-studio" component={ImageStudio} />
      <Route path="/admin/ifox/ai-tasks" component={IFoxAITasks} />
      <Route path="/admin/ifox/ai-management" component={AIManagementDashboard} />
      
      <Route path="/reporter/:slug" component={ReporterProfile} />
      
      {/* Smart Links pages */}
      <Route path="/term/:identifier" component={TermDetail} />
      <Route path="/entity/:slug" component={EntityDetail} />
      
      {/* Audio Newsletters public pages */}
      <Route path="/audio-newsletters" component={AudioNewslettersPublic} />
      <Route path="/audio-newsletters/:id" component={AudioNewsletterDetail} />
      
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
      
      <Route path="/dashboard/muqtarab" component={DashboardMuqtarab} />
      <Route path="/dashboard/muqtarab/angles/:angleId/topics" component={TopicsManagement} />
      <Route path="/dashboard/smart-blocks" component={SmartBlocksPage} />
      
      {/* Audio Newsletters dashboard */}
      <Route path="/dashboard/audio-newsletters" component={AudioNewslettersDashboard} />
      <Route path="/dashboard/audio-newsletters/analytics" component={AudioNewsletterAnalytics} />
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
      
      {/* Shorts dashboard - restricted from reporters */}
      <Route path="/dashboard/shorts">
        {() => (
          <ProtectedRoute requireStaff={true} excludeRoles={["reporter"]}>
            <ShortsManagement />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dashboard/shorts/new">
        {() => (
          <ProtectedRoute requireStaff={true} excludeRoles={["reporter"]}>
            <ShortsEditor />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dashboard/shorts/:id">
        {(params) => (
          <ProtectedRoute requireStaff={true} excludeRoles={["reporter"]}>
            <ShortsEditor />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Quad Categories Block Settings */}
      <Route path="/dashboard/blocks/quad-categories" component={QuadCategoriesBlockSettings} />
      
      {/* Smart Categories Management */}
      <Route path="/dashboard/smart-categories" component={SmartCategoriesManagement} />
      
      {/* Calendar */}
      <Route path="/dashboard/calendar" component={CalendarPage} />
      <Route path="/dashboard/calendar/:action" component={CalendarEventForm} />
      <Route path="/dashboard/calendar/events/:id" component={CalendarEventDetail} />
      <Route path="/dashboard/calendar/events/:id/edit" component={CalendarEventForm} />
      
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/analytics" component={AnalyticsDashboard} />
      {/* Article Analytics - restricted from reporters */}
      <Route path="/dashboard/article-analytics">
        {() => (
          <ProtectedRoute requireStaff={true} excludeRoles={["reporter"]}>
            <ArticleAnalyticsDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dashboard/articles/new" component={ArticleEditor} />
      <Route path="/dashboard/article/new" component={ArticleEditor} />
      <Route path="/dashboard/articles/:id" component={ArticleEditor} />
      <Route path="/dashboard/articles" component={ArticlesManagement} />
      <Route path="/dashboard/quizzes" component={QuizManagement} />
      <Route path="/dashboard/opinion" component={OpinionManagement} />
      <Route path="/dashboard/categories" component={CategoriesManagement} />
      <Route path="/dashboard/media-library" component={MediaLibrary} />
      <Route path="/dashboard/ai-tools" component={AITools} />
      {/* Infographic Studio - restricted from reporters */}
      <Route path="/dashboard/infographic-studio">
        {() => (
          <ProtectedRoute requireStaff={true} excludeRoles={["reporter"]}>
            <InfographicStudio />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dashboard/users" component={UsersManagement} />
      <Route path="/dashboard/roles" component={RolesManagement} />
      
      {/* Advertising Dashboard - Arabic only */}
      <Route path="/dashboard/ads" component={AdvertiserDashboard} />
      <Route path="/dashboard/ads/campaigns" component={CampaignsList} />
      <Route path="/dashboard/ads/campaigns/new" component={CampaignEditor} />
      <Route path="/dashboard/ads/campaigns/:id/edit" component={CampaignEditor} />
      <Route path="/dashboard/ads/campaigns/:campaignId/placements" component={PlacementsManagement} />
      <Route path="/dashboard/ads/campaigns/:id" component={CampaignDetail} />
      <Route path="/dashboard/ads/creatives" component={CreativesManagement} />
      <Route path="/dashboard/ads/inventory-slots" component={InventorySlotsManagement} />
      <Route path="/dashboard/ads/analytics" component={AdAnalyticsPage} />
      <Route path="/dashboard/ads/account" component={AdAccountPage} />
      <Route path="/dashboard/native-ads">
        {() => (
          <ProtectedRoute requireStaff={true} requireRoles={["admin", "editor"]}>
            <NativeAdsManagement />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dashboard/themes/switcher" component={ThemeSwitcher} />
      <Route path="/dashboard/themes/:id" component={ThemeEditor} />
      <Route path="/dashboard/themes" component={ThemeManager} />
      <Route path="/profile/:userId" component={PublicProfile} />
      <Route path="/profile" component={Profile} />
      <Route path="/discover-users" component={DiscoverUsers} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/select-interests" component={SelectInterests} />
      <Route path="/interests/edit" component={EditInterests} />
      <Route path="/notification-settings" component={NotificationSettings} />
      
      {/* Publisher Dashboard Routes */}
      <Route path="/dashboard/publisher" component={PublisherDashboard} />
      <Route path="/dashboard/publisher/articles" component={PublisherArticles} />
      <Route path="/dashboard/publisher/article/new" component={PublisherArticleEditor} />
      <Route path="/dashboard/publisher/article/:id/edit" component={PublisherArticleEditor} />
      <Route path="/dashboard/publisher/credits" component={PublisherCredits} />
      
      {/* Admin Publisher Management Routes */}
      <Route path="/dashboard/admin/publishers" component={AdminPublishers} />
      <Route path="/dashboard/admin/publishers/:id" component={AdminPublisherDetails} />
      <Route path="/dashboard/admin/publisher-articles" component={AdminPublisherArticles} />
      <Route path="/dashboard/admin/publisher-analytics" component={AdminPublisherAnalytics} />
      
      {/* Correspondent Registration Routes */}
      <Route path="/correspondent/register" component={CorrespondentRegister} />
      <Route path="/dashboard/correspondents" component={CorrespondentApplications} />
      
      {/* iFox Admin Dashboard Routes */}
      <Route path="/dashboard/admin/ifox" component={IFoxDashboard} />
      <Route path="/dashboard/admin/ifox/content-generator" component={IFoxContentGenerator} />
      <Route path="/dashboard/admin/ifox/articles" component={IFoxArticles} />
      <Route path="/dashboard/admin/ifox/articles/new" component={IFoxArticleEditor} />
      <Route path="/dashboard/admin/ifox/articles/edit/:id" component={IFoxArticleEditor} />
      <Route path="/dashboard/admin/ifox/categories/:slug" component={IFoxCategory} />
      <Route path="/dashboard/admin/ifox/media" component={IFoxMedia} />
      <Route path="/dashboard/admin/ifox/image-studio" component={ImageStudio} />
      <Route path="/dashboard/admin/ifox/schedule" component={IFoxSchedule} />
      <Route path="/dashboard/admin/ifox/analytics" component={IFoxAnalytics} />
      <Route path="/dashboard/admin/ifox/settings" component={IFoxSettings} />
      <Route path="/dashboard/admin/ifox/ai-management" component={AIManagementDashboard} />
      <Route path="/dashboard/admin/ifox/ai-tasks" component={IFoxAITasks} />
      
      {/* Onboarding routes - Arabic */}
      <Route path="/ar/onboarding/welcome" component={Welcome} />
      <Route path="/ar/onboarding/interests" component={OnboardingInterests} />
      <Route path="/ar/onboarding/personalize" component={Personalize} />
      
      {/* Onboarding routes - Legacy (without /ar/) */}
      <Route path="/onboarding/welcome" component={Welcome} />
      <Route path="/onboarding/interests" component={OnboardingInterests} />
      <Route path="/onboarding/personalize" component={Personalize} />
      
      <Route path="/daily-brief" component={DailyBrief} />
      <Route path="/moment-by-moment" component={MomentByMoment} />
      
      {/* Coming Soon Pages - Routes defined in nav.config.ts but not implemented yet */}
      <Route path="/dashboard/tags" component={TagsManagement} />
      <Route path="/dashboard/smart-links" component={SmartLinksManagement} />
      <Route path="/dashboard/ai-moderation" component={AIModerationDashboard} />
      <Route path="/dashboard/data-stories" component={DataStoryGenerator} />
      <Route path="/dashboard/smart-journalist" component={SmartJournalist} />
      <Route path="/dashboard/tasks" component={TasksPage} />
      <Route path="/dashboard/ai/summaries" component={ComingSoon} />
      <Route path="/dashboard/ai/deep-analysis-list" component={DeepAnalysisList} />
      <Route path="/dashboard/ai/deep" component={DeepAnalysis} />
      <Route path="/dashboard/ai/headlines" component={ComingSoon} />
      <Route path="/dashboard/permissions" component={ComingSoon} />
      <Route path="/dashboard/templates" component={ComingSoon} />
      <Route path="/dashboard/analytics" component={ComingSoon} />
      <Route path="/dashboard/analytics/trending" component={ComingSoon} />
      <Route path="/dashboard/analytics/behavior" component={UserBehavior} />
      <Route path="/dashboard/analytics/advanced" component={AdvancedAnalytics} />
      <Route path="/dashboard/analytics/ab-tests/:id" component={ABTestDetail} />
      <Route path="/dashboard/analytics/ab-tests" component={ABTestsManagement} />
      <Route path="/dashboard/analytics/recommendations" component={RecommendationAnalytics} />
      <Route path="/dashboard/sentiment-analytics" component={SentimentAnalytics} />
      <Route path="/dashboard/rss-feeds" component={ComingSoon} />
      <Route path="/dashboard/integrations" component={ComingSoon} />
      <Route path="/dashboard/storage" component={ComingSoon} />
      <Route path="/dashboard/audit-logs" component={ActivityLogsPage} />
      <Route path="/dashboard/profile" component={DashboardProfile} />
      <Route path="/dashboard/notifications" component={Notifications} />
      <Route path="/dashboard/notification-admin" component={NotificationAdmin} />
      <Route path="/dashboard/email-templates" component={EmailTemplatesPage} />
      <Route path="/notifications" component={UserNotifications} />
      <Route path="/recommendation-settings" component={UserRecommendationSettings} />
      <Route path="/my-follows" component={MyFollows} />
      <Route path="/my-keywords" component={MyKeywords} />
      <Route path="/dashboard/story-admin" component={StoryAdmin} />
      <Route path="/dashboard/system-settings" component={SystemSettings} />
      <Route path="/dashboard/auto-image-settings" component={AutoImageSettings} />
      <Route path="/dashboard/communications" component={CommunicationsManagement} />
      
      {/* Legacy redirects */}
      <Route path="/dashboard/email-agent" component={CommunicationsManagement} />
      <Route path="/admin/whatsapp" component={CommunicationsManagement} />
      
      {/* Admin Routes */}
      <Route path="/admin/accessibility-insights" component={AccessibilityInsights} />
      
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  useEffect(() => {
    initializeCsrf();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <AccessibilityProvider>
            <LiveRegionProvider>
              <VoiceAssistantProvider>
                <TooltipProvider>
                  <SkipLinks />
                  <Toaster />
                  <VoiceCommandsManager />
                  <div id="main-content" tabIndex={-1}>
                    <Router />
                  </div>
                </TooltipProvider>
              </VoiceAssistantProvider>
            </LiveRegionProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
