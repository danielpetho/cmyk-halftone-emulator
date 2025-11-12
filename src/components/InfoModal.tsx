import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Info, ExternalLink } from "lucide-react";

export function InfoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Always render, but adjust positioning for mobile

  return (
    <>
      {/* Info button in bottom-right corner */}
      <div className={`fixed ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} z-50`}>
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="bg-background border border-border hover:bg-accent cursor-pointer"
          variant="outline"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md text-left">
          <DialogHeader>
            <DialogTitle className="uppercase text-primary text-left">CMYK Halftone Emulator</DialogTitle>
            <DialogDescription>
              This minitool was created for the 2025 Figma Make-a-thon event.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 text-sm">
            <p>
              This tool emulates CMYK halftone printing using WebGL shaders. 
              For more details about halftone printing, check the{" "}
              <a 
                href="https://en.wikipedia.org/wiki/Halftone" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline inline-flex items-center gap-1"
              >
                Wikipedia article
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>

            <div className="space-y-3 text-muted-foreground">
              <div>
                <p className="uppercase text-xs mb-1 text-primary">Shader Credits</p>
                <p>
                  The halftone shader is largely based on{" "}
                  <a 
                    href="https://www.shadertoy.com/view/fdjyR1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline inline-flex items-center gap-1"
                  >
                    Steven Gustavson's work
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <div>
                <p className="uppercase text-xs mb-1 text-primary">UI Components</p>
                <p>
                  Marquee component from{" "}
                  <a 
                    href="https://fancycomponents.dev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline inline-flex items-center gap-1"
                  >
                    fancycomponents.dev
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <div>
                <p className="uppercase text-xs mb-1 text-primary">Sample Images</p>
                <p>
                  Landing page images generated with{" "}
                  <a 
                    href="https://krea.ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline inline-flex items-center gap-1"
                  >
                    krea.ai
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {" "}and processed with this tool
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-center text-muted-foreground">
                Built with ❤️ by <a className="text-foreground" href="https://x.com/nonzeroexitcode">Daniel Petho</a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}