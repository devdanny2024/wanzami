import { useState } from "react";
import { 
  Monitor, Globe, Subtitles, Volume2, Bell, Lock, 
  Smartphone, Trash2, HelpCircle, LogOut 
} from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { FocusableButton } from "../components/FocusableButton";

export function Settings() {
  const { isTv, isPortrait } = useDevice();

  return (
    <div className={`min-h-screen ${isTv ? "px-20 py-16" : isPortrait ? "px-6 py-8" : "px-12 py-12"}`}>
      <h1 className={`text-white font-bold mb-12 ${isTv ? "text-6xl" : "text-4xl"}`}>
        Settings
      </h1>

      <div className="max-w-5xl space-y-6">
        {/* Playback Settings */}
        <SettingsSection title="Playback" icon={Monitor}>
          <SettingItem label="Video Quality" isTv={isTv}>
            <select className={`
              bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5
              text-white focus:outline-none focus:border-[#E63946]
              ${isTv ? "text-xl min-w-[200px]" : "text-base"}
            `}>
              <option>Auto</option>
              <option>4K (2160p)</option>
              <option>Full HD (1080p)</option>
              <option>HD (720p)</option>
              <option>SD (480p)</option>
            </select>
          </SettingItem>

          <SettingItem label="Autoplay next episode" isTv={isTv}>
            <Toggle defaultChecked />
          </SettingItem>

          <SettingItem label="Autoplay previews" isTv={isTv}>
            <Toggle defaultChecked />
          </SettingItem>

          <SettingItem label="Data usage" isTv={isTv}>
            <select className={`
              bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5
              text-white focus:outline-none focus:border-[#E63946]
              ${isTv ? "text-xl min-w-[200px]" : "text-base"}
            `}>
              <option>Auto</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </SettingItem>
        </SettingsSection>

        {/* Language Settings */}
        <SettingsSection title="Language & Region" icon={Globe}>
          <SettingItem label="Display Language" isTv={isTv}>
            <select className={`
              bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5
              text-white focus:outline-none focus:border-[#E63946]
              ${isTv ? "text-xl min-w-[200px]" : "text-base"}
            `}>
              <option>English</option>
              <option>Français</option>
              <option>Português</option>
              <option>Kiswahili</option>
              <option>العربية</option>
            </select>
          </SettingItem>

          <SettingItem label="Audio Language" isTv={isTv}>
            <select className={`
              bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5
              text-white focus:outline-none focus:border-[#E63946]
              ${isTv ? "text-xl min-w-[200px]" : "text-base"}
            `}>
              <option>English</option>
              <option>Français</option>
              <option>Original</option>
            </select>
          </SettingItem>
        </SettingsSection>

        {/* Subtitles Settings */}
        <SettingsSection title="Subtitles & Captions" icon={Subtitles}>
          <SettingItem label="Subtitle Language" isTv={isTv}>
            <select className={`
              bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5
              text-white focus:outline-none focus:border-[#E63946]
              ${isTv ? "text-xl min-w-[200px]" : "text-base"}
            `}>
              <option>Off</option>
              <option>English</option>
              <option>Français</option>
              <option>Português</option>
              <option>Kiswahili</option>
              <option>Yoruba</option>
              <option>isiZulu</option>
            </select>
          </SettingItem>

          <SettingItem label="Subtitle Size" isTv={isTv}>
            <select className={`
              bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5
              text-white focus:outline-none focus:border-[#E63946]
              ${isTv ? "text-xl min-w-[200px]" : "text-base"}
            `}>
              <option>Small</option>
              <option>Medium</option>
              <option>Large</option>
              <option>Extra Large</option>
            </select>
          </SettingItem>

          <SettingItem label="Closed Captions" isTv={isTv}>
            <Toggle />
          </SettingItem>
        </SettingsSection>

        {/* Audio Settings */}
        <SettingsSection title="Audio" icon={Volume2}>
          <SettingItem label="Volume Boost" isTv={isTv}>
            <Toggle />
          </SettingItem>

          <SettingItem label="Surround Sound" isTv={isTv}>
            <Toggle defaultChecked />
          </SettingItem>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={Bell}>
          <SettingItem label="New episodes" isTv={isTv}>
            <Toggle defaultChecked />
          </SettingItem>

          <SettingItem label="Live events starting soon" isTv={isTv}>
            <Toggle defaultChecked />
          </SettingItem>

          <SettingItem label="Recommendations" isTv={isTv}>
            <Toggle />
          </SettingItem>

          <SettingItem label="Special offers" isTv={isTv}>
            <Toggle />
          </SettingItem>
        </SettingsSection>

        {/* Parental Controls */}
        <SettingsSection title="Parental Controls" icon={Lock}>
          <SettingItem label="Enable Parental Controls" isTv={isTv}>
            <Toggle />
          </SettingItem>

          <SettingItem label="Content Rating Limit" isTv={isTv}>
            <select className={`
              bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5
              text-white focus:outline-none focus:border-[#E63946]
              ${isTv ? "text-xl min-w-[200px]" : "text-base"}
            `}>
              <option>All Ages</option>
              <option>PG</option>
              <option>13+</option>
              <option>16+</option>
              <option>18+</option>
            </select>
          </SettingItem>

          <SettingItem label="Require PIN for mature content" isTv={isTv}>
            <Toggle />
          </SettingItem>
        </SettingsSection>

        {/* Device Management */}
        <SettingsSection title="Device Management" icon={Smartphone}>
          <div className="space-y-3">
            {[
              { name: "Samsung Smart TV", location: "Living Room", current: true },
              { name: "iPad Pro", location: "Last active 2 days ago", current: false },
              { name: "iPhone 14", location: "Last active 1 week ago", current: false },
            ].map((device, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#0A0A0F] rounded-xl">
                <div className="flex items-center gap-4">
                  <Monitor className="w-6 h-6 text-white/60" />
                  <div>
                    <p className={`text-white font-semibold ${isTv ? "text-xl" : "text-base"}`}>
                      {device.name}
                    </p>
                    <p className={`text-white/60 ${isTv ? "text-lg" : "text-sm"}`}>
                      {device.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {device.current && (
                    <span className="px-3 py-1.5 bg-[#E63946]/20 text-[#E63946] rounded-lg text-sm font-semibold">
                      This Device
                    </span>
                  )}
                  {!device.current && (
                    <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className={`
            mt-4 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white
            font-semibold transition-colors border border-white/10
            ${isTv ? "text-xl" : "text-base"}
          `}>
            Sign out all devices
          </button>
        </SettingsSection>

        {/* Help & Support */}
        <SettingsSection title="Help & Support" icon={HelpCircle}>
          <button className={`
            w-full flex items-center justify-between p-4 bg-[#0A0A0F] hover:bg-white/5
            rounded-xl text-white transition-colors
          `}>
            <span className={isTv ? "text-xl" : "text-base"}>Help Center</span>
            <span className="text-white/40">→</span>
          </button>

          <button className={`
            w-full flex items-center justify-between p-4 bg-[#0A0A0F] hover:bg-white/5
            rounded-xl text-white transition-colors
          `}>
            <span className={isTv ? "text-xl" : "text-base"}>Contact Support</span>
            <span className="text-white/40">→</span>
          </button>

          <button className={`
            w-full flex items-center justify-between p-4 bg-[#0A0A0F] hover:bg-white/5
            rounded-xl text-white transition-colors
          `}>
            <span className={isTv ? "text-xl" : "text-base"}>Terms of Service</span>
            <span className="text-white/40">→</span>
          </button>

          <button className={`
            w-full flex items-center justify-between p-4 bg-[#0A0A0F] hover:bg-white/5
            rounded-xl text-white transition-colors
          `}>
            <span className={isTv ? "text-xl" : "text-base"}>Privacy Policy</span>
            <span className="text-white/40">→</span>
          </button>
        </SettingsSection>

        {/* Account Actions */}
        <div className="pt-8 border-t border-white/10">
          <FocusableButton
            id="settings-logout"
            onClick={() => {}}
            className={`
              w-full flex items-center justify-center gap-3 p-5 bg-red-500/10 hover:bg-red-500/20
              rounded-xl text-red-500 font-semibold transition-colors border border-red-500/20
              ${isTv ? "text-2xl" : "text-lg"}
            `}
          >
            <LogOut className="w-6 h-6" />
            Sign Out
          </FocusableButton>

          <p className={`text-center text-white/40 mt-6 ${isTv ? "text-lg" : "text-sm"}`}>
            Version 2.4.1 • Build 2024.02
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode;
}) {
  const { isTv } = useDevice();

  return (
    <div className="bg-[#0F0F14] rounded-2xl p-8 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Icon className={`${isTv ? "w-8 h-8" : "w-6 h-6"} text-[#E63946]`} />
        <h3 className={`text-white font-semibold ${isTv ? "text-3xl" : "text-xl"}`}>
          {title}
        </h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function SettingItem({ 
  label, 
  children,
  isTv 
}: { 
  label: string; 
  children: React.ReactNode;
  isTv: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-white ${isTv ? "text-xl" : "text-base"}`}>
        {label}
      </span>
      {children}
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  return (
    <label className="relative inline-block w-14 h-8">
      <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
      <div className="w-14 h-8 bg-white/10 peer-checked:bg-[#E63946] rounded-full peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all cursor-pointer"></div>
    </label>
  );
}
