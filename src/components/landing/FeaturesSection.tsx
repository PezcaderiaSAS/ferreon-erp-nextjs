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
    <section id="features" className="py-20 md:py-28 relative overflow-hidden bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-sm">
            {features.badge}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            {features.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
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
                className="group relative rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between hover:border-orange-400 hover:shadow-lg transition-all duration-300 transform-gpu hover:-translate-y-1 shadow-sm"
              >
                <div>
                  {/* Icon Card Top */}
                  <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-amber-500 group-hover:text-white transition-all duration-200 shadow-sm">
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Highlight Tag */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
                    {item.highlight}
                  </span>
                  <span className="text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
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
