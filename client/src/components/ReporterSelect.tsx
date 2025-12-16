import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";
import { useAuth, hasRole } from "@/hooks/useAuth";

interface Reporter {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface ReporterSelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function ReporterSelect({ value, onChange, disabled }: ReporterSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  // Check if current user is a reporter (not admin/editor)
  const isReporterRole = useMemo(() => {
    if (!user) return false;
    // If user has admin, system_admin, super_admin, editor, or chief_editor role, they can select any reporter
    const canSelectOthers = hasRole(user, 'admin', 'system_admin', 'super_admin', 'superadmin', 'editor', 'chief_editor');
    // If user is a reporter but not an admin/editor, they can only select themselves
    const isOnlyReporter = hasRole(user, 'reporter') && !canSelectOthers;
    return isOnlyReporter;
  }, [user]);
  
  // Auto-set reporter ID to current user's ID if they're a reporter
  useEffect(() => {
    if (isReporterRole && user?.id && !value) {
      onChange(user.id);
    }
  }, [isReporterRole, user?.id, value, onChange]);

  const { data: reportersData, isLoading } = useQuery<{ items: Reporter[] }>({
    queryKey: ["/api/admin/users", { role: "reporter", query: searchQuery, limit: 200 }],
    queryFn: async () => {
      const params = new URLSearchParams({
        role: "reporter",
        limit: "200",
        ...(searchQuery && { query: searchQuery }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("فشل في جلب المراسلين");
      return res.json();
    },
    enabled: !isReporterRole, // Only fetch all reporters if user can select others
  });

  const { data: selectedReporterData } = useQuery<{ items: Reporter[] }>({
    queryKey: ["/api/admin/users", { ids: value ? [value] : [] }],
    queryFn: async () => {
      if (!value) return { items: [] };
      const res = await fetch(`/api/admin/users?ids=${value}`);
      if (!res.ok) throw new Error("فشل في جلب بيانات المراسل");
      return res.json();
    },
    enabled: !!value,
  });

  const reporters = useMemo(() => {
    // If user is a reporter-only, show only their own data
    if (isReporterRole && user) {
      return [{
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email || 'المراسل',
        email: user.email || '',
        avatarUrl: user.profileImageUrl || null,
      }];
    }
    
    const searchResults = reportersData?.items || [];
    const selected = selectedReporterData?.items?.[0];
    
    if (selected && !searchResults.find(r => r.id === selected.id)) {
      return [selected, ...searchResults];
    }
    
    return searchResults;
  }, [reportersData, selectedReporterData, isReporterRole, user]);
  
  const selectedReporter = useMemo(() => {
    return reporters.find((r) => r.id === value);
  }, [reporters, value]);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" data-testid="label-reporter">
        المراسل
      </label>
      
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled || isReporterRole}
              data-testid="button-reporter-select"
            >
              {selectedReporter ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedReporter.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(selectedReporter.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{selectedReporter.name}</span>
                </div>
              ) : (
                "اختر المراسل..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start" dir="rtl">
            <Command shouldFilter={false} dir="rtl">
              <CommandInput
                placeholder="ابحث باسم المراسل أو البريد..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                data-testid="input-reporter-search"
              />
              <CommandList>
                {isLoading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    جاري التحميل...
                  </div>
                ) : (
                  <>
                    <CommandEmpty data-testid="text-no-reporters">
                      لا يوجد نتائج للمراسل "{searchQuery}"
                    </CommandEmpty>
                    <CommandGroup>
                      {reporters.map((reporter) => (
                        <CommandItem
                          key={reporter.id}
                          value={reporter.id}
                          onSelect={(currentValue) => {
                            console.log('[ReporterSelect] onSelect called:', {
                              currentValue,
                              reporterId: reporter.id,
                              existingValue: value,
                              areEqual: currentValue === value,
                              willSetTo: currentValue === value ? null : currentValue
                            });
                            // Use reporter.id directly instead of currentValue
                            // because CommandItem might transform the value
                            onChange(reporter.id === value ? null : reporter.id);
                            setOpen(false);
                            setSearchQuery("");
                          }}
                          data-testid={`item-reporter-${reporter.id}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={reporter.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(reporter.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start min-w-0">
                              <span className="text-sm font-medium truncate w-full">
                                {reporter.name}
                              </span>
                            </div>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              value === reporter.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {value && !disabled && !isReporterRole && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onChange(null);
              setSearchQuery("");
            }}
            className="shrink-0"
            data-testid="button-clear-reporter"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground" data-testid="text-reporter-helper">
        {isReporterRole 
          ? "سيتم نشر الخبر باسمك كمراسل."
          : "اختر المراسل المسؤول عن هذا الخبر. سيتم إظهار اسمه في بطاقة الخبر وصفحة التفاصيل."
        }
      </p>
    </div>
  );
}
