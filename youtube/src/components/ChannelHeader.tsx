import { Avatar, AvatarFallback } from "./ui/avatar";

type ChannelHeaderProps = {
  channel?: {
    _id?: string;
    channelname?: string;
    username?: string;
    description?: string;
  } | null;

  user?: {
    _id?: string;
    id?: string;
    channelname?: string;
  } | null;
};

const ChannelHeader = ({
  channel,
  user,
}: ChannelHeaderProps) => {
  // Get channel name
  const channelName =
    channel?.channelname ??
    user?.channelname ??
    "Tech Channel";

  // Get the first letter for the avatar
  const initials =
    channelName.trim().charAt(0).toUpperCase() || "T";

  // Channel username
  const handle =
    channel?.username ??
    channelName
      .toLowerCase()
      .replace(/\s+/g, "");

  return (
    <div className="border-b bg-white px-6 py-5">
      <div className="flex items-center gap-5">
        {/* Channel Avatar */}
        <Avatar className="h-[90px] w-[90px] shrink-0">
          <AvatarFallback className="bg-gray-100 text-2xl font-normal text-gray-500">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Channel Information */}
        <div className="min-w-0">
          {/* Channel Name */}
          <h1 className="text-[28px] font-bold leading-tight text-black">
            {channelName}
          </h1>

          {/* Channel Username */}
          <p className="mt-1 text-xs text-gray-500">
            @{handle.replace(/^@/, "")}
          </p>

          {/* Channel Description */}
          <p className="mt-2 max-w-[700px] text-xs text-gray-600">
            {channel?.description ??
              "Welcome to our tech channel! We cover the latest in technology, reviews, and tutorials."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;