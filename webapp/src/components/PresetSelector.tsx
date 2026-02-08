import { useState, useEffect, useCallback } from "react";
import { Save, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  type Preset,
  type PresetValues,
  loadPresets,
  addPreset,
  deletePreset,
} from "../lib/presets";

interface PresetSelectorProps {
  /** Extract current settings as a PresetValues object */
  getCurrentValues: () => PresetValues;
  /** Apply a PresetValues object to the current settings */
  applyValues: (values: PresetValues) => void;
  /** Reset to factory defaults */
  onResetDefaults: () => void;
}

const DEFAULT_PRESET_ID = "__default__";

export function PresetSelector({
  getCurrentValues,
  applyValues,
  onResetDefaults,
}: PresetSelectorProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_PRESET_ID);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Load presets from localStorage on mount
  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (id === DEFAULT_PRESET_ID) {
        onResetDefaults();
      } else {
        const preset = presets.find((p) => p.id === id);
        if (preset) {
          applyValues(preset.values);
        }
      }
    },
    [presets, applyValues, onResetDefaults]
  );

  const handleSave = useCallback(() => {
    const name = saveName.trim();
    if (!name) return;

    const values = getCurrentValues();
    const preset = addPreset(name, values);
    const updated = loadPresets();
    setPresets(updated);
    setSelectedId(preset.id);
    setSaveName("");
    setSaveOpen(false);
  }, [saveName, getCurrentValues]);

  const handleDelete = useCallback(() => {
    if (selectedId === DEFAULT_PRESET_ID) return;

    deletePreset(selectedId);
    const updated = loadPresets();
    setPresets(updated);
    setSelectedId(DEFAULT_PRESET_ID);
    onResetDefaults();
  }, [selectedId, onResetDefaults]);

  return (
    <div className="flex items-center" style={{ gap: "6px" }}>
      <Select value={selectedId} onValueChange={handleSelect}>
        <SelectTrigger style={{ flex: 1, minWidth: 0 }} className="text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_PRESET_ID}>Default</SelectItem>
          {presets.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Save button with popover */}
      <Popover open={saveOpen} onOpenChange={setSaveOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer shrink-0"
            style={{ width: "32px", height: "32px" }}
            title="Save preset"
          >
            <Save style={{ width: "14px", height: "14px" }} />
          </Button>
        </PopoverTrigger>
        <PopoverContent style={{ width: "220px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Label className="text-xs">Preset name</Label>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="My preset"
              className="text-sm"
              autoFocus
            />
            <Button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="w-full cursor-pointer"
              size="sm"
            >
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete button */}
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer shrink-0"
        style={{ width: "32px", height: "32px" }}
        onClick={handleDelete}
        disabled={selectedId === DEFAULT_PRESET_ID}
        title="Delete preset"
      >
        <Trash2 style={{ width: "14px", height: "14px" }} />
      </Button>
    </div>
  );
}
