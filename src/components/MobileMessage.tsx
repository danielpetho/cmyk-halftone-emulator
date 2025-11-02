import { Button } from "./ui/button";
import { ArrowLeft, Monitor } from "lucide-react";

interface MobileMessageProps {
  onReset: () => void;
}

export function MobileMessage({ onReset }: MobileMessageProps) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-6 bg-muted">
            <Monitor className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>
        
        {/* Message */}
        <div className="space-y-4">
          <h1 className="uppercase">Desktop Required</h1>
          <p className="text-muted-foreground">
            Please open this tool on a desktop or tablet device. Mobile support is coming soon.
          </p>
        </div>
        
        {/* Back button */}
        <Button 
          onClick={onReset}
          variant="outline"
          className="w-full cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}