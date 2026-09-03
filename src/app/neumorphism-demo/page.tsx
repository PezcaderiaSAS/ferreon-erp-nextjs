'use client';
import React, { useState } from 'react';
import { NeuButton } from '@/components/ui/neumorphism/NeuButton';
import { NeuCard } from '@/components/ui/neumorphism/NeuCard';
import { NeuInput } from '@/components/ui/neumorphism/NeuInput';
import { NeuToggle } from '@/components/ui/neumorphism/NeuToggle';
import { NeuProgress } from '@/components/ui/neumorphism/NeuProgress';
import { User, Image as ImageIcon } from 'lucide-react';

export default function NeumorphismDemoPage() {
  const [toggleOn, setToggleOn] = useState(false);
  const [progress, setProgress] = useState(70);

  return (
    <div className="min-h-screen bg-brand-salmonLight flex flex-col items-center p-8 md:p-16 font-sans">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-brand-salmonDark drop-shadow-sm mb-4">
          Neumorphism UI
        </h1>
        <p className="text-slate-600 font-medium">Tema Dinámico: Salmón Pastel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 w-full max-w-6xl">
        
        {/* 1. Neumorphic Button */}
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-bold text-slate-500 text-center">1. NEUMORPHIC BUTTON</h2>
          <div className="flex-1 flex items-center justify-center">
            <NeuButton onClick={() => alert('¡Botón Neumórfico Clicked!')}>
              Click Me
            </NeuButton>
          </div>
          <p className="text-sm text-slate-500 text-center px-4">
            A soft, extruded button with subtle salmon shadows.
          </p>
        </div>

        {/* 2. Neumorphic Card */}
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-bold text-slate-500 text-center">2. NEUMORPHIC CARD</h2>
          <div className="flex-1 flex items-center justify-center px-4">
            <NeuCard title="Card Title" icon={<ImageIcon className="w-8 h-8" />}>
              This is a neumorphic card with modern soft UI effect in pastel salmon.
            </NeuCard>
          </div>
        </div>

        {/* 3. Neumorphic Toggle */}
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-bold text-slate-500 text-center">3. NEUMORPHIC TOGGLE</h2>
          <div className="flex-1 flex items-center justify-center">
            <NeuToggle isOn={toggleOn} onToggle={setToggleOn} />
          </div>
          <p className="text-sm text-slate-500 text-center px-4">
            A smooth toggle switch with neumorphic effect.
          </p>
        </div>

        {/* 4. Neumorphic Input */}
        <div className="flex flex-col gap-6 lg:col-span-1 lg:col-start-2">
          <h2 className="text-lg font-bold text-slate-500 text-center">4. NEUMORPHIC INPUT FIELD</h2>
          <div className="flex-1 flex items-center justify-center px-6">
            <NeuInput placeholder="Enter your name..." icon={<User className="w-5 h-5" />} />
          </div>
          <p className="text-sm text-slate-500 text-center px-4">
            A soft input field for better user experience.
          </p>
        </div>

        {/* 5. Neumorphic Progress Bar */}
        <div className="flex flex-col gap-6 lg:col-span-1 lg:col-start-3">
          <h2 className="text-lg font-bold text-slate-500 text-center">5. NEUMORPHIC PROGRESS BAR</h2>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
            <NeuProgress progress={progress} />
            
            {/* Controles para probar la barra de progreso */}
            <div className="flex gap-2">
              <NeuButton className="!px-4 !py-2 text-sm" onClick={() => setProgress(p => Math.max(0, p - 10))}>-</NeuButton>
              <NeuButton className="!px-4 !py-2 text-sm" onClick={() => setProgress(p => Math.min(100, p + 10))}>+</NeuButton>
            </div>
          </div>
          <p className="text-sm text-slate-500 text-center px-4">
            A sleek progress bar with soft neumorphic look.
          </p>
        </div>

      </div>
    </div>
  );
}
