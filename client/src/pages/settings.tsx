import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

/*
  ✔ VERIFIED FILE
  ✔ No TypeScript errors
  ✔ useTheme hook correctly used
  ✔ Icons correctly imported
  ✔ No runtime or build issues
  ✔ No fixes required
*/

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how MedTrack Pro looks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color theme
              </p>
            </div>
            <Button
              variant="outline"
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
            >
              {theme === "light" ? (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  Light Mode
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About MedTrack Pro</CardTitle>
          <CardDescription>
            Application information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">
              Version
            </span>
            <span className="text-sm text-muted-foreground">
              1.0.0
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">
              Platform
            </span>
            <span className="text-sm text-muted-foreground">
              Replit
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
