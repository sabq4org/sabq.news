export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-4 right-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
        data-testid="skip-link-main"
      >
        انتقل إلى المحتوى الرئيسي
      </a>
      <a
        href="#main-nav"
        className="fixed top-16 right-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
        data-testid="skip-link-nav"
      >
        انتقل إلى القائمة
      </a>
      <a
        href="#footer"
        className="fixed top-28 right-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
        data-testid="skip-link-footer"
      >
        انتقل إلى التذييل
      </a>
    </div>
  );
}
