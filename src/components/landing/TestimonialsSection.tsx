import React from 'react';
import { Star, Quote } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';

export function TestimonialsSection() {
  const { testimonials } = LANDING_CONFIG;

  return (
    <section id="testimonials" className="py-20 md:py-28 relative overflow-hidden bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-sm">
            {testimonials.badge}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            {testimonials.title}
          </h2>
          <p className="text-base text-slate-600 font-normal">
            Resultados tangibles y testimonios de quienes operan en el sector día a día.
          </p>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-slate-50 border border-slate-200 p-7 sm:p-8 flex flex-col justify-between hover:border-slate-300 hover:shadow-lg transition-all duration-300 shadow-sm"
            >
              <div>
                {/* 5 Stars Rating Row */}
                <div className="flex items-center gap-1 text-amber-500 mb-5">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic mb-6">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-slate-200 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {item.author.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {item.author}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.role} · <span className="text-orange-600 font-medium">{item.company}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
