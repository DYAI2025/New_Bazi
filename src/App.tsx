import React from "react";
import { BirthData } from "./types";
import { BazodiacClient, getUserFacingErrorTitle, getUserFacingRequestMessage } from "./api/bazodiacClient";
import { ProfileViewModel } from "./viewmodels/profileViewModel";

import PageShell from "./components/PageShell";
import InputForm from "./components/InputForm";
import Overview from "./components/Overview";
import WesternAstrology from "./components/WesternAstrology";
import BaZiDetail from "./components/BaZiDetail";
import WuXingDetail from "./components/WuXingDetail";
import FusionDetail from "./components/FusionDetail";
import DailyPulse from "./components/DailyPulse";
import Synastry from "./components/Synastry";
import Methodology from "./components/Methodology";
import { Sparkles, RefreshCw, Compass } from "lucide-react";

export default function App() {
  // No demo / default profile. The app starts empty on the input tab.
  const [birthData, setBirthData] = React.useState<BirthData | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("input");
  const [viewModel, setViewModel] = React.useState<ProfileViewModel | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [errorTitle, setErrorTitle] = React.useState<string>("Profil konnte nicht geladen werden");

  React.useEffect(() => {
    if (!birthData) return;
    let active = true;
    const loadProfile = async () => {
      setLoading(true);
      setErrorMsg(null);
      setErrorTitle("Profil konnte nicht geladen werden");
      try {
        const compiled = await BazodiacClient.fetchProfile(birthData);
        if (active) setViewModel(compiled);
      } catch (err: any) {
        console.error("Failed to compile profile via client:", err);
        if (active) {
          setErrorTitle(getUserFacingErrorTitle(err));
          setErrorMsg(getUserFacingRequestMessage(err));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [birthData]);

  const handleCalculate = (data: BirthData) => {
    setBirthData(data);
    setActiveTab("overview");
  };

  const renderTab = () => {
    if (activeTab === "input") {
      return <InputForm birthData={birthData} onCalculate={handleCalculate} />;
    }

    if (loading) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className="relative">
            <div className="h-16 w-16 border-2 border-gold-muted border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-gold-light animate-pulse" />
            </div>
          </div>
          <div className="space-y-1 font-sans">
            <h4 className="font-serif text-[#E0D8D0] text-lg font-bold">Kosmische Ephemeriden werden geladen...</h4>
            <p className="text-xs text-stone-400 font-mono italic">Empfange Geburtsdiagramm von der FuFirE-Schnittstelle</p>
          </div>
        </div>
      );
    }

    if (errorMsg) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="text-red-400 font-serif text-3xl font-bold">{errorTitle}</div>
          <p className="text-sm text-stone-400 max-w-md font-sans" data-testid="profile-error">{errorMsg}</p>
          <div className="flex gap-3">
            {birthData && (
              <button
                onClick={() => setBirthData({ ...birthData })}
                className="px-4 py-2 border border-gold-muted/30 text-gold-light rounded font-sans text-xs flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Erneut versuchen</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab("input")}
              className="px-4 py-2 border border-gold-muted/30 text-gold-light rounded font-sans text-xs"
            >
              Zur Eingabe
            </button>
          </div>
        </div>
      );
    }

    if (!viewModel || !birthData) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center space-y-5">
          <Compass className="h-14 w-14 text-stone-600" />
          <div className="space-y-2">
            <h4 className="font-serif text-xl font-bold text-stone-200">Noch kein Profil berechnet</h4>
            <p className="text-xs text-stone-400 max-w-sm font-sans">
              Geben Sie zuerst Ihre Geburtskoordinaten ein, um Ihr Profil aus FuFirE zu beziehen.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("input")}
            className="px-5 py-2.5 border border-gold-muted/30 text-gold-light rounded-lg font-sans text-xs"
          >
            Zur Eingabe
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "overview": return <Overview viewModel={viewModel} onNavigate={setActiveTab} />;
      case "western": return <WesternAstrology viewModel={viewModel} />;
      case "bazi": return <BaZiDetail viewModel={viewModel} />;
      case "wuxing": return <WuXingDetail viewModel={viewModel} />;
      case "fusion": return <FusionDetail viewModel={viewModel} />;
      case "daily": return <DailyPulse viewModel={viewModel} birthData={birthData} />;
      case "synastry": return <Synastry viewModel={viewModel} birthData={birthData} />;
      case "methode": return <Methodology viewModel={viewModel} />;
      default: return <Overview viewModel={viewModel} onNavigate={setActiveTab} />;
    }
  };

  return (
    <PageShell activeTab={activeTab} setActiveTab={setActiveTab} hasBirthData={!!viewModel}>
      {renderTab()}
    </PageShell>
  );
}
