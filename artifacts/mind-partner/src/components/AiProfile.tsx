import React from 'react';

interface AiProfileProps {
  imageUrl?: string;
  name?: string;
  status?: string;
}

export const AiProfile: React.FC<AiProfileProps> = ({
  // Fallback to a placeholder if your generated image URL isn't loaded yet
  imageUrl = "/path-to-your-generated-avatar.png", 
  name = "Ainu",
  status = "Cognitive Partner • Twin Mind"
}) => {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-background border border-border/40 max-w-sm">
      {/* 3D Avatar Image Wrapper */}
      <div className="relative flex-shrink-0">
        <img
          src={imageUrl}
          alt={`${name} Avatar`}
          className="w-16 h-16 rounded-full object-cover border-2 border-[#dfb76c] shadow-[0_4px_12px_rgba(157,78,221,0.3),_0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-300 hover:scale-105"
        />
        {/* Optional: Small pulsing green active indicator */}
        <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
      </div>

      {/* AI Text Information */}
      <div className="flex flex-col min-w-0">
        <h2 className="text-lg font-semibold tracking-wide text-foreground truncate">
          {name}
        </h2>
        <p className="text-xs font-medium text-[#9d4ede] dark:text-[#b370f7] tracking-normal mt-0.5">
          {status}
        </p>
      </div>
    </div>
  );
};
