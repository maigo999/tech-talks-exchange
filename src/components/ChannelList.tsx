import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Hash, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Channel, ChannelCategory } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface ChannelListProps {
  selectedChannel: string | null;
  onSelectChannel: (channelId: string | null) => void;
}

const ChannelList = ({ selectedChannel, onSelectChannel }: ChannelListProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<ChannelCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Fetch channels and categories from Supabase
  useEffect(() => {
    const fetchChannelsAndCategories = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('channel_categories')
          .select('*')
          .order('display_order', { ascending: true });
          
        if (categoriesError) {
          console.error("カテゴリー取得エラー:", categoriesError);
          return;
        }
        
        // Fetch channels
        const { data: channelsData, error: channelsError } = await supabase
          .from('channels')
          .select('*')
          .order('display_order', { ascending: true });
          
        if (channelsError) {
          console.error("チャンネル取得エラー:", channelsError);
          return;
        }
        
        // Format channels - check that data exists and is not an error
        const formattedChannels: Channel[] = channelsData ? channelsData.map(channel => ({
          id: String(channel.id),
          name: String(channel.name),
          description: String(channel.description),
          icon: channel.icon ? String(channel.icon) : undefined,
          categoryId: String(channel.category_id),
          displayOrder: channel.display_order
        })) : [];
        
        // Format categories - check that data exists and is not an error
        const formattedCategories: ChannelCategory[] = categoriesData ? categoriesData.map(category => {
          const categoryChannels = channelsData 
            ? channelsData
                .filter(channel => channel.category_id === category.id)
                .map(channel => String(channel.id))
            : [];
            
          return {
            id: String(category.id),
            name: String(category.name),
            channels: categoryChannels
          };
        }) : [];
        
        setChannels(formattedChannels);
        setCategories(formattedCategories);
        
        // Initially expand all categories
        const initialExpandedState = formattedCategories.reduce((acc, category) => {
          acc[category.id] = true;
          return acc;
        }, {} as Record<string, boolean>);
        
        setExpandedCategories(initialExpandedState);
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChannelsAndCategories();
  }, []);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Group channels by category
  const channelsByCategory = categories.map(category => {
    const categoryChannels = channels.filter(channel => channel.categoryId === category.id);
    return {
      category,
      channels: categoryChannels
    };
  });

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">チャンネルを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2">
        <div className="relative flex flex-col items-center mb-1">
          <div className="w-full flex items-center justify-between">
            <div className="w-7"></div> {/* 左側のスペーサー */}
            <h2 className="text-xl font-semibold tracking-tight">チャンネル</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            テックコミュニティに参加して、
            <br className="md:hidden" />
            学び、共有しましょう
          </p>
        </div>
      </div>
      <Separator className="my-2" />
      <ScrollArea className="flex-1 px-1">
        <div className="space-y-0.5 pt-1 pb-1 pl-4 pr-4 md:p-1 ">
          <Button
            variant={!selectedChannel ? "secondary" : "ghost"}
            className="w-full justify-start font-normal text-base pl-[0.3rem] py-2 md:py-1 h-8 "
            onClick={() => onSelectChannel(null)}
          >
            <Hash className="mr-2 h-5 w-5" />
            すべてのチャンネル
          </Button>
          
          {/* Display channels grouped by category */}
          {channelsByCategory.map(({ category, channels }) => (
            <div key={category.id} className="mt-1">
              <Collapsible
                open={expandedCategories[category.id]}
                onOpenChange={() => toggleCategory(category.id)}
                className="space-y-0.5"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between font-medium text-base pl-1 py-2 md:py-0.5 h-auto md:h-7 hover:bg-secondary/50"
                  >
                    <div className="flex items-center min-w-0">
                      {expandedCategories[category.id] ? (
                        <ChevronDown className="mr-1 h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="mr-1 h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate min-w-0">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">
                      {channels.length}
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 pl-2">
                  {channels.map((channel) => (
                    <ChannelButton
                      key={channel.id}
                      channel={channel}
                      isSelected={selectedChannel === channel.id}
                      onClick={() => onSelectChannel(channel.id)}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

interface ChannelButtonProps {
  channel: Channel;
  isSelected: boolean;
  onClick: () => void;
}

const ChannelButton = ({ channel, isSelected, onClick }: ChannelButtonProps) => {
  return (
    <Button
      variant={isSelected ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start font-normal text-base py-0.5 h-7 transition-all",
        isSelected ? "bg-secondary" : "hover:bg-secondary/50"
      )}
      onClick={onClick}
    >
      <span className="mr-2 text-lg">{channel.icon || "#"}</span>
      <span className="truncate break-words whitespace-normal text-left">
        {channel.name}
      </span>
    </Button>
  );
};

export default ChannelList;
