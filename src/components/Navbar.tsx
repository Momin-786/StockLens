import { Moon, Sun, TrendingUp, FlaskConical, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import stocklensLogo from "@/assets/stocklensLOGO.png";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    // Redirect to auth if not logged in and not on landing or auth page
    if (!loading && !user && location.pathname !== "/" && location.pathname !== "/auth") {
      navigate("/auth");
    }
  }, [user, loading, location.pathname, navigate]);
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");

  };

  const isActive = (path: string) => location.pathname === path;

  // Market status logic with timer
  const [marketStatus, setMarketStatus] = useState<{
    isOpen: boolean;
    timeRemaining: string;
    label: string;
  }>({ isOpen: false, timeRemaining: "", label: "Loading..." });

  useEffect(() => {
    const calculateMarketStatus = () => {
      const now = new Date();
      // Get EST time string
      const estTimeStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
      const estDate = new Date(estTimeStr);

      const day = estDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const hours = estDate.getHours();
      const minutes = estDate.getMinutes();
      const seconds = estDate.getSeconds();

      // Calculate current time in minutes from midnight
      const currentMinutes = hours * 60 + minutes;
      const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM = 570
      const marketCloseMinutes = 16 * 60;    // 4:00 PM = 960

      let isOpen = false;
      let targetDate = new Date(estDate);
      let label = "";

      // Check if it's a weekend
      const isWeekend = day === 0 || day === 6;

      if (!isWeekend) {
        if (currentMinutes >= marketOpenMinutes && currentMinutes < marketCloseMinutes) {
          // Market is OPEN
          isOpen = true;
          // Target is today 4:00 PM
          targetDate.setHours(16, 0, 0, 0);
          label = "Closes in";
        } else if (currentMinutes < marketOpenMinutes) {
          // Market is CLOSED, opens today
          isOpen = false;
          // Target is today 9:30 AM
          targetDate.setHours(9, 30, 0, 0);
          label = "Opens in";
        } else {
          // Market is CLOSED, opens tomorrow (or Monday if Friday)
          isOpen = false;
          targetDate.setDate(targetDate.getDate() + 1);
          targetDate.setHours(9, 30, 0, 0);
          label = "Opens in";

          // If it's Friday afternoon (day 5), next open is Monday
          if (day === 5) {
            targetDate.setDate(targetDate.getDate() + 2); // Fri + 1 = Sat, + 2 = Sun (wait, Need to add 3 to get Mon?)
            // logic: Fri (5) + 1 = Sat. We want Mon. 
            // Actually, we already added 1 to get "tomorrow" (Sat). 
            // So if tomorrow is Sat (6), add 2 days to get Mon (1).
            // Let's reset and handle simpler:
          }
        }
      } else {
        // It is Weekend
        isOpen = false;
        label = "Opens in";
        // If Saturday (6), add 2 days to get Monday
        // If Sunday (0), add 1 day to get Monday
        const daysToAdd = day === 6 ? 2 : 1;
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        targetDate.setHours(9, 30, 0, 0);
      }

      // Fix for Friday after close logic above which was a bit messy
      if (day === 5 && currentMinutes >= marketCloseMinutes) {
        // It's Friday after 4PM.
        // Target was set to Tomorrow (Sat) 9:30 above.
        // We need to add 2 more days to make it Monday.
        targetDate.setDate(targetDate.getDate() + 2);
      }

      // Calculate difference
      const diff = targetDate.getTime() - estDate.getTime();

      // Format time remaining or target time
      if (diff > 0) {

        // Format target time in 12h format
        const targetTimeStr = targetDate.toLocaleTimeString("en-US", {
          timeZone: "America/New_York",
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        const newLabel = isOpen ? "Closes at" : "Opens at";

        setMarketStatus({
          isOpen,
          timeRemaining: targetTimeStr,
          label: newLabel
        });
      } else {
        setMarketStatus({ isOpen, timeRemaining: "", label });
      }
    };

    calculateMarketStatus();
    const interval = setInterval(calculateMarketStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <img src={stocklensLogo} alt="StockLens Logo" className="h-10 w-auto" />
                    <span className="font-heading font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      StockLens
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {!user && (
                    <Link
                      to="/"
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive("/")
                        ? "text-secondary bg-secondary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                    >
                      Home
                    </Link>
                  )}
                  <Link
                    to="/stocks"
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive("/stocks")
                      ? "text-secondary bg-secondary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    Stocks
                  </Link>
                  <Link
                    to="/comparison"
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive("/comparison")
                      ? "text-secondary bg-secondary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    Compare
                  </Link>
                  <Link
                    to="/analysis"
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive("/analysis")
                      ? "text-secondary bg-secondary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    Analysis
                  </Link>
                  <Link
                    to="/portfolio"
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive("/portfolio")
                      ? "text-secondary bg-secondary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    Portfolio
                  </Link>
                  <Link
                    to="/profile"
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive("/profile")
                      ? "text-secondary bg-secondary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    Profile
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link to={user ? "/stocks" : "/"} className="flex items-center gap-2 hover-scale group">
            <img src={stocklensLogo} alt="StockLens Logo" className="h-10 w-auto" />
            <span className="text-xl font-heading font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              StockLens
            </span>
          </Link>

          {/* Market Status Indicator - Desktop */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-border/50 text-xs font-medium">
            <div className={`h-2 w-2 rounded-full ${marketStatus.isOpen ? "bg-success animate-pulse shadow-[0_0_8px_hsl(var(--success))]" : "bg-muted-foreground"}`} />
            <span className={marketStatus.isOpen ? "text-success font-semibold" : "text-muted-foreground"}>
              {marketStatus.isOpen ? "Market Open" : "Market Closed"}
              <span className="ml-1 opacity-80 font-normal">
                ({marketStatus.label} {marketStatus.timeRemaining})
              </span>
            </span>
          </div>
        </div>





        <div className="hidden md:flex items-center gap-1">
          {!user && (
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/")
                ? "text-secondary bg-secondary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              Home
            </Link>
          )}
          <Link
            to="/stocks"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/stocks")
              ? "text-secondary bg-secondary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
          >
            Stocks
          </Link>
          {/* <Link
            to="/screener"
            className={`text-sm font-medium transition-colors hover:text-secondary ${
              isActive("/screener") ? "text-secondary" : "text-muted-foreground"
            }`}
          >
            Screener
          </Link> */}
          <Link
            to="/comparison"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/comparison")
              ? "text-secondary bg-secondary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
          >
            Compare
          </Link>
          <Link
            to="/analysis"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/analysis")
              ? "text-secondary bg-secondary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
          >
            Analysis
          </Link>
          <Link
            to="/portfolio"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/portfolio")
              ? "text-secondary bg-secondary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
          >
            Portfolio
          </Link>
          <Link
            to="/profile"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/profile")
              ? "text-secondary bg-secondary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
          >
            Profile
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="hover:bg-secondary/20 hover:text-foreground transition-colors"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          {user ? (
            <>
              <FeedbackDialog />
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="gap-2 hover:bg-secondary/20 hover:text-foreground border-2 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex border-2 hover:bg-secondary/20 hover:text-foreground transition-colors"
                onClick={() => navigate("/auth")}
              >
                Login
              </Button>
              <Button
                size="sm"
                className="bg-secondary hover:bg-secondary/90 shadow-sm"
                onClick={() => navigate("/auth")}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
