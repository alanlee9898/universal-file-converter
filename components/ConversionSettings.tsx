'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface ConversionSettingsProps {
  settings: {
    quality: number;
    width: number;
    height: number;
    maintainAspectRatio: boolean;
    compressionLevel: number;
  };
  onSettingsChange: (settings: any) => void;
}

export function ConversionSettings({ settings, onSettingsChange }: ConversionSettingsProps) {
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Conversion Settings</CardTitle>
        <CardDescription>
          Configure quality, dimensions, and compression options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quality</Label>
          <div className="px-3">
            <Slider
              value={[settings.quality]}
              onValueChange={([value]) => updateSetting('quality', value)}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low (1)</span>
              <span className="font-medium">{settings.quality}%</span>
              <span>High (100)</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Dimension Settings */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Dimensions</Label>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="aspect-ratio"
              checked={settings.maintainAspectRatio}
              onCheckedChange={(checked) => updateSetting('maintainAspectRatio', checked)}
            />
            <Label htmlFor="aspect-ratio" className="text-sm">
              Maintain aspect ratio
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width" className="text-sm">Width (px)</Label>
              <Input
                id="width"
                type="number"
                placeholder="Auto"
                value={settings.width || ''}
                onChange={(e) => updateSetting('width', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-sm">Height (px)</Label>
              <Input
                id="height"
                type="number"
                placeholder="Auto"
                value={settings.height || ''}
                onChange={(e) => updateSetting('height', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Leave empty for original dimensions. Only applies to images and videos.
          </p>
        </div>

        <Separator />

        {/* Compression Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Compression Level</Label>
          <div className="px-3">
            <Slider
              value={[settings.compressionLevel]}
              onValueChange={([value]) => updateSetting('compressionLevel', value)}
              max={9}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>None (0)</span>
              <span className="font-medium">{settings.compressionLevel}</span>
              <span>Max (9)</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Higher compression reduces file size but may affect quality
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onSettingsChange({
                quality: 95,
                width: 0,
                height: 0,
                maintainAspectRatio: true,
                compressionLevel: 2
              })}
              className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 rounded-md transition-colors"
            >
              High Quality
            </button>
            <button
              onClick={() => onSettingsChange({
                quality: 80,
                width: 0,
                height: 0,
                maintainAspectRatio: true,
                compressionLevel: 6
              })}
              className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 rounded-md transition-colors"
            >
              Balanced
            </button>
            <button
              onClick={() => onSettingsChange({
                quality: 60,
                width: 0,
                height: 0,
                maintainAspectRatio: true,
                compressionLevel: 9
              })}
              className="px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 rounded-md transition-colors"
            >
              Small Size
            </button>
            <button
              onClick={() => onSettingsChange({
                quality: 80,
                width: 1920,
                height: 1080,
                maintainAspectRatio: true,
                compressionLevel: 6
              })}
              className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 rounded-md transition-colors"
            >
              Web Optimized
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
