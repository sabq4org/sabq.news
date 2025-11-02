import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

export function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!contentRef.current) return;

    const elements = contentRef.current.querySelectorAll("h2, h3, h4");
    const headingsData: Heading[] = [];

    elements.forEach((element, index) => {
      const id = element.id || `heading-${index}`;
      if (!element.id) {
        element.id = id;
      }

      headingsData.push({
        id,
        text: element.textContent || "",
        level: parseInt(element.tagName[1]),
      });
    });

    setHeadings(headingsData);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [contentRef]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (headings.length === 0) return null;

  return (
    <Card className="sticky top-24">
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center gap-2">
          <List className="h-4 w-4" />
          محتويات المقال
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[60vh]">
          <div className="px-4 pb-4 space-y-1">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className={cn(
                  "w-full text-right text-sm py-2 px-3 rounded-md transition-all duration-200 hover-elevate flex items-start gap-2 group",
                  activeId === heading.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                  heading.level === 3 && "pr-6",
                  heading.level === 4 && "pr-9"
                )}
                data-testid={`toc-item-${heading.id}`}
              >
                <ChevronRight className={cn(
                  "h-3 w-3 mt-0.5 shrink-0 transition-transform",
                  activeId === heading.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )} />
                <span className="flex-1 line-clamp-2">{heading.text}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
