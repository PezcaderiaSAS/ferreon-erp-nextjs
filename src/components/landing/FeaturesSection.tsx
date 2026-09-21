import React from 'react';
import { Zap, Users, ShieldCheck, BarChart3 } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';

const iconMap = {
  Zap: Zap,
  Users: Users,
  ShieldCheck: ShieldCheck,
  BarChart3: BarChart3,
};

export function FeaturesSection() {
  const { features } = LANDING_CONFIG;

  return (
    <section id="features" className="py-20 md:py-28 relative overflow-hidden bg-slate-950">
      {/* Background Subtle Gradient */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-4">
            {features.badge}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            {features.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            {features.subtitle}
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.items.map((item) => {
            const IconComponent = iconMap[item.iconName];
            return (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 flex flex-col justify-between hover:border-blue-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-blue-600/10 transition-all duration-300 transform-gpu hover:-translate-y-1"
              >
                <div>
                  {/* Icon Card Top */}
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-sm shadow-blue-500/20">
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Highlight Tag */}
                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
                    {item.highlight}
                  </span>
                  <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explorar →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
