import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChannelMember {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
}

interface MentionPickerProps {
  channelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (username: string, userId: string) => void;
  searchQuery?: string;
  trigger?: React.ReactNode;
}

export function MentionPicker({
  channelId,
  open,
  onOpenChange,
  onSelect,
  searchQuery = "",
  trigger,
}: MentionPickerProps) {
  const [search, setSearch] = useState(searchQuery);

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  const { data: members, isLoading } = useQuery<ChannelMember[]>({
    queryKey: ["/api/chat/channels", channelId, "members"],
    enabled: open,
  });

  const filteredMembers = members?.filter((member) => {
    const searchTerm = search.toLowerCase();
    return (
      member.name.toLowerCase().includes(searchTerm) ||
      member.username?.toLowerCase().includes(searchTerm)
    );
  });

  const handleSelect = (member: ChannelMember) => {
    const username = member.username || member.name;
    onSelect(username, member.id);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
      <PopoverContent
        className="w-80 p-0"
        align="start"
        data-testid="mention-picker"
        dir="rtl"
      >
        <Command>
          <CommandInput
            placeholder="البحث عن عضو..."
            value={search}
            onValueChange={setSearch}
            data-testid="input-mention-search"
          />
          <CommandList>
            {isLoading && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                جاري التحميل...
              </div>
            )}
            {!isLoading && filteredMembers && filteredMembers.length === 0 && (
              <CommandEmpty data-testid="text-no-members">
                لا يوجد أعضاء
              </CommandEmpty>
            )}
            {!isLoading && filteredMembers && filteredMembers.length > 0 && (
              <CommandGroup>
                {filteredMembers.map((member) => (
                  <CommandItem
                    key={member.id}
                    onSelect={() => handleSelect(member)}
                    className="flex items-center gap-3 cursor-pointer"
                    data-testid={`mention-item-${member.id}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.name}
                      </p>
                      {member.username && (
                        <p className="text-xs text-muted-foreground truncate">
                          @{member.username}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
